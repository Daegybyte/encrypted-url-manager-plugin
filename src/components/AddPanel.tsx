import { useRef, useState } from "react";

interface AddPanelProps {
  open: boolean;
  onSave: (label: string, url: string) => Promise<string | null>;
  onClose: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function AddPanel({ open, onSave, onClose, onError, onSuccess }: AddPanelProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [shakeLabel, setShakeLabel] = useState(false);
  const [shakeUrl, setShakeUrl] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);

  function triggerShake(field: "label" | "url") {
    if (field === "label") {
      setShakeLabel(true);
      setTimeout(() => setShakeLabel(false), 400);
      labelRef.current?.focus();
    } else {
      setShakeUrl(true);
      setTimeout(() => setShakeUrl(false), 400);
    }
  }

  async function handleSave() {
    if (!label.trim()) {
      triggerShake("label");
      return;
    }
    if (!url.trim()) {
      triggerShake("url");
      return;
    }

    setSaving(true);
    const error = await onSave(label, url);
    setSaving(false);

    if (error) {
      onError(error);
      if (error.toLowerCase().includes("url")) triggerShake("url");
      else triggerShake("label");
    } else {
      setLabel("");
      setUrl("");
      onClose();
      onSuccess("Link saved!");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      onClose();
      setLabel("");
      setUrl("");
    }
  }

  const inputBase = [
    "flex-1 bg-bg border border-border-hi rounded-md text-text",
    "font-mono text-[11px] px-2.5 py-1.5 outline-none",
    "transition-colors duration-150 placeholder:text-muted",
    "focus:border-accent focus:shadow-[0_0_0_2px_rgba(79,255,176,0.08)]",
  ].join(" ");

  return (
    <div
      className={[
        "overflow-hidden transition-all duration-250",
        open ? "max-h-36 border-b border-border" : "max-h-0",
      ].join(" ")}
    >
      <div className="flex flex-col gap-2 px-5 py-3">
        <div className="flex gap-2">
          <input
            ref={labelRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="label"
            maxLength={24}
            autoComplete="off"
            spellCheck={false}
            className={[
              inputBase,
              "flex-none w-24",
              shakeLabel ? "animate-shake border-danger" : "",
            ].join(" ")}
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://..."
            type="url"
            autoComplete="off"
            spellCheck={false}
            className={[inputBase, shakeUrl ? "animate-shake border-danger" : ""].join(" ")}
          />
        </div>
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => {
              onClose();
              setLabel("");
              setUrl("");
            }}
            className="font-mono text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded border border-border-hi text-muted bg-transparent hover:border-danger hover:text-danger transition-all duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-mono text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded border border-accent bg-accent text-bg hover:bg-[#6bffbe] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          >
            {saving ? "..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
