import type { LinkEntry, KeyRecord } from "../types";

const DB_NAME = "ProfileLinksDB";
const DB_VERSION = 1;
export const STORE_KEYS = "keys";
export const STORE_LINKS = "links";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
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

export async function dbGet<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readwrite").objectStore(storeName).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readwrite").objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export const getAllLinks = () => dbGetAll<LinkEntry>(STORE_LINKS);
export const putLink = (e: LinkEntry) => dbPut<LinkEntry>(STORE_LINKS, e);
export const deleteLink = (id: string) => dbDelete(STORE_LINKS, id);
export const getKeyRecord = () => dbGet<KeyRecord>(STORE_KEYS, "primary");
export const putKeyRecord = (r: KeyRecord) => dbPut<KeyRecord>(STORE_KEYS, r);
