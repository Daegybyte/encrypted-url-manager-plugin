import { useState, useCallback, useRef } from "react";

/**
 * Describes the shape of the toast notification state.
 * visible controls whether the toast is shown or hidden via CSS transitions.
 */
interface ToastState {
  message: string;
  isError: boolean;
  visible: boolean;
}

/**
 * useToast — lightweight notification hook.
 *
 * Provides a toast state object and a showToast trigger.
 * The toast auto-dismisses after 2 seconds. Calling showToast
 * again before the timer expires resets the countdown so rapid
 * successive calls don't stack or overlap.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    isError: false,
    visible: false,
  });

  // Holds the active dismiss timer so it can be cleared if
  // showToast is called again before the previous toast expires.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    // Cancel any existing dismiss timer before starting a new one.
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({ message, isError, visible: true });

    // Auto-dismiss after 2 seconds by setting visible to false.
    // The Toast component uses a CSS transition on opacity so the
    // hide is animated rather than an instant disappear.
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 2000);
  }, []);

  return { toast, showToast };
}
