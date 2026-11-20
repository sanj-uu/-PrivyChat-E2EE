import { DoubleRatchet } from "../crypto/ratchet.js";
import { deriveSharedSecret } from "../crypto/x3dh.js";
import { encryptMessage, decryptMessage } from "../crypto/encrypt.js";
import { saveRatchet, loadRatchet, deleteRatchet } from "./db.js";
//  RESEARCH DATA COLLECTION
window.encResults = [];
window.decResults = [];


/* ---------- USER ---------- */

const myUserId = localStorage.getItem("chatUser");
if (!myUserId) {
  alert("Please login first");
  window.location.href = "/auth/login.html";
  throw new Error("Not logged in");
}

// for testing 
console.log("LOGGED IN AS:", myUserId);


/* ---------- SOCKET ---------- */

const socket = io();
window.socket = socket;
socket.emit("register", myUserId);




//for auto reconnect keep the session
socket.on("connect", () => {
  console.log("Socket connected, registering user:", myUserId);
  socket.emit("register", myUserId);
});

/* ---------- SESSION STORE ---------- */
// peerUsername -> DoubleRatchet
const sessions = {};

/* ---------- UI ---------- */

const messages = document.getElementById("messages");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const toUserInput = document.getElementById("toUser");

function addMessage(text) {
  const p = document.createElement("p");
  p.textContent = text;
  messages.appendChild(p);
  messages.scrollTop = messages.scrollHeight;
}

/* ---------- SEND (AUTO INITIATOR) ---------- */

async function sendMessage(text, toUser) {
  

  if (!sessions[toUser]) {
    socket.emit("get-prekeys", toUser, async (data) => {
      console.log("Fetched prekeys for", toUser, data);
      if (!data) {
        alert("Receiver has no prekeys");
        return;
      }

      const receiverPrekey = await crypto.subtle.importKey(
        "jwk",
        data.prekey,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
      );

      const myPrivateKey = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(localStorage.getItem("identityKey")),
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveBits"]
      );

      // DEMO: symmetric bootstrap secret
      const sharedSecret = new Uint8Array(32).fill(7);

      const ratchet = new DoubleRatchet();
      await ratchet.initSession(sharedSecret, true);
      sessions[toUser] = ratchet;

      // ✅ now send message
      await sendMessage(text, toUser);
    });

    return;
  }

  const ratchet = sessions[toUser];

  const encStart = performance.now();
  const msgKey = await ratchet.nextSendMessageKey();
  const payload = await encryptMessage(text, msgKey);
  const encEnd = performance.now();
  // STORE ENCRYPTION RESULT (FOR PAPER)
  window.encResults.push({
    size: new TextEncoder().encode(text).length, // message size in bytes
    time: encEnd - encStart                      // encryption time (ms)
  });

  console.log("Encryption Time (ms):", (encEnd - encStart).toFixed(2));

  socket.emit("message", {
    from: myUserId,
    to: toUser,
    payload: {
      ciphertext: payload,
      prekey: JSON.parse(localStorage.getItem("myPrekeyPublic"))
    },
   ts: Date.now()
 });


  await saveRatchet(toUser, sessions[toUser]);
  addMessage(`Me → ${toUser}: ${text}`);
}

sendBtn.onclick = async () => {
  const text = input.value.trim();
  const toUser = toUserInput.value.trim();
  if (!text || !toUser) return;

  await sendMessage(text, toUser);
  input.value = "";
};


/* ---------- RECEIVE (AUTO RESPONDER) ---------- */

socket.on("message", async ({ from, payload }) => {

  // 🔐 INIT SESSION ONLY ON FIRST MESSAGE
  if (!sessions[from]) {

    // ✅ SAFETY: prekey MUST exist for first message
    if (!payload.prekey) {
      console.warn("Missing sender prekey, cannot init session");
      addMessage(`⚠️ Secure session with ${from} could not be established`);
      return;
    }

    const myPrivate = await crypto.subtle.importKey(
      "jwk",
      JSON.parse(localStorage.getItem("identityKey")),
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"]
    );

    const senderPrekey = await crypto.subtle.importKey(
      "jwk",
      payload.prekey,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
    

    // DEMO: same symmetric bootstrap secret
    const sharedSecret = new Uint8Array(32).fill(7);

    const ratchet = new DoubleRatchet();
    await ratchet.initSession(sharedSecret, false); // responder
    sessions[from] = ratchet;
  }

  try {
    // ⏱️ START decryption timing
    const decStart = performance.now();

    const msgKey = await sessions[from].nextReceiveMessageKey();
    const text = await decryptMessage(payload.ciphertext, msgKey);

    //END decryption timing
    const decEnd = performance.now();
    //  STORE DECRYPTION RESULT (FOR PAPER)
    window.decResults.push({
      size: payload.ciphertext.length, // ciphertext size
      time: decEnd - decStart          // decryption time (ms)
    });

    console.log("Decryption Time (ms):", (decEnd - decStart).toFixed(2));
    addMessage(`${from} → Me: ${text}`);

    // ✅ SAVE GOOD STATE
    await saveRatchet(from, sessions[from]);

  } catch (err) {
    console.error("Decrypt failed:", err);

    // 🔄 HARD RESET (MANDATORY)
    delete sessions[from];
    await deleteRatchet(from); // VERY IMPORTANT

    addMessage(`⚠️ Secure session with ${from} was reset. Please resend.`);
  }
});

/*-------for logout------*/
const logoutBtn = document.getElementById("logout");

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("chatUser");
    socket.disconnect(); // inform server
    window.location.href = "/auth/login.html";
  };
}


