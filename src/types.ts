export interface Lata {
  id: number
  marca: string
  producto: string
  composicion: string | null
  lleva_huevo: string
  tipo: string | null
  le_gusta: string | null
  tiendanimal_puntos: string | null
  enlace: string | null
  precio: number | null
  created_at: string
  updated_at: string
}

/** Campos editables de una lata, usados en el formulario de alta/edición. */
export type LataInput = Omit<Lata, 'id' | 'created_at' | 'updated_at'>

export const EMPTY_LATA_INPUT: LataInput = {
  marca: '',
  producto: '',
  composicion: '',
  lleva_huevo: 'NO',
  tipo: '',
  le_gusta: '',
  tiendanimal_puntos: '',
  enlace: '',
  precio: null,
}

/** Columnas de texto sobre las que se puede filtrar/ordenar en la tabla. */
export type ColumnKey = keyof Omit<Lata, 'id' | 'created_at' | 'updated_at'>

export interface ColumnDef {
  key: ColumnKey
  label: string
  /** Si es true, el filtro se muestra como lista de valores únicos (estilo Excel). */
  facetFilter: boolean
  sortable: boolean
  widthClass: string
}

export const COLUMNS: ColumnDef[] = [
  { key: 'marca', label: 'Marca', facetFilter: true, sortable: true, widthClass: 'min-w-[140px]' },
  { key: 'producto', label: 'Producto / Variante', facetFilter: false, sortable: true, widthClass: 'min-w-[240px]' },
  { key: 'composicion', label: 'Composición', facetFilter: false, sortable: false, widthClass: 'min-w-[320px]' },
  { key: 'lleva_huevo', label: '¿Lleva huevo?', facetFilter: true, sortable: true, widthClass: 'min-w-[180px]' },
  { key: 'tipo', label: 'Completo / Complementario', facetFilter: true, sortable: true, widthClass: 'min-w-[160px]' },
  { key: 'le_gusta', label: '¿Le gusta a...?', facetFilter: true, sortable: true, widthClass: 'min-w-[140px]' },
  { key: 'tiendanimal_puntos', label: 'Tiendanimal / puntos', facetFilter: true, sortable: true, widthClass: 'min-w-[160px]' },
  { key: 'precio', label: 'Precio', facetFilter: false, sortable: true, widthClass: 'min-w-[110px]' },
  { key: 'enlace', label: 'Enlace', facetFilter: false, sortable: false, widthClass: 'min-w-[120px]' },
]

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  column: ColumnKey | null
  direction: SortDirection
}
