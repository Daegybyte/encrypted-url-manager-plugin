/**
 * Props for the Header component.
 *
 * addOpen     — whether the AddPanel is currently expanded;
 *               used to toggle the button's active styles and rotation
 * onToggleAdd — callback to open or close the AddPanel
 */
interface HeaderProps {
  addOpen: boolean;
  onToggleAdd: () => void;
}

/**
 * Header — top bar of the extension popup.
 *
 * Displays the extension name with a glowing accent dot on the left,
 * and an add/close toggle button on the right.
 *
 * The toggle button rotates 45° when the panel is open, turning the
 * + into an × visually without swapping the character. The rotation
 * is clipped by the header's overflow-hidden so it doesn't bleed
 * outside the header boundary.
 */
export function Header({ addOpen, onToggleAdd }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-2">
        {/* Glowing dot — passive visual indicator that the extension is active */}
        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_theme(colors.accent)]" />
        <h1 className="font-mono text-xs font-semibold tracking-widest uppercase text-text">
          Encrypted URL Manager
        </h1>
      </div>

      {/*
        Toggle button — rotates 45deg when addOpen is true to form an ×.
        Active state applies accent border, text, and background.
        Inactive state shows muted styling with accent hover.
      */}
      <button
        onClick={onToggleAdd}
        title="Add new link"
        className={[
          "w-7 h-7 rounded-md border text-lg leading-none flex items-center justify-center cursor-pointer",
          "transition-all duration-150",
          addOpen
            ? "border-accent text-accent bg-accent-dim rotate-45"
            : "border-border-hi text-muted bg-transparent hover:border-accent hover:text-accent hover:bg-accent-dim",
        ].join(" ")}
      >
        +
      </button>
    </header>
  );
}
