interface HeaderProps {
  addOpen: boolean;
  onToggleAdd: () => void;
}

export function Header({ addOpen, onToggleAdd }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_theme(colors.accent)]" />
        <h1 className="font-mono text-xs font-semibold tracking-widest uppercase text-text">
          Profile Links
        </h1>
      </div>
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
