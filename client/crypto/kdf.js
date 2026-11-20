// kdf.js
// HKDF implementation using Web Crypto API (RFC 5869 compliant)

// Utility: convert ArrayBuffer to Uint8Array
function bufferToBytes(buffer) {
  return new Uint8Array(buffer);
}

// Utility: concatenate Uint8Arrays
function concatBytes(a, b) {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

// Step 1: HKDF-Extract
async function hkdfExtract(salt, inputKeyMaterial) {
  const key = await crypto.subtle.importKey(
    "raw",
    inputKeyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const prk = await crypto.subtle.sign(
    "HMAC",
    key,
    salt
  );

  return bufferToBytes(prk); // Pseudorandom Key
}

// Step 2: HKDF-Expand
async function hkdfExpand(prk, info, length = 32) {
  const key = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  let previousBlock = new Uint8Array(0);
  let output = new Uint8Array(0);
  let blockIndex = 1;

  while (output.length < length) {
    const input = concatBytes(
      concatBytes(previousBlock, info),
      new Uint8Array([blockIndex])
    );

    const block = bufferToBytes(
      await crypto.subtle.sign("HMAC", key, input)
    );

    output = concatBytes(output, block);
    previousBlock = block;
    blockIndex++;
  }

  return output.slice(0, length);
}

// Full HKDF function
export async function hkdf(sharedSecret, salt, info, length = 32) {
  const prk = await hkdfExtract(salt, sharedSecret);
  return await hkdfExpand(prk, info, length);
}


// ======================
// TEMPORARY TEST (REMOVE AFTER VERIFYING)
// ======================

//(async () => {
 // const secret = crypto.getRandomValues(new Uint8Array(32));
  //const salt = crypto.getRandomValues(new Uint8Array(16));
//  const info = new TextEncoder().encode("test-context");

//  const key1 = await hkdf(secret, salt, info);
//  const key2 = await hkdf(secret, salt, info);

 // console.log("HKDF deterministic check:", 
//    JSON.stringify(Array.from(key1)) === JSON.stringify(Array.from(key2))
//  );

//  console.log("Derived key (hex):", 
//    Array.from(key1).map(b => b.toString(16).padStart(2, "0")).join("")
//  );
//})();