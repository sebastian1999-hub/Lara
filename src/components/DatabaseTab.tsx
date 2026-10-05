import { useMemo, useState } from 'react'
import { COLUMNS } from '../types'
import type { ColumnKey, Lata, LataInput, SortState } from '../types'
import { Toolbar } from './Toolbar'
import { DataTable } from './DataTable'
import { Pagination } from './Pagination'
import { ExcelImportButton } from './ExcelImportButton'

const FACET_COLUMNS = COLUMNS.filter((c) => c.facetFilter).map((c) => c.key)
const DEFAULT_PAGE_SIZE = 5

interface DatabaseTabProps {
  latas: Lata[]
  distinctValues: Record<string, string[]>
  onEdit: (lata: Lata) => void
  onDeleteRequest: (lata: Lata) => void
  onImportMissing: (toAdd: LataInput[]) => Promise<void>
}

export function DatabaseTab({ latas, distinctValues, onEdit, onDeleteRequest, onImportMissing }: DatabaseTabProps) {
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({})
  const [sort, setSort] = useState<SortState>({ column: null, direction: null })
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredAndSortedRows = useMemo(() => {
    let rows = latas.filter((lata) => {
      for (const key of FACET_COLUMNS) {
        const selected = columnFilters[key]
        if (selected && selected.size > 0) {
          const value = ((lata[key] as string | null) ?? '').trim()
          if (!selected.has(value)) return false
        }
      }
      return true
    })

    if (sort.column && sort.direction) {
      const { column, direction } = sort
      rows = [...rows].sort((a, b) => {
        const va = a[column]
        const vb = b[column]
        let comparison: number
        if (typeof va === 'number' || typeof vb === 'number') {
          const na = va === null || va === undefined ? -Infinity : Number(va)
          const nb = vb === null || vb === undefined ? -Infinity : Number(vb)
          comparison = na - nb
        } else {
          comparison = (va ?? '').toString().localeCompare((vb ?? '').toString(), 'es')
        }
        return direction === 'asc' ? comparison : -comparison
      })
    }

    return rows
  }, [latas, columnFilters, sort])

  const activeFilterCount = Object.values(columnFilters).filter((s) => s.size > 0).length

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pagedRows = useMemo(
    () => filteredAndSortedRows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredAndSortedRows, safePage, pageSize],
  )

  function handleSortChange(column: ColumnKey) {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' }
      if (prev.direction === 'asc') return { column, direction: 'desc' }
      return { column: null, direction: null }
    })
    setCurrentPage(1)
  }

  function handleFilterChange(column: ColumnKey, next: Set<string>) {
    setColumnFilters((prev) => ({ ...prev, [column]: next }))
    setCurrentPage(1)
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setCurrentPage(1)
  }

  function resetFilters() {
    setColumnFilters({})
    setCurrentPage(1)
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Toolbar
          resultCount={filteredAndSortedRows.length}
          totalCount={latas.length}
          activeFilterCount={activeFilterCount}
          onResetFilters={resetFilters}
        />
        <ExcelImportButton latas={latas} onImportMissing={onImportMissing} />
      </div>

      <DataTable
        rows={pagedRows}
        sort={sort}
        onSortChange={handleSortChange}
        columnFilters={columnFilters}
        onFilterChange={handleFilterChange}
        distinctValues={distinctValues}
        onEdit={onEdit}
        onDeleteRequest={onDeleteRequest}
      />
      <Pagination
        page={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredAndSortedRows.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </>
  )
}
