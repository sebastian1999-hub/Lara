interface ToolbarProps {
  resultCount: number
  totalCount: number
  activeFilterCount: number
  onResetFilters: () => void
}

export function Toolbar({ resultCount, totalCount, activeFilterCount, onResetFilters }: ToolbarProps) {
  return (
    <p className="text-xs text-slate-500">
      Mostrando <span className="font-semibold text-periwinkle-700">{resultCount}</span> de {totalCount} latas
      {activeFilterCount > 0 && (
        <button type="button" onClick={onResetFilters} className="ml-2 font-medium text-periwinkle-600 hover:underline">
          Quitar filtros ({activeFilterCount})
        </button>
      )}
    </p>
  )
}
