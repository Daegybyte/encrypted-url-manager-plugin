import type { LinkEntry, KeyRecord } from "../types";

/**
 * db.ts — IndexedDB wrapper for the Encrypted URL Manager.
 *
 * Provides generic low-level helpers (dbGet, dbPut, dbDelete, dbGetAll)
 * and typed convenience wrappers for the two object stores:
 *
 *   keys  → { id: string, raw: string }
 *           Stores the base64-encoded AES-GCM encryption key.
 *
 *   links → { id: string, label: string, encUrl: string, order: number }
 *           Stores the user's encrypted URL entries.
 *
 * Every operation opens a fresh connection via openDB(). IndexedDB
 * handles connection pooling internally so this is safe and idiomatic.
 */

const DB_NAME = "ProfileLinksDB";
const DB_VERSION = 1;

// Store name constants exported so other modules don't hardcode strings.
export const STORE_KEYS = "keys";
export const STORE_LINKS = "links";

/**
 * Opens (or creates) the IndexedDB database.
 * onupgradeneeded runs when the DB is first created or the version
 * number increases — this is the only place object stores can be defined.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // Create stores only if they don't already exist,
      // so re-running upgrades on version bumps is safe.
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_LINKS)) {
        db.createObjectStore(STORE_LINKS, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves a single record by key from the given store.
 * Returns null if the record does not exist.
 * Generic T allows callers to receive a typed result.
 */
export async function dbGet<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Writes a record to the given store, inserting or overwriting
 * based on the keyPath value (id). Uses a readwrite transaction.
 */
export async function dbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readwrite").objectStore(storeName).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Deletes a single record by key from the given store.
 * Resolves silently if the key does not exist.
 */
export async function dbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readwrite").objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all records from the given store as a typed array.
 * Returns an empty array if the store is empty.
 */
export async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

// ── Typed convenience helpers ─────────────────────────────────────────────────
// These wrap the generic functions with concrete types so the rest of the
// codebase never has to pass store names or type parameters directly.

export const getAllLinks = () => dbGetAll<LinkEntry>(STORE_LINKS);
export const putLink = (e: LinkEntry) => dbPut<LinkEntry>(STORE_LINKS, e);
export const deleteLink = (id: string) => dbDelete(STORE_LINKS, id);
export const getKeyRecord = () => dbGet<KeyRecord>(STORE_KEYS, "primary");
export const putKeyRecord = (r: KeyRecord) => dbPut<KeyRecord>(STORE_KEYS, r);
