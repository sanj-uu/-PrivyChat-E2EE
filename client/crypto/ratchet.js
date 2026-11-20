// ratchet.js
// Simplified Double Ratchet for real-time E2EE chat

import { hkdf } from "./kdf.js";

const encoder = new TextEncoder();

export class DoubleRatchet {
  constructor() {
    this.rootKey = null;
    this.sendChainKey = null;
    this.recvChainKey = null;
    this.dhKeyPair = null;
    this.remotePublicKey = null;
  }

  // 1️⃣ Initialize session (after ECDH handshake)
  async initSession(sharedSecret, isInitiator = false) {
    const salt = encoder.encode("ratchet-salt");

    this.rootKey = await hkdf(
      sharedSecret,
      salt,
      encoder.encode("root-key")
    );

    if (isInitiator) {
      this.sendChainKey = await hkdf(
        this.rootKey,
        salt,
        encoder.encode("send-chain")
      );
      this.recvChainKey = await hkdf(
        this.rootKey,
        salt,
        encoder.encode("recv-chain")
      );
    } else {
      this.recvChainKey = await hkdf(
        this.rootKey,
        salt,
        encoder.encode("send-chain")
      );
      this.sendChainKey = await hkdf(
        this.rootKey,
        salt,
        encoder.encode("recv-chain")
      );
    }
  }

  // 2️⃣ Derive message key for sending
  async nextSendMessageKey() {
    const salt = encoder.encode("msg-salt");

    const messageKey = await hkdf(
      this.sendChainKey,
      salt,
      encoder.encode("message-key")
    );

    // Advance send chain
    this.sendChainKey = await hkdf(
      this.sendChainKey,
      salt,
      encoder.encode("chain-advance")
    );

    return messageKey;
  }

  // 3️⃣ Derive message key for receiving
  async nextReceiveMessageKey() {
    const salt = encoder.encode("msg-salt");

    const messageKey = await hkdf(
      this.recvChainKey,
      salt,
      encoder.encode("message-key")
    );

    // Advance receive chain
    this.recvChainKey = await hkdf(
      this.recvChainKey,
      salt,
      encoder.encode("chain-advance")
    );

    return messageKey;
  }

  serialize() {
    return {
      rootKey: Array.from(this.rootKey),
      sendChainKey: Array.from(this.sendChainKey),
      recvChainKey: Array.from(this.recvChainKey),
      sendCount: this.sendCount,
      recvCount: this.recvCount
    };
  }

  static deserialize(data) {
    const r = new DoubleRatchet();
    r.rootKey = new Uint8Array(data.rootKey);
    r.sendChainKey = new Uint8Array(data.sendChainKey);
    r.recvChainKey = new Uint8Array(data.recvChainKey);
    r.sendCount = data.sendCount;
    r.recvCount = data.recvCount;
    return r;
  }
}
