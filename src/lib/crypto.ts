import { getKeyRecord, putKeyRecord } from "./db";

/**
 * Converts an ArrayBuffer or Uint8Array to a base64-encoded string.
 * Used to serialise binary data (keys, ciphertext) for storage in IndexedDB,
 * which only accepts strings rather than raw binary.
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Converts a base64-encoded string back to a Uint8Array.
 * Used to deserialise stored keys and ciphertext before
 * passing them to the Web Crypto API.
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Returns the AES-GCM CryptoKey for this browser profile.
 *
 * On first run, generates a new 256-bit AES-GCM key, exports it as
 * raw bytes, serialises it to base64, and persists it to IndexedDB
 * under the record id "primary".
 *
 * On subsequent runs, retrieves the stored base64 key and re-imports
 * it as a non-extractable CryptoKey.
 *
 * The key is marked non-extractable on import (extractable: false)
 * so it cannot be exported again after the initial setup — it can
 * only be used for encrypt/decrypt operations within this session.
 */
async function getOrCreateKey(): Promise<CryptoKey> {
  const record = await getKeyRecord();

  if (record) {
    // Re-import the stored key. The .buffer cast is required because
    // Web Crypto's importKey expects an ArrayBuffer, not a Uint8Array.
    return crypto.subtle.importKey(
      "raw",
      base64ToBuffer(record.raw).buffer as ArrayBuffer,
      { name: "AES-GCM" },
      false, // non-extractable after import
      ["encrypt", "decrypt"],
    );
  }

  // First run — generate a new key, persist it, and return it.
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const rawKey = await crypto.subtle.exportKey("raw", key);
  await putKeyRecord({ id: "primary", raw: bufferToBase64(rawKey) });
  return key;
}

/**
 * Encrypts a plaintext URL string using AES-GCM 256.
 *
 * A fresh 12-byte IV (initialisation vector) is generated for every
 * encryption call — reusing an IV with the same key would break AES-GCM
 * security guarantees, so this is critical.
 *
 * The IV is prepended to the ciphertext before base64 encoding so it
 * can be recovered during decryption. The final output is a single
 * base64 string: [12-byte IV][ciphertext].
 */
export async function encryptUrl(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();

  // Generate a unique IV for this encryption operation.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // Combine IV + ciphertext into a single buffer for storage.
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bufferToBase64(combined);
}

/**
 * Decrypts a base64-encoded encrypted URL back to plaintext.
 *
 * Splits the combined buffer back into its IV (first 12 bytes)
 * and ciphertext (remaining bytes), then decrypts using AES-GCM.
 * The .buffer cast is required because Web Crypto expects ArrayBuffer.
 */
export async function decryptUrl(base64: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = base64ToBuffer(base64);

  // Recover the IV from the first 12 bytes.
  const iv = combined.slice(0, 12);

  // The rest is the actual ciphertext.
  const ciphertext = combined.slice(12);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(plaintext);
}
