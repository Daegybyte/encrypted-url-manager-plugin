export function sanitiseLabel(raw: string): string {
  return raw
    .trim()
    .replace(/[<>&"'`]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

export function validateUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}
