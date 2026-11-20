// Generate ECC key pair (ECDH)
async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"   // accepted & standard
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

// Export public key (to share)
async function exportPublicKey(publicKey) {
  return await window.crypto.subtle.exportKey(
    "jwk",
    publicKey
  );
}

// Export private key (store locally)
async function exportPrivateKey(privateKey) {
  return await window.crypto.subtle.exportKey(
    "jwk",
    privateKey
  );
}
