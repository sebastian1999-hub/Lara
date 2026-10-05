import { useMemo, useState } from 'react'
import type { ColumnKey, Lata, SortState } from '../types'
import { MultiChipSelect } from './MultiChipSelect'
import { CollapsibleSection } from './CollapsibleSection'
import { DataTable } from './DataTable'
import { Pagination } from './Pagination'

const DEFAULT_PAGE_SIZE = 5

interface Criteria {
  marca: Set<string>
  tipo: Set<string>
  llevaHuevo: Set<string>
  leGusta: Set<string>
  tiendanimalPuntos: Set<string>
  producto: string
  composicion: string
  precioMin: string
  precioMax: string
}

const EMPTY_CRITERIA: Criteria = {
  marca: new Set(),
  tipo: new Set(),
  llevaHuevo: new Set(),
  leGusta: new Set(),
  tiendanimalPuntos: new Set(),
  producto: '',
  composicion: '',
  precioMin: '',
  precioMax: '',
}

function matches(lata: Lata, criteria: Criteria): boolean {
  if (criteria.marca.size > 0 && !criteria.marca.has(lata.marca)) return false
  if (criteria.tipo.size > 0 && !criteria.tipo.has((lata.tipo ?? '').trim())) return false
  if (criteria.llevaHuevo.size > 0 && !criteria.llevaHuevo.has((lata.lleva_huevo ?? '').trim())) return false
  if (criteria.leGusta.size > 0 && !criteria.leGusta.has((lata.le_gusta ?? '').trim())) return false
  if (criteria.tiendanimalPuntos.size > 0 && !criteria.tiendanimalPuntos.has((lata.tiendanimal_puntos ?? '').trim()))
    return false

  const productoTerm = criteria.producto.trim().toLowerCase()
  if (productoTerm && !lata.producto.toLowerCase().includes(productoTerm)) return false

  const composicionTerm = criteria.composicion.trim().toLowerCase()
  if (composicionTerm && !(lata.composicion ?? '').toLowerCase().includes(composicionTerm)) return false

  if (criteria.precioMin.trim()) {
    const min = Number(criteria.precioMin)
    if (lata.precio === null || lata.precio < min) return false
  }
  if (criteria.precioMax.trim()) {
    const max = Number(criteria.precioMax)
    if (lata.precio === null || lata.precio > max) return false
  }

  return true
}

interface SearchTabProps {
  latas: Lata[]
  distinctValues: Record<string, string[]>
  onEdit: (lata: Lata) => void
  onDeleteRequest: (lata: Lata) => void
}

export function SearchTab({ latas, distinctValues, onEdit, onDeleteRequest }: SearchTabProps) {
  const [draft, setDraft] = useState<Criteria>(EMPTY_CRITERIA)
  const [appliedCriteria, setAppliedCriteria] = useState<Criteria | null>(null)
  const [sort, setSort] = useState<SortState>({ column: null, direction: null })
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [currentPage, setCurrentPage] = useState(1)

  const results = useMemo(() => {
    if (!appliedCriteria) return []
    let rows = latas.filter((lata) => matches(lata, appliedCriteria))

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
  }, [latas, appliedCriteria, sort])

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pagedRows = useMemo(
    () => results.slice((safePage - 1) * pageSize, safePage * pageSize),
    [results, safePage, pageSize],
  )

  function handleSortChange(column: ColumnKey) {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' }
      if (prev.direction === 'asc') return { column, direction: 'desc' }
      return { column: null, direction: null }
    })
    setCurrentPage(1)
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    setAppliedCriteria(draft)
    setSort({ column: null, direction: null })
    setCurrentPage(1)
  }

  function handleClear() {
    setDraft(EMPTY_CRITERIA)
    setAppliedCriteria(null)
    setSort({ column: null, direction: null })
    setCurrentPage(1)
  }

  const hasSearched = appliedCriteria !== null

  const badge = (n: number) => (n > 0 ? String(n) : null)
  const textPriceCount = [draft.producto, draft.composicion, draft.precioMin, draft.precioMax].filter(
    (v) => v.trim() !== '',
  ).length

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-4 rounded-2xl border border-periwinkle-200 bg-white/80 p-4 shadow-soft sm:p-5"
      >
        <div>
          <h2 className="text-base font-semibold text-periwinkle-900">Buscar latas por criterios</h2>
          <p className="text-xs text-slate-500">
            Selecciona o rellena los aspectos que te interesan y pulsa «Buscar» para ver las latas guardadas que los
            cumplen.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <CollapsibleSection title="Marca" badge={badge(draft.marca.size)}>
            <MultiChipSelect
              label="Marca"
              options={distinctValues.marca ?? []}
              selected={draft.marca}
              onChange={(next) => setDraft((prev) => ({ ...prev, marca: next }))}
              maxHeightClass="max-h-40"
            />
          </CollapsibleSection>

          <CollapsibleSection title="Completo / Complementario" badge={badge(draft.tipo.size)}>
            <MultiChipSelect
              label="Completo / Complementario"
              options={distinctValues.tipo ?? []}
              selected={draft.tipo}
              onChange={(next) => setDraft((prev) => ({ ...prev, tipo: next }))}
            />
          </CollapsibleSection>

          <CollapsibleSection title="¿Le gusta a...?" badge={badge(draft.leGusta.size)}>
            <MultiChipSelect
              label="¿Le gusta a...?"
              options={distinctValues.le_gusta ?? []}
              selected={draft.leGusta}
              onChange={(next) => setDraft((prev) => ({ ...prev, leGusta: next }))}
            />
          </CollapsibleSection>

          <CollapsibleSection title="¿Lleva huevo?" badge={badge(draft.llevaHuevo.size)}>
            <MultiChipSelect
              label="¿Lleva huevo?"
              options={distinctValues.lleva_huevo ?? []}
              selected={draft.llevaHuevo}
              onChange={(next) => setDraft((prev) => ({ ...prev, llevaHuevo: next }))}
              maxHeightClass="max-h-40"
            />
          </CollapsibleSection>

          <CollapsibleSection title="Tiendanimal / puntos" badge={badge(draft.tiendanimalPuntos.size)}>
            <MultiChipSelect
              label="Tiendanimal / puntos"
              options={distinctValues.tiendanimal_puntos ?? []}
              selected={draft.tiendanimalPuntos}
              onChange={(next) => setDraft((prev) => ({ ...prev, tiendanimalPuntos: next }))}
              maxHeightClass="max-h-40"
            />
          </CollapsibleSection>

          <CollapsibleSection title="Texto y precio" badge={badge(textPriceCount)}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-periwinkle-900">Producto / Variante contiene</span>
                <input
                  value={draft.producto}
                  onChange={(e) => setDraft((prev) => ({ ...prev, producto: e.target.value }))}
                  placeholder="p. ej. pollo, atún..."
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-periwinkle-900">Composición contiene</span>
                <input
                  value={draft.composicion}
                  onChange={(e) => setDraft((prev) => ({ ...prev, composicion: e.target.value }))}
                  placeholder="p. ej. arándanos, arroz..."
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-periwinkle-900">Precio mínimo (€)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.precioMin}
                  onChange={(e) => setDraft((prev) => ({ ...prev, precioMin: e.target.value }))}
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-periwinkle-900">Precio máximo (€)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.precioMax}
                  onChange={(e) => setDraft((prev) => ({ ...prev, precioMax: e.target.value }))}
                  className="input"
                />
              </label>
            </div>
          </CollapsibleSection>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-butter-200 px-5 py-2 text-sm font-semibold text-periwinkle-900 shadow-sm transition-colors hover:bg-butter-300"
          >
            🔍 Buscar
          </button>
        </div>
      </form>

      {hasSearched && (
        <>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-periwinkle-700">{results.length}</span>{' '}
            {results.length === 1 ? 'lata encontrada' : 'latas encontradas'}
          </p>
          <DataTable
            rows={pagedRows}
            sort={sort}
            onSortChange={handleSortChange}
            onEdit={onEdit}
            onDeleteRequest={onDeleteRequest}
          />
          <Pagination
            page={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={results.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}
    </div>
  )
}
