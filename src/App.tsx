import { useState } from "react";
import { Header } from "./components/Header";
import { AddPanel } from "./components/AddPanel";
import { LinkItem } from "./components/LinkItem";
import { EmptyState } from "./components/EmptyState";
import { Toast } from "./components/Toast";
import { useLinks } from "./hooks/useLinks";
import { useToast } from "./hooks/useToast";

/**
 * App — root component and composition layer.
 *
 * Responsible for:
 * - Owning the addOpen toggle state that controls the AddPanel visibility
 * - Wiring the useLinks and useToast hooks to the UI components
 * - Rendering the correct list state: loading, empty, or populated
 *
 * No business logic lives here — data fetching, encryption, and
 * validation are all handled inside useLinks. App only connects
 * hooks to components via props.
 */

export default function App() {
  const version = chrome.runtime.getManifest().version;

  // Controls whether the add link form panel is expanded.
  const [addOpen, setAddOpen] = useState(false);

  const { toast, showToast } = useToast();

  const { links, loading, addLink, removeLink, editLink, copyLink, onDragStart, onDrop } =
    useLinks();

  return (
    <div className="w-full bg-bg text-text font-sans text-[13px] overflow-hidden">
      <Header addOpen={addOpen} onToggleAdd={() => setAddOpen((o) => !o)} />
      {/* Collapsible form for adding a new link. Controlled by addOpen. */}
      <AddPanel
        open={addOpen}
        onSave={addLink}
        onClose={() => setAddOpen(false)}
        onError={showToast}
        onSuccess={showToast}
      />
      {/* Three possible list states: loading, empty, or populated. */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <span className="font-mono text-[11px] text-muted animate-pulse">loading...</span>
        </div>
      ) : links.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="list-none p-0 py-2 px-1 max-h-[280px] overflow-y-auto links-scroll">
          {links.map((entry, index) => (
            <LinkItem
              key={entry.id}
              entry={entry}
              index={index}
              onCopy={copyLink}
              onDelete={removeLink}
              onEdit={editLink}
              onDragStart={onDragStart}
              onDrop={onDrop}
              // Pass the label through so the toast message is specific.
              onCopied={(label) => showToast(`Copied ${label}!`)}
              onError={showToast}
              // Stagger the slide-in animation delay per row.
              animationDelay={index * 40}
            />
          ))}
        </ul>
      )}
      {/* Footer shows encryption spec as a passive trust indicator. */}
      <footer className="border-t border-border px-4 py-1.5 flex justify-between items-center">
        <span className="font-mono text-[9px] text-muted tracking-tight">AES-GCM 256</span>
        <span className="flex items-center gap-1 font-mono text-[9px] text-accent opacity-60 tracking-tight">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_5px_theme(colors.accent)]" />
          encrypted · v{version}
        </span>
      </footer>
      {/* Global toast notification — rendered at root level so it
          overlays all other content regardless of which component triggers it. */}
      <Toast {...toast} />
    </div>
  );
}
