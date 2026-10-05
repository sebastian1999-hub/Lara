import { useEffect, useMemo, useRef, useState } from 'react'

interface FilterDropdownProps {
  label: string
  options: string[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}

export function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(
    () => options.filter((option) => option.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  )

  const isActive = selected.size > 0

  function toggleOption(option: string) {
    const next = new Set(selected)
    if (next.has(option)) {
      next.delete(option)
    } else {
      next.add(option)
    }
    onChange(next)
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Filtrar por ${label}`}
        aria-expanded={open}
        className={`ml-1 rounded p-1 text-xs transition-colors ${
          isActive ? 'bg-periwinkle-500 text-white' : 'text-periwinkle-700 hover:bg-periwinkle-100'
        }`}
      >
        ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-periwinkle-200 bg-white p-2 shadow-soft">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar valor..."
            className="mb-2 w-full rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-periwinkle-400 focus:outline-none"
          />
          <div className="flex justify-between px-1 pb-1 text-[11px] text-periwinkle-600">
            <button type="button" className="hover:underline" onClick={() => onChange(new Set(options))}>
              Seleccionar todo
            </button>
            <button type="button" className="hover:underline" onClick={() => onChange(new Set())}>
              Limpiar
            </button>
          </div>
          <div className="scroll-thin max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 && (
              <p className="px-1 py-2 text-xs text-slate-400">Sin coincidencias</p>
            )}
            {filteredOptions.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-periwinkle-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(option)}
                  onChange={() => toggleOption(option)}
                  className="accent-periwinkle-500"
                />
                <span className="truncate">{option || '(Vacío)'}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
