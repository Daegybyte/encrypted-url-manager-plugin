interface ToastProps {
  message: string
  isError: boolean
  visible: boolean
}

export function Toast({ message, isError, visible }: ToastProps) {
  return (
    <div
      className={[
        'fixed bottom-3 left-1/2 -translate-x-1/2',
        'bg-surface border rounded-md px-3.5 py-1.5',
        'font-mono text-[11px] whitespace-nowrap pointer-events-none z-50',
        'transition-all duration-200',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        isError ? 'border-danger text-danger' : 'border-border-hi text-text',
      ].join(' ')}
    >
      {message}
    </div>
  )
}
