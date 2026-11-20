// encrypt.js
// AES-256-GCM encryption/decryption for real-time E2EE chat

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Import raw key material as AES-GCM key
async function importAesKey(messageKey) {
  return await crypto.subtle.importKey(
    "raw",
    messageKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/* ======================
   ENCRYPT MESSAGE
   ====================== */

export async function encryptMessage(plainText, messageKey) {

  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV (recommended)

  const aesKey = await importAesKey(messageKey);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    encoder.encode(plainText)
  );

  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext))
  };
}

/* ======================
   DECRYPT MESSAGE
   ====================== */

export async function decryptMessage(encryptedData, messageKey) {

  const iv = new Uint8Array(encryptedData.iv);
  const ciphertext = new Uint8Array(encryptedData.ciphertext);

  const aesKey = await importAesKey(messageKey);

  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    ciphertext
  );

  return decoder.decode(plaintextBuffer);
}
