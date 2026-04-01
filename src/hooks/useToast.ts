import { useState, useCallback, useRef } from "react";

interface ToastState {
  message: string;
  isError: boolean;
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: "", isError: false, visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, isError, visible: true });
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 2000);
  }, []);

  return { toast, showToast };
}
