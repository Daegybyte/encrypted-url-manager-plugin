import { useState, useEffect, useCallback, useRef } from "react";
import type { LinkEntry } from "../types";
import { getAllLinks, putLink, deleteLink } from "../lib/db";
import { encryptUrl, decryptUrl } from "../lib/crypto";
import { sanitiseLabel, validateUrl } from "../lib/sanitise";

/**
 * useLinks — central state manager for all link operations.
 *
 * Handles loading, adding, editing, removing, copying, and
 * reordering links. All persistence goes through IndexedDB
 * via the db.ts helpers. URLs are encrypted before storage
 * and decrypted only at the moment of copying to clipboard.
 */
export function useLinks() {
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Stores the index of the row being dragged so the drop
  // handler knows where the item originated from.
  const dragIndexRef = useRef<number | null>(null);

  /**
   * Fetches all entries from IndexedDB, sorts them by their
   * persisted order field, and updates local state.
   * Wrapped in useCallback so it can safely be listed as a
   * dependency in useEffect and other callbacks without
   * causing infinite re-renders.
   */
  const loadLinks = useCallback(async () => {
    const all = await getAllLinks();
    setLinks(all.sort((a, b) => a.order - b.order));
    setLoading(false);
  }, []);

  // Load links once on mount.
  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  /**
   * Validates and sanitises inputs, encrypts the URL,
   * then writes a new entry to IndexedDB.
   * Returns an error string if validation fails, or null on success.
   * New entries are appended to the end of the list via order: all.length.
   */
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
        order: all.length, // append to end
      };

      await putLink(entry);
      await loadLinks();
      return null;
    },
    [loadLinks],
  );

  /**
   * Deletes an entry from IndexedDB by its UUID,
   * then refreshes the list.
   */
  const removeLink = useCallback(
    async (id: string) => {
      await deleteLink(id);
      await loadLinks();
    },
    [loadLinks],
  );

  /**
   * Updates an existing entry in place.
   * Validates and sanitises the new values, re-encrypts the URL,
   * and writes the updated record back to IndexedDB while
   * preserving the entry's id and order.
   * Returns an error string if validation fails, or null on success.
   */
  const editLink = useCallback(
    async (id: string, rawLabel: string, rawUrl: string): Promise<string | null> => {
      const label = sanitiseLabel(rawLabel);
      const url = validateUrl(rawUrl);

      if (!label) return "Invalid label";
      if (!url) return "URL must start with https://";

      const existing = links.find((e) => e.id === id);
      if (!existing) return "Link not found";

      const encUrl = await encryptUrl(url);
      // Spread existing to preserve id and order, then override label and encUrl.
      await putLink({ ...existing, label, encUrl });
      await loadLinks();
      return null;
    },
    [links, loadLinks],
  );

  /**
   * Decrypts the stored URL for the given entry and writes
   * it to the system clipboard. Decryption only happens at
   * the moment of copying — URLs are never held in plaintext in state.
   */
  const copyLink = useCallback(async (entry: LinkEntry): Promise<void> => {
    const url = await decryptUrl(entry.encUrl);
    await navigator.clipboard.writeText(url);
  }, []);

  /**
   * Records the index of the row the user started dragging.
   * Uses a ref rather than state to avoid triggering a re-render.
   */
  const onDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  /**
   * Handles a drop event by reordering the in-memory array,
   * then persisting the new order values to IndexedDB in parallel.
   * Sets state optimistically before the writes complete so the
   * UI updates immediately without waiting for the DB round-trip.
   */
  const onDrop = useCallback(
    async (dropIndex: number) => {
      const srcIndex = dragIndexRef.current;

      // Ignore drops onto the same position or if no drag is in progress.
      if (srcIndex === null || srcIndex === dropIndex) return;
      dragIndexRef.current = null;

      const reordered = [...links];
      const [moved] = reordered.splice(srcIndex, 1);
      reordered.splice(dropIndex, 0, moved);

      // Reassign order values to match the new positions.
      const updated = reordered.map((e, i) => ({ ...e, order: i }));

      // Optimistic update — reflect the new order in the UI immediately.
      setLinks(updated);

      // Persist all updated order values to IndexedDB in parallel.
      await Promise.all(updated.map(putLink));
    },
    [links],
  );

  return { links, loading, addLink, removeLink, editLink, copyLink, onDragStart, onDrop };
}
