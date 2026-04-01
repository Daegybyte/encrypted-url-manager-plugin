import { useRef, useState } from "react";

/**
 * Props for the AddPanel component.
 *
 * onSave   — async function that validates, encrypts, and stores the entry;
 *            returns an error string on failure or null on success
 * onClose  — collapses the panel without saving
 * onError  — passes an error message up to the toast system
 * onSuccess — passes a success message up to the toast system
 */
interface AddPanelProps {
  open: boolean;
  onSave: (label: string, url: string) => Promise<string | null>;
  onClose: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

/**
 * AddPanel — collapsible form for adding a new URL entry.
 *
 * Animates open/closed via max-height transition controlled by the
 * open prop. Manages its own local input state and clears it on
 * successful save or cancel.
 *
 * Validation feedback is handled via a shake animation on the
 * offending field rather than inline error text, keeping the UI compact.
 */
export function AddPanel({ open, onSave, onClose, onError, onSuccess }: AddPanelProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Shake animation flags — set true briefly to trigger the CSS animation,
  // then reset after 400ms so it can be triggered again if needed.
  const [shakeLabel, setShakeLabel] = useState(false);
  const [shakeUrl, setShakeUrl] = useState(false);

  // Ref used to programmatically focus the label input on shake.
  const labelRef = useRef<HTMLInputElement>(null);

  /**
   * Triggers a shake animation on the given field and focuses it.
   * Resets after 400ms to match the animation duration.
   */
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

  /**
   * Handles the save action.
   * Runs client-side presence checks first, then delegates to onSave
   * which handles sanitisation, validation, encryption, and DB writes.
   * On error, shakes the relevant field and surfaces the message via toast.
   * On success, clears inputs and closes the panel.
   */
  async function handleSave() {
    // Presence checks before calling onSave to avoid unnecessary async calls.
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
      // Shake the field most likely responsible for the error.
      if (error.toLowerCase().includes("url")) triggerShake("url");
      else triggerShake("label");
    } else {
      setLabel("");
      setUrl("");
      onClose();
      onSuccess("Link saved!");
    }
  }

  /**
   * Keyboard shortcuts:
   * Enter  — submit the form
   * Escape — cancel and close the panel
   */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      onClose();
      setLabel("");
      setUrl("");
    }
  }

  // Base input classes shared between both fields.
  const inputBase = [
    "flex-1 bg-bg border border-border-hi rounded-md text-text",
    "font-mono text-[11px] px-2.5 py-1.5 outline-none",
    "transition-colors duration-150 placeholder:text-muted",
    "focus:border-accent focus:shadow-[0_0_0_2px_rgba(79,255,176,0.08)]",
  ].join(" ");

  return (
    // max-height transition creates the open/close slide animation.
    // max-h-0 with overflow-hidden hides content without display:none
    // so the transition has something to animate between.
    <div
      className={[
        "overflow-hidden transition-all duration-250",
        open ? "max-h-36 border-b border-border" : "max-h-0",
      ].join(" ")}
    >
      <div className="flex flex-col gap-2 px-5 py-3">
        <div className="flex gap-2">
          {/* Label input — short fixed width, 48 char max */}
          <input
            ref={labelRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="label"
            maxLength={48}
            autoComplete="off"
            spellCheck={false}
            className={[
              inputBase,
              "flex-none w-24",
              shakeLabel ? "animate-shake border-danger" : "",
            ].join(" ")}
          />
          {/* URL input — fills remaining space */}
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
