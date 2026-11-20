importScripts?.(); // safe for browsers that ignore it

document.addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const inputs = form.querySelectorAll("input");
  const username = inputs[0].value;
  const password = inputs[1].value;

  if (form.id === "signupForm") {

    // 1️⃣ Save credentials (prototype only)
    localStorage.setItem(username, password);

    // 2️⃣ Generate cryptographic keys
    const keyPair = await generateKeyPair();

    // 3️⃣ Export keys
    const publicKey = await exportPublicKey(keyPair.publicKey);
    const privateKey = await exportPrivateKey(keyPair.privateKey);

    // 4️⃣ Store keys locally
    localStorage.setItem(username + "_publicKey", JSON.stringify(publicKey));
    localStorage.setItem(username + "_privateKey", JSON.stringify(privateKey));

    alert("Account created securely!");
    window.location.href = "login.html";
  }
});
