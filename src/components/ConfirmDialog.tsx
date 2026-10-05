interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Eliminar',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-periwinkle-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-periwinkle-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:opacity-50"
          >
            {busy ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
