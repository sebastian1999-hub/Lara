const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ page, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationProps) {
  if (totalItems === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-periwinkle-200 bg-white/80 px-4 py-2.5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 sm:justify-start">
        <span>
          <span className="font-semibold text-periwinkle-700">{start}–{end}</span> de {totalItems}
        </span>
        <label className="flex items-center gap-1">
          <span>Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs focus:border-periwinkle-400 focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-center gap-1">
        <button type="button" onClick={() => onPageChange(1)} disabled={page <= 1} className="pagination-btn" aria-label="Primera página">
          «
        </button>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="pagination-btn" aria-label="Página anterior">
          ‹
        </button>
        <span className="px-2 text-xs font-medium text-periwinkle-800">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="pagination-btn"
          aria-label="Página siguiente"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="pagination-btn"
          aria-label="Última página"
        >
          »
        </button>
      </div>
    </div>
  )
}
