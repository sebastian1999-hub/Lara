import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  badge?: string | null
  defaultOpen?: boolean
  children: React.ReactNode
}

/** Sección plegable (acordeón) usada para agrupar criterios de búsqueda. */
export function CollapsibleSection({ title, badge, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-xl border border-periwinkle-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 bg-periwinkle-50 px-3 py-2.5 text-left transition-colors hover:bg-periwinkle-100"
      >
        <span className="text-sm font-medium text-periwinkle-900">{title}</span>
        <span className="flex items-center gap-2">
          {badge && (
            <span className="rounded-full bg-periwinkle-500 px-2 py-0.5 text-xs font-semibold text-white">{badge}</span>
          )}
          <span aria-hidden className={`text-periwinkle-600 transition-transform ${open ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </span>
      </button>
      {open && <div className="border-t border-periwinkle-100 p-3">{children}</div>}
    </div>
  )
}
