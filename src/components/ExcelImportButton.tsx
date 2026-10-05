import { useRef, useState } from 'react'
import type { Lata, LataInput } from '../types'
import { parseLatasExcel, diffAgainstExisting, type ImportDiffResult } from '../lib/excelImport'

interface ExcelImportButtonProps {
  latas: Lata[]
  onImportMissing: (toAdd: LataInput[]) => Promise<void>
}

type Status = 'idle' | 'reading' | 'preview' | 'importing' | 'done' | 'error'

export function ExcelImportButton({ latas, onImportMissing }: ExcelImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [diff, setDiff] = useState<ImportDiffResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite volver a elegir el mismo archivo más adelante
    if (!file) return

    setFileName(file.name)
    setStatus('reading')
    setErrorMessage(null)
    try {
      const parsedRows = await parseLatasExcel(file)
      const result = diffAgainstExisting(
        parsedRows,
        latas.map((l) => ({ marca: l.marca, producto: l.producto })),
      )
      setDiff(result)
      setStatus('preview')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se ha podido leer el archivo.')
      setStatus('error')
    }
  }

  async function handleConfirmImport() {
    if (!diff) return
    setStatus('importing')
    try {
      await onImportMissing(diff.toAdd)
      setStatus('done')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se han podido añadir las latas.')
      setStatus('error')
    }
  }

  function handleClose() {
    setStatus('idle')
    setDiff(null)
    setErrorMessage(null)
    setFileName('')
  }

  const isModalOpen = status !== 'idle'

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          void handleFileChange(e)
        }}
      />
      <button
        type="button"
        onClick={openFilePicker}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-periwinkle-300 bg-white px-4 py-2 text-sm font-semibold text-periwinkle-900 shadow-sm transition-colors hover:bg-periwinkle-50"
      >
        <span aria-hidden>📄</span> Cargar Excel
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-periwinkle-900/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-periwinkle-900">Cargar Excel</h2>
            <p className="mt-1 truncate text-xs text-slate-500">{fileName}</p>

            {status === 'reading' && <p className="mt-4 text-sm text-slate-600">Leyendo y comparando filas…</p>}

            {status === 'error' && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
            )}

            {status === 'preview' && diff && (
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
                <p>
                  Filas leídas en el archivo: <span className="font-semibold">{diff.totalParsed}</span>
                </p>
                <p>
                  Ya existían (se omiten): <span className="font-semibold">{diff.alreadyExisting}</span>
                </p>
                {diff.duplicatesInFile > 0 && (
                  <p>
                    Duplicadas dentro del propio archivo: <span className="font-semibold">{diff.duplicatesInFile}</span>
                  </p>
                )}
                <p className="text-periwinkle-700">
                  Nuevas que se añadirán: <span className="font-semibold">{diff.toAdd.length}</span>
                </p>
                {diff.toAdd.length > 0 && (
                  <ul className="scroll-thin mt-1 max-h-40 overflow-y-auto rounded-lg border border-periwinkle-100 bg-periwinkle-50/50 p-2 text-xs">
                    {diff.toAdd.slice(0, 20).map((row, idx) => (
                      <li key={idx} className="truncate py-0.5">
                        {row.marca} — {row.producto}
                      </li>
                    ))}
                    {diff.toAdd.length > 20 && <li className="py-0.5 text-slate-400">y {diff.toAdd.length - 20} más…</li>}
                  </ul>
                )}
              </div>
            )}

            {status === 'importing' && <p className="mt-4 text-sm text-slate-600">Añadiendo latas nuevas…</p>}

            {status === 'done' && diff && (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Se {diff.toAdd.length === 1 ? 'ha' : 'han'} añadido {diff.toAdd.length}{' '}
                {diff.toAdd.length === 1 ? 'lata nueva' : 'latas nuevas'} correctamente.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {status === 'done' ? 'Cerrar' : 'Cancelar'}
              </button>
              {status === 'preview' && diff && diff.toAdd.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleConfirmImport()}
                  className="rounded-lg bg-periwinkle-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-periwinkle-600"
                >
                  Añadir {diff.toAdd.length} {diff.toAdd.length === 1 ? 'lata' : 'latas'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
