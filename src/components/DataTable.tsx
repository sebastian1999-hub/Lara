import { useState } from 'react'
import { COLUMNS } from '../types'
import type { ColumnKey, Lata, SortState } from '../types'
import { FilterDropdown } from './FilterDropdown'

interface DataTableProps {
  rows: Lata[]
  sort: SortState
  onSortChange: (column: ColumnKey) => void
  columnFilters?: Record<string, Set<string>>
  onFilterChange?: (column: ColumnKey, next: Set<string>) => void
  distinctValues?: Record<string, string[]>
  onEdit: (lata: Lata) => void
  onDeleteRequest: (lata: Lata) => void
}

function formatPrecio(precio: number | null) {
  if (precio === null || precio === undefined) return '—'
  return precio.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (direction === 'asc') return <span aria-hidden>▲</span>
  if (direction === 'desc') return <span aria-hidden>▼</span>
  return <span aria-hidden className="text-slate-300">⇅</span>
}

export function DataTable({
  rows,
  sort,
  onSortChange,
  columnFilters,
  onFilterChange,
  distinctValues,
  onEdit,
  onDeleteRequest,
}: DataTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <div className="scroll-thin w-full min-w-0 overflow-x-auto rounded-2xl border border-periwinkle-200 bg-white shadow-soft">
      <table className="w-full min-w-[1100px] border-collapse text-left text-xs sm:text-sm">
        <thead className="sticky top-0 z-20 bg-periwinkle-300">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-2 py-2 font-semibold text-periwinkle-900 sm:px-3 sm:py-3 ${col.widthClass}`}
              >
                <div className="flex items-center gap-1">
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(col.key)}
                      className="flex items-center gap-1 hover:underline"
                    >
                      {col.label}
                      <SortIcon direction={sort.column === col.key ? sort.direction : null} />
                    </button>
                  ) : (
                    <span>{col.label}</span>
                  )}
                  {col.facetFilter && onFilterChange && (
                    <FilterDropdown
                      label={col.label}
                      options={distinctValues?.[col.key] ?? []}
                      selected={columnFilters?.[col.key] ?? new Set()}
                      onChange={(next) => onFilterChange(col.key, next)}
                    />
                  )}
                </div>
              </th>
            ))}
            <th className="px-2 py-2 text-right font-semibold text-periwinkle-900 sm:px-3 sm:py-3">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lata, idx) => {
            const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-periwinkle-50'
            return (
              <tr key={lata.id} className={`border-t border-periwinkle-100 align-top ${rowBg}`}>
                <td className={`px-2 py-2 font-medium text-periwinkle-900 sm:px-3 sm:py-3 ${rowBg}`}>
                  {lata.marca}
                </td>
                <td className="px-2 py-2 sm:px-3 sm:py-3">{lata.producto}</td>
                <td className="px-2 py-2 text-slate-600 sm:px-3 sm:py-3">
                  <p className={expandedId === lata.id ? '' : 'line-clamp-3'}>{lata.composicion}</p>
                  {lata.composicion && lata.composicion.length > 140 && (
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-periwinkle-600 hover:underline"
                      onClick={() => setExpandedId(expandedId === lata.id ? null : lata.id)}
                    >
                      {expandedId === lata.id ? 'Ver menos' : 'Ver más'}
                    </button>
                  )}
                </td>
                <td className="px-2 py-2 sm:px-3 sm:py-3">
                  <Badge value={lata.lleva_huevo} tone={lata.lleva_huevo?.toUpperCase().startsWith('S') ? 'warn' : 'neutral'} />
                </td>
                <td className="px-2 py-2 sm:px-3 sm:py-3">
                  <Badge value={lata.tipo} tone={lata.tipo === 'Completo' ? 'good' : 'neutral'} />
                </td>
                <td className="px-2 py-2 sm:px-3 sm:py-3">{lata.le_gusta || '—'}</td>
                <td className="px-2 py-2 sm:px-3 sm:py-3">{lata.tiendanimal_puntos || '—'}</td>
                <td className="px-2 py-2 font-medium sm:px-3 sm:py-3">{formatPrecio(lata.precio)}</td>
                <td className="px-2 py-2 sm:px-3 sm:py-3">
                  {lata.enlace ? (
                    <a
                      href={lata.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-periwinkle-600 hover:underline"
                    >
                      Ver ficha ↗
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={`px-2 py-2 sm:px-3 sm:py-3 ${rowBg}`}>
                  <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(lata)}
                      className="rounded-lg px-1.5 py-1 text-xs font-medium text-periwinkle-700 hover:bg-periwinkle-100 sm:px-2"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(lata)}
                      className="rounded-lg px-1.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 sm:px-2"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="px-3 py-10 text-center text-slate-400">
                No hay latas que coincidan con los filtros aplicados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ value, tone }: { value: string | null; tone: 'good' | 'warn' | 'neutral' | 'info' }) {
  if (!value) return <span className="text-slate-400">—</span>
  const toneClasses: Record<string, string> = {
    good: 'bg-emerald-100 text-emerald-700',
    warn: 'bg-butter-200 text-butter-800',
    neutral: 'bg-slate-100 text-slate-600',
    info: 'bg-periwinkle-100 text-periwinkle-700',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>{value}</span>
  )
}
