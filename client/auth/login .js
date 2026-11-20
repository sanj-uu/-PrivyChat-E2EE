console.log("LOGIN.JS VERSION = FINAL FIX V3");
import {
  generateIdentityKey,
  generatePrekey
} from "../crypto/x3dh.js";

const socket = io("http://localhost:3000");

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");
  const signupLink = document.getElementById("signupLink");

  // ---------------- LOGIN ----------------
  loginBtn.addEventListener("click", async () => {

    // ✅ FIRST declare variables
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value.trim();

    console.log("Login clicked for:", user);

    if (!user || !pass) {
      alert("Enter username and password");
      return;
    }

    const stored = localStorage.getItem("user_" + user);
    if (!stored || stored !== pass) {
      alert("Invalid credentials");
      return;
    }

    // save logged-in user
    localStorage.setItem("chatUser", user);

    // 🔐 Generate identity key & prekey
    const identityKey = await generateIdentityKey();
    const prekey = await generatePrekey();

    // save PRIVATE identity key
    localStorage.setItem(
      "identityKey",
      JSON.stringify(
        await crypto.subtle.exportKey("jwk", identityKey.privateKey)
      )
    );

    // save PUBLIC prekey (for sending)
    localStorage.setItem(
      "myPrekeyPublic",
      JSON.stringify(
        await crypto.subtle.exportKey("jwk", prekey.publicKey)
      )
    );

    console.log("Publishing prekeys for", user);

    // 🔓 Publish prekeys to server
    socket.emit("publish-prekeys", {
      username: user,
      identityKey: await crypto.subtle.exportKey("jwk", identityKey.publicKey),
      prekey: await crypto.subtle.exportKey("jwk", prekey.publicKey)
    });

    // small delay so emit is sent
    setTimeout(() => {
      window.location.href = "/client/chat/chat.html";
    }, 300);
  });

  // ---------------- SIGNUP LINK ----------------
  signupLink.addEventListener("click", () => {
    window.location.href = "/client/auth/signup.html";
  });

});
