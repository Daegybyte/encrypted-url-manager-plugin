import { useState } from "react";
import { Header } from "./components/Header";
import { AddPanel } from "./components/AddPanel";
import { LinkItem } from "./components/LinkItem";
import { EmptyState } from "./components/EmptyState";
import { Toast } from "./components/Toast";
import { useLinks } from "./hooks/useLinks";
import { useToast } from "./hooks/useToast";

export default function App() {
  const [addOpen, setAddOpen] = useState(false);
  const { toast, showToast } = useToast();
  const { links, loading, addLink, removeLink, editLink, copyLink, onDragStart, onDrop } =
    useLinks();
  return (
    <div className="w-full bg-bg text-text font-sans text-[13px] overflow-hidden">
      <Header addOpen={addOpen} onToggleAdd={() => setAddOpen((o) => !o)} />

      <AddPanel
        open={addOpen}
        onSave={addLink}
        onClose={() => setAddOpen(false)}
        onError={showToast}
        onSuccess={showToast}
      />

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
              onCopied={(label) => showToast(`Copied ${label}!`)}
              onError={showToast}
              animationDelay={index * 40}
            />
          ))}
        </ul>
      )}

      <footer className="border-t border-border px-4 py-1.5 flex justify-between items-center">
        <span className="font-mono text-[9px] text-muted tracking-tight">AES-GCM 256</span>
        <span className="flex items-center gap-1 font-mono text-[9px] text-accent opacity-60 tracking-tight">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_5px_theme(colors.accent)]" />
          encrypted
        </span>
      </footer>

      <Toast {...toast} />
    </div>
  );
}
