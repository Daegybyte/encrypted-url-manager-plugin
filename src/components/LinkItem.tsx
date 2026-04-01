import { useState } from "react";
import type { LinkEntry } from "../types";

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
  const [state, setState] = useState<"idle" | "copying" | "copied">("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(entry.label);
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState(false);

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

  function handleEditOpen() {
    setEditLabel(entry.label);
    setEditUrl("");
    setEditing(true);
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleEditSave();
    if (e.key === "Escape") setEditing(false);
  }

  const inputBase =
    "bg-bg border border-border-hi rounded text-text font-mono text-[11px] px-2 py-1 outline-none focus:border-accent transition-colors duration-150 placeholder:text-muted";

  if (editing) {
    return (
      <li className="flex flex-col gap-1.5 px-4 py-2 mx-2 rounded-md bg-surface animate-slide-in">
        <div className="flex gap-2">
          <input
            className={`${inputBase} w-24 flex-none`}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onKeyDown={handleEditKeyDown}
            placeholder="label"
            maxLength={24}
            autoFocus
            spellCheck={false}
          />
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

  return (
    <li
      className={[
        "group flex items-center gap-1.5 pl-4 pr-3 py-1.5 mx-2 rounded-md animate-slide-in transition-colors duration-150 hover:bg-surface",
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

      {/* Edit button */}
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
