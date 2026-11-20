// Generate long-term identity key
export async function generateIdentityKey() {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
}

// Generate signed prekey (demo: unsigned)
export async function generatePrekey() {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
}

// X3DH shared secret
export async function deriveSharedSecret(privateKey, publicKey) {
  const bits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256
  );
  return new Uint8Array(bits);
}

