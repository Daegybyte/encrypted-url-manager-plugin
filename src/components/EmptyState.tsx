/**
 * EmptyState — displayed in place of the link list when no entries exist.
 *
 * Keeps the UI informative rather than blank, and nudges the user
 * toward the add action with a subtle hint.
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-5 text-center">
      {/* {} glyph used as a visual placeholder — nods to the dev aesthetic */}
      <div className="font-mono text-[28px] text-border-hi mb-2.5">{"{}"}</div>
      <p className="text-muted text-xs leading-relaxed">No links yet.</p>
      <p className="font-mono text-[10px] text-accent opacity-60 mt-2">
        Press + to add your first one.
      </p>
    </div>
  );
}
