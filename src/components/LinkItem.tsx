import { useState } from "react";
import type { LinkEntry } from "../types";

/**
 * Props for the LinkItem component.
 *
 * entry          — the link data to display
 * index          — position in the list, used for drag and drop
 * onCopy         — decrypts and copies the URL to clipboard
 * onDelete       — removes the entry from IndexedDB
 * onEdit         — validates, re-encrypts, and updates the entry
 * onDragStart    — records the drag source index in the parent hook
 * onDrop         — triggers reorder logic in the parent hook
 * onCopied       — surfaces a success toast with the label name
 * onError        — surfaces an error toast
 * animationDelay — staggered slide-in delay in milliseconds
 */
interface LinkItemProps {
  entry: LinkEntry;
  index: number;
  onCopy: (entry: LinkEntry) => Promise<void>;
  onDelete: (id: string) => void;
  onEdit: (id: string, label: string, url: string) => Promise<string | null>;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => Promise<void>;
  onCopied: (label: string) => void;
  onError: (msg: string) => void;
  animationDelay: number;
}

/**
 * LinkItem — a single row in the URL list.
 *
 * Renders in one of two modes:
 *
 *   Normal mode  — shows the label with copy/edit/delete actions
 *                  that appear on hover, and drag handle on the left.
 *
 *   Editing mode — replaces the row with an inline form pre-filled
 *                  with the current label. URL is intentionally left
 *                  blank for security — the encrypted value is never
 *                  decrypted back into a visible input field.
 *
 * Copy state cycles through idle → copying → copied → idle to drive
 * the visual feedback on the label button (> becomes ✓ briefly).
 */
export function LinkItem({
  entry,
  index,
  onCopy,
  onDelete,
  onEdit,
  onDragStart,
  onDrop,
  onCopied,
  onError,
  animationDelay,
}: LinkItemProps) {
  // Tracks the copy animation state for the label button.
  const [state, setState] = useState<"idle" | "copying" | "copied">("idle");

  // Whether the current row is an active drag-over target.
  const [isDragOver, setIsDragOver] = useState(false);

  // Whether this row is currently showing the inline edit form.
  const [editing, setEditing] = useState(false);

  // Edit form field values — label pre-filled, URL intentionally blank.
  const [editLabel, setEditLabel] = useState(entry.label);
  const [editUrl, setEditUrl] = useState("");

  // Tracks the async save in progress to disable the Save button.
  const [saving, setSaving] = useState(false);

  /**
   * Initiates a copy — decrypts the URL and writes it to the clipboard.
   * Guards against double-clicks by checking state !== "idle".
   * Resets to idle after 1.5s so the ✓ feedback clears automatically.
   */
  async function handleCopy() {
    if (state !== "idle") return;
    setState("copying");
    try {
      await onCopy(entry);
      setState("copied");
      onCopied(entry.label);
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
      onError("Failed to copy");
    }
  }

  /**
   * Submits the inline edit form.
   * Delegates to onEdit which handles sanitisation, validation,
   * re-encryption, and the IndexedDB write.
   */
  async function handleEditSave() {
    setSaving(true);
    const error = await onEdit(entry.id, editLabel, editUrl);
    setSaving(false);
    if (error) {
      onError(error);
      return;
    }
    setEditing(false);
  }

  /**
   * Opens the inline edit form, pre-filling the label.
   * URL is always reset to empty — we never surface the decrypted
   * URL in a visible input field.
   */
  function handleEditOpen() {
    setEditLabel(entry.label);
    setEditUrl("");
    setEditing(true);
  }

  /**
   * Keyboard shortcuts for the edit form:
   * Enter  — save
   * Escape — cancel and return to normal mode
   */
  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleEditSave();
    if (e.key === "Escape") setEditing(false);
  }

  // Shared base classes for both edit form inputs.
  const inputBase =
    "bg-bg border border-border-hi rounded text-text font-mono text-[11px] px-2 py-1 outline-none focus:border-accent transition-colors duration-150 placeholder:text-muted";

  // ── Editing mode ────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <li className="flex flex-col gap-1.5 px-4 py-2 mx-2 rounded-md bg-surface animate-slide-in">
        <div className="flex gap-2">
          {/* Label input — pre-filled with current label, 48 char max */}
          <input
            className={`${inputBase} w-24 flex-none`}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onKeyDown={handleEditKeyDown}
            placeholder="label"
            maxLength={48}
            autoFocus
            spellCheck={false}
          />
          {/* URL input — intentionally blank; never pre-filled with decrypted value */}
          <input
            className={`${inputBase} flex-1`}
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            onKeyDown={handleEditKeyDown}
            placeholder="https://..."
            type="url"
            spellCheck={false}
          />
        </div>
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => setEditing(false)}
            className="font-mono text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded border border-border-hi text-muted bg-transparent hover:border-danger hover:text-danger transition-all duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleEditSave}
            disabled={saving}
            className="font-mono text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded border border-accent bg-accent text-bg hover:bg-[#6bffbe] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          >
            {saving ? "..." : "Save"}
          </button>
        </div>
      </li>
    );
  }

  // ── Normal mode ─────────────────────────────────────────────────────────────
  return (
    <li
      className={[
        "group flex items-center gap-1.5 pl-4 pr-3 py-1.5 mx-2 rounded-md animate-slide-in transition-colors duration-150 hover:bg-surface",
        // Accent top border indicates this row is the active drop target.
        isDragOver ? "border-t-2 border-accent -mt-0.5" : "",
      ].join(" ")}
      style={{ animationDelay: `${animationDelay}ms` }}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        await onDrop(index);
      }}
    >
      {/* Drag handle — only visible on row hover */}
      <span className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-grab active:cursor-grabbing flex-shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-full h-full"
        >
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      </span>

      {/*
        Label button — primary action for the row.
        The ::before pseudo-element shows > normally, ✓ when copied.
        Copy state drives the colour and content transitions.
      */}
      <button
        onClick={handleCopy}
        title="Click to copy URL"
        className={[
          "flex-1 bg-transparent border-none text-left py-2 px-1 rounded cursor-pointer",
          "font-mono text-[12px] font-medium transition-colors duration-150",
          'before:content-[">"] before:text-muted before:mr-2 before:text-[10px]',
          "before:transition-all before:duration-150 before:inline-block",
          state === "copied"
            ? 'text-accent before:content-["✓"] before:text-accent'
            : state === "copying"
              ? "opacity-50 text-text"
              : "text-text hover:text-accent hover:before:text-accent hover:before:translate-x-0.5",
        ].join(" ")}
      >
        {entry.label}
      </button>

      {/* Edit button — visible on hover, accent highlight */}
      <button
        onClick={handleEditOpen}
        title="Edit"
        className="w-6 h-6 rounded border-none bg-transparent text-muted opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:text-accent hover:bg-accent-dim flex items-center justify-center flex-shrink-0 p-1 cursor-pointer transition-all duration-150"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-full h-full"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

      {/* Delete button — visible on hover, danger highlight */}
      <button
        onClick={() => onDelete(entry.id)}
        title="Delete"
        className="w-6 h-6 rounded border-none bg-transparent text-muted opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:text-danger hover:bg-danger-dim flex items-center justify-center flex-shrink-0 p-1 cursor-pointer transition-all duration-150"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-full h-full"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </li>
  );
}
