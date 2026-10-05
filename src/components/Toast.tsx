interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex items-start gap-3 rounded-xl border px-4 py-3 shadow-soft sm:max-w-sm ${
        type === 'success'
          ? 'bg-white border-periwinkle-300 text-periwinkle-900'
          : 'bg-white border-red-300 text-red-700'
      }`}
    >
      <span className="mt-0.5 text-lg">{type === 'success' ? '✅' : '⚠️'}</span>
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="text-sm font-semibold text-periwinkle-600 hover:text-periwinkle-800"
      >
        ✕
      </button>
    </div>
  )
}
