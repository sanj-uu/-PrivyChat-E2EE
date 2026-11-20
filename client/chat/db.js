const DB_NAME = "e2ee-chat";
const STORE = "ratchets";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRatchet(peer, ratchet) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(ratchet.serialize(), peer);
}

export async function loadRatchet(peer, DoubleRatchet) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).get(peer);

  return new Promise(resolve => {
    req.onsuccess = () => {
      resolve(req.result ? DoubleRatchet.deserialize(req.result) : null);
    };
  });
}

export async function deleteRatchet(peer) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(peer);
}


