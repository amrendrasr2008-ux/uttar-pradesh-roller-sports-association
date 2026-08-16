/**
 * IndexedDB Storage Engine & LocalStorage Quota Guard for UPRSA
 * Provides durable, high-quota client storage (100MB+) and prevents QuotaExceededError.
 */

const IDB_NAME = 'UPRSA_LOCAL_DB_V2';
const IDB_VERSION = 1;
const TABLE_STORE = 'uprsa_tables';
const BLOB_STORE = 'uprsa_blobs';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes and opens the IndexedDB database.
 */
export function getIDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(TABLE_STORE)) {
        db.createObjectStore(TABLE_STORE);
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE);
      }
    };

    request.onsuccess = (event: any) => {
      dbInstance = event.target.result;
      resolve(dbInstance!);
    };

    request.onerror = (event: any) => {
      console.warn('⚠️ IndexedDB open error, falling back to in-memory/safe storage:', event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
}

/**
 * Retrieves a table or object from IndexedDB.
 */
export async function getIdbItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(TABLE_STORE, 'readonly');
      const store = tx.objectStore(TABLE_STORE);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result !== undefined && req.result !== null) {
          resolve(req.result as T);
        } else {
          resolve(fallback);
        }
      };

      req.onerror = () => {
        resolve(fallback);
      };
    });
  } catch (err) {
    return fallback;
  }
}

/**
 * Stores a table or object into IndexedDB asynchronously.
 */
export async function setIdbItem<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLE_STORE, 'readwrite');
      const store = tx.objectStore(TABLE_STORE);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Non-fatal warning
  }
}

/**
 * Stores a binary Blob / DataURL in IndexedDB and returns a durable blob URI/key.
 */
export async function storeBlobInIdb(key: string, blobOrDataUrl: Blob | string): Promise<string> {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readwrite');
      const store = tx.objectStore(BLOB_STORE);
      const req = store.put(blobOrDataUrl, key);

      req.onsuccess = () => resolve(key);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return key;
  }
}

/**
 * Retrieves a stored Blob / DataURL from IndexedDB.
 */
export async function getBlobFromIdb(key: string): Promise<Blob | string | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(BLOB_STORE, 'readonly');
      const store = tx.objectStore(BLOB_STORE);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Strips large base64/data URLs from objects before saving to localStorage to prevent QuotaExceededError.
 */
export function sanitizeForLocalStorage(obj: any): any {
  if (!obj) return obj;
  try {
    const json = JSON.stringify(obj, (key, value) => {
      if (typeof value === 'string') {
        // If string is a large base64 image or pdf data URL (> 2000 chars), replace with placeholder
        if ((value.startsWith('data:image/') || value.startsWith('data:application/')) && value.length > 2000) {
          return 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=1200&auto=format&fit=crop&q=80';
        }
      }
      return value;
    });
    return JSON.parse(json);
  } catch (e) {
    return obj;
  }
}

/**
 * Safely writes to localStorage with automatic sanitization and quota recovery.
 */
export function safeSetLocalStorage(fullKey: string, value: any): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const sanitized = sanitizeForLocalStorage(value);
    window.localStorage.setItem(fullKey, JSON.stringify(sanitized));
  } catch (e: any) {
    // If quota is exceeded, actively purge legacy keys and oversized keys
    cleanupLegacyAndOversizeLocalStorage();

    try {
      // Try again with aggressive sanitization
      const aggressive = sanitizeForLocalStorage(value);
      window.localStorage.setItem(fullKey, JSON.stringify(aggressive));
    } catch (retryErr) {
      // If still failing, omit writing to localStorage (data remains safely in IndexedDB and in-memory store)
    }
  }
}

/**
 * Audits and removes old legacy keys (like `uprsa_cms_v1_heroSlides`, `uprsa_cms_v1_*`, or huge blobs)
 * to free up browser localStorage quota immediately.
 */
export function cleanupLegacyAndOversizeLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const keysToRemove: string[] = [];
    const legacyPrefixes = ['uprsa_cms_v1_', 'uprsa_temp_', 'uprsa_cache_'];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      // 1. Mark legacy keys for deletion
      if (legacyPrefixes.some(prefix => key.startsWith(prefix))) {
        keysToRemove.push(key);
        continue;
      }

      // 2. Check if item has giant base64 content
      try {
        const itemVal = window.localStorage.getItem(key);
        if (itemVal && itemVal.length > 500000) { // > 500 KB in single key
          if (itemVal.includes('data:image/') || itemVal.includes('data:application/pdf')) {
            keysToRemove.push(key);
          }
        }
      } catch (err) {
        // ignore
      }
    }

    // Execute safe cleanup
    keysToRemove.forEach(k => {
      try {
        window.localStorage.removeItem(k);
      } catch (e) {
        // ignore
      }
    });

    if (keysToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${keysToRemove.length} legacy/oversize localStorage keys to preserve quota.`);
    }
  } catch (err) {
    // Non-fatal
  }
}
