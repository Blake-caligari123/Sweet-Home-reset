const DB_NAME = 'sweet-home-reset';
const STORE_NAME = 'saves';
const SAVE_KEY = 'starter-kitchen';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadCleanedSpots(): Promise<number[]> {
  try {
    const db = await openDatabase();
    const value = await new Promise<number[] | undefined>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(SAVE_KEY);
      request.onsuccess = () => resolve(request.result as number[] | undefined);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return Array.isArray(value) ? value : [];
  } catch {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(`shr:${SAVE_KEY}`) ?? '[]');
      return Array.isArray(value) ? value.filter(Number.isInteger) as number[] : [];
    } catch {
      return [];
    }
  }
}

export async function saveCleanedSpots(cleaned: number[]): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(cleaned, SAVE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
  } catch {
    try {
      localStorage.setItem(`shr:${SAVE_KEY}`, JSON.stringify(cleaned));
    } catch {
      // Keep the current room playable when browser storage is unavailable.
    }
  }
}
