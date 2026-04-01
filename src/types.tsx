/**
 * types.ts — shared TypeScript interfaces used across the application.
 *
 * Centralising types here prevents circular imports and makes it
 * easy to see the full data shape of the application in one place.
 */

/**
 * Represents a single stored URL entry.
 *
 * id     — UUID generated at creation time, used as the IndexedDB keyPath
 * label  — user-facing shorthand name, e.g. "linkedin" or "github"
 * encUrl — the URL encrypted with AES-GCM 256 and base64-encoded for storage
 * order  — integer used to sort entries; rewritten on every drag-and-drop
 */
export interface LinkEntry {
  id: string;
  label: string;
  encUrl: string;
  order: number;
}

/**
 * Represents the stored AES-GCM encryption key record in IndexedDB.
 *
 * id  — always "primary"; only one key record exists per browser profile
 * raw — the AES key exported as raw bytes and base64-encoded for storage
 */
export interface KeyRecord {
  id: string;
  raw: string;
}
