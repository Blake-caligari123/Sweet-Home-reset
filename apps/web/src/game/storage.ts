// Local save: IndexedDB first, localStorage as a fallback, and the game keeps running if both
// are unavailable (private mode, blocked storage).
const DB = 'sweet-home-reset';
const STORE = 'profile';
const KEY = 'main';
const LS_KEY = 'shr:profile';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadSave(): Promise<unknown> {
  try {
    const db = await open();
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (value) return value;
  } catch { /* fall through */ }
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? 'null'); } catch { return null; }
}

export async function writeSave(value: unknown): Promise<void> {
  const plain = JSON.parse(JSON.stringify(value));
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(plain, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    return;
  } catch { /* fall through */ }
  try { localStorage.setItem(LS_KEY, JSON.stringify(plain)); } catch { /* keep playing */ }
}

export async function eraseSave() {
  try { indexedDB.deleteDatabase(DB); } catch { /* ignore */ }
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}
