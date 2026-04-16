/**
 * sanitise.ts — input validation and sanitisation utilities.
 *
 * All user input passes through these functions before being
 * stored or encrypted. Sanitisation happens at the point of
 * saving, not at the point of display, so stored data is always clean.
 */

/**
 * Sanitises a raw label string for safe storage.
 *
 * - Trims leading and trailing whitespace
 * - Strips HTML special characters to prevent injection if the
 *   label is ever rendered in a different context: < > & " ' `
 * - Collapses multiple consecutive spaces into one
 * - Enforces a maximum length of 48 characters
 */
export function sanitiseLabel(raw: string): string {
  return raw
    .trim()
    .replace(/[<>&"'`]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 48);
}

/**
 * Validates a raw URL string and returns a normalised href or null.
 *
 * - Uses the native URL constructor for parsing — invalid URLs throw
 *   and are caught, returning null
 * - Explicitly allows only http: and https: protocols, blocking
 *   javascript:, data:, and any other potentially harmful schemes
 * - Returns url.href rather than the raw input so the URL is
 *   normalised (e.g. trailing slashes, percent-encoding) before storage
 */
export function validateUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    // URL constructor throws on invalid input — treat as invalid.
    return null;
  }
}
