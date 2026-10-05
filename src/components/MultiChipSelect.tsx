interface MultiChipSelectProps {
  label: string
  options: string[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
  maxHeightClass?: string
}

/** Lista de chips seleccionables (multi-selección) usada en el formulario de búsqueda. */
export function MultiChipSelect({ label, options, selected, onChange, maxHeightClass }: MultiChipSelectProps) {
  function toggle(option: string) {
    const next = new Set(selected)
    if (next.has(option)) {
      next.delete(option)
    } else {
      next.add(option)
    }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-periwinkle-900">{label}</span>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => onChange(new Set())}
            className="text-xs font-medium text-periwinkle-600 hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-slate-400">Sin valores disponibles todavía.</p>
      ) : (
        <div className={`scroll-thin flex flex-wrap gap-1.5 overflow-y-auto ${maxHeightClass ?? ''}`}>
          {options.map((option) => {
            const isSelected = selected.has(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                aria-pressed={isSelected}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'border-periwinkle-500 bg-periwinkle-500 text-white'
                    : 'border-periwinkle-200 bg-white text-periwinkle-700 hover:bg-periwinkle-50'
                }`}
              >
                {option || '(Vacío)'}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
