import type { LataInput } from '../types'

export interface ParsedExcelRow {
  marca: string
  producto: string
  composicion: string
  lleva_huevo: string
  tipo: string
  le_gusta: string
  tiendanimal_puntos: string
  enlace: string
  precio: number | null
}

interface ColumnMap {
  marca?: number
  producto?: number
  composicion?: number
  lleva_huevo?: number
  tipo?: number
  le_gusta?: number
  tiendanimal_puntos?: number
  enlace?: number
  precio?: number
}

function normalizeHeader(value: unknown): string {
  return (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos para comparar de forma robusta
}

function detectColumns(headerRow: unknown[]): ColumnMap {
  const map: ColumnMap = {}
  headerRow.forEach((cell, index) => {
    const header = normalizeHeader(cell)
    if (!header) return
    if (map.marca === undefined && header.includes('marca')) map.marca = index
    else if (map.producto === undefined && (header.includes('producto') || header.includes('variante'))) map.producto = index
    else if (map.composicion === undefined && header.includes('composic')) map.composicion = index
    else if (map.lleva_huevo === undefined && header.includes('huevo')) map.lleva_huevo = index
    else if (map.tipo === undefined && (header.includes('completo') || header.includes('complementario'))) map.tipo = index
    else if (map.le_gusta === undefined && header.includes('gusta')) map.le_gusta = index
    else if (map.tiendanimal_puntos === undefined && (header.includes('tiendanimal') || header.includes('puntos'))) map.tiendanimal_puntos = index
    else if (map.precio === undefined && header.includes('precio')) map.precio = index
    else if (map.enlace === undefined && (header.includes('enlace') || header.includes('link') || header.includes('url'))) map.enlace = index
  })
  return map
}

function cellText(row: unknown[], index: number | undefined): string {
  if (index === undefined) return ''
  const value = row[index]
  return (value ?? '').toString().trim()
}

/**
 * Lee un archivo Excel (.xlsx/.xls) y extrae las filas de la primera hoja cuya
 * cabecera contenga una columna "Marca", normalizando los valores de cada celda.
 */
export async function parseLatasExcel(file: File): Promise<ParsedExcelRow[]> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })
    if (rows.length === 0) continue

    const headerRow = rows[0]
    const columns = detectColumns(headerRow)
    if (columns.marca === undefined || columns.producto === undefined) continue // no es la hoja correcta

    const parsed: ParsedExcelRow[] = []
    for (const row of rows.slice(1)) {
      const marca = cellText(row, columns.marca)
      const producto = cellText(row, columns.producto)
      if (!marca && !producto) continue // fila vacía

      const precioRaw = columns.precio !== undefined ? row[columns.precio] : null
      const precio =
        precioRaw === null || precioRaw === undefined || precioRaw === ''
          ? null
          : Number(precioRaw.toString().replace(',', '.'))

      parsed.push({
        marca,
        producto,
        composicion: cellText(row, columns.composicion),
        lleva_huevo: cellText(row, columns.lleva_huevo) || 'NO',
        tipo: cellText(row, columns.tipo),
        le_gusta: cellText(row, columns.le_gusta),
        tiendanimal_puntos: cellText(row, columns.tiendanimal_puntos),
        enlace: cellText(row, columns.enlace),
        precio: precio !== null && Number.isFinite(precio) ? precio : null,
      })
    }
    return parsed
  }

  throw new Error('No se ha encontrado ninguna hoja con una columna "Marca" y "Producto / Variante" reconocible.')
}

/** Clave normalizada (minúsculas, sin espacios extra) usada para detectar duplicados. */
export function normalizedKey(marca: string, producto: string): string {
  return `${marca.trim().toLowerCase()}||${producto.trim().toLowerCase()}`
}

export interface ImportDiffResult {
  totalParsed: number
  duplicatesInFile: number
  alreadyExisting: number
  toAdd: LataInput[]
}

/**
 * Compara las filas leídas del Excel con las latas ya existentes (normalizando
 * marca+producto a minúsculas) y devuelve solo las que faltan por añadir.
 */
export function diffAgainstExisting(
  parsedRows: ParsedExcelRow[],
  existing: { marca: string; producto: string }[],
): ImportDiffResult {
  const existingKeys = new Set(existing.map((l) => normalizedKey(l.marca, l.producto)))
  const seenInFile = new Set<string>()
  const toAdd: LataInput[] = []
  let duplicatesInFile = 0
  let alreadyExisting = 0

  for (const row of parsedRows) {
    const key = normalizedKey(row.marca, row.producto)
    if (existingKeys.has(key)) {
      alreadyExisting += 1
      continue
    }
    if (seenInFile.has(key)) {
      duplicatesInFile += 1
      continue
    }
    seenInFile.add(key)
    toAdd.push({
      marca: row.marca,
      producto: row.producto,
      composicion: row.composicion,
      lleva_huevo: row.lleva_huevo,
      tipo: row.tipo,
      le_gusta: row.le_gusta,
      tiendanimal_puntos: row.tiendanimal_puntos,
      enlace: row.enlace,
      precio: row.precio,
    })
  }

  return {
    totalParsed: parsedRows.length,
    duplicatesInFile,
    alreadyExisting,
    toAdd,
  }
}
