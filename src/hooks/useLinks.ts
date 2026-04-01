import { useState, useEffect, useCallback, useRef } from "react";
import type { LinkEntry } from "../types";
import { getAllLinks, putLink, deleteLink } from "../lib/db";
import { encryptUrl, decryptUrl } from "../lib/crypto";
import { sanitiseLabel, validateUrl } from "../lib/sanitise";

export function useLinks() {
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const dragIndexRef = useRef<number | null>(null);

  const loadLinks = useCallback(async () => {
    const all = await getAllLinks();
    setLinks(all.sort((a, b) => a.order - b.order));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const addLink = useCallback(
    async (rawLabel: string, rawUrl: string): Promise<string | null> => {
      const label = sanitiseLabel(rawLabel);
      const url = validateUrl(rawUrl);

      if (!label) return "Invalid label";
      if (!url) return "URL must start with https://";

      const all = await getAllLinks();
      const encUrl = await encryptUrl(url);
      const entry: LinkEntry = {
        id: crypto.randomUUID(),
        label,
        encUrl,
        order: all.length,
      };

      await putLink(entry);
      await loadLinks();
      return null;
    },
    [loadLinks],
  );

  const removeLink = useCallback(
    async (id: string) => {
      await deleteLink(id);
      await loadLinks();
    },
    [loadLinks],
  );

  const editLink = useCallback(
    async (id: string, rawLabel: string, rawUrl: string): Promise<string | null> => {
      const label = sanitiseLabel(rawLabel);
      const url = validateUrl(rawUrl);

      if (!label) return "Invalid label";
      if (!url) return "URL must start with https://";

      const existing = links.find((e) => e.id === id);
      if (!existing) return "Link not found";

      const encUrl = await encryptUrl(url);
      await putLink({ ...existing, label, encUrl });
      await loadLinks();
      return null;
    },
    [links, loadLinks],
  );

  const copyLink = useCallback(async (entry: LinkEntry): Promise<void> => {
    const url = await decryptUrl(entry.encUrl);
    await navigator.clipboard.writeText(url);
  }, []);

  const onDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const onDrop = useCallback(
    async (dropIndex: number) => {
      const srcIndex = dragIndexRef.current;
      if (srcIndex === null || srcIndex === dropIndex) return;
      dragIndexRef.current = null;

      const reordered = [...links];
      const [moved] = reordered.splice(srcIndex, 1);
      reordered.splice(dropIndex, 0, moved);

      const updated = reordered.map((e, i) => ({ ...e, order: i }));
      setLinks(updated);
      await Promise.all(updated.map(putLink));
    },
    [links],
  );

  return { links, loading, addLink, removeLink, editLink, copyLink, onDragStart, onDrop };
}
