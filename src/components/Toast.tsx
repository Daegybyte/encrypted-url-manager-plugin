/**
 * Props for the Toast component.
 *
 * message — the text to display
 * isError — if true, renders in danger colours; otherwise neutral
 * visible — controls opacity and y-position via CSS transition
 */
interface ToastProps {
  message: string;
  isError: boolean;
  visible: boolean;
}

/**
 * Toast — non-blocking notification banner.
 *
 * Rendered at the root level in App.tsx so it overlays all other content.
 * Visibility is driven entirely by the visible prop via CSS transitions
 * on opacity and translateY — the component stays mounted at all times
 * so the fade-out animation has something to transition from.
 *
 * pointer-events-none ensures it never intercepts clicks while visible.
 */
export function Toast({ message, isError, visible }: ToastProps) {
  return (
    <div
      className={[
        // Centered horizontally above the bottom edge of the popup.
        "fixed bottom-3 left-1/2 -translate-x-1/2",
        "bg-surface border rounded-md px-3.5 py-1.5",
        "font-mono text-[11px] whitespace-nowrap pointer-events-none z-50",
        // Smooth fade + slide transition driven by the visible prop.
        "transition-all duration-200",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        // Error toasts use danger colours; success toasts use neutral.
        isError ? "border-danger text-danger" : "border-border-hi text-text",
      ].join(" ")}
    >
      {message}
    </div>
  );
}
