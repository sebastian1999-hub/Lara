import { useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Lata } from '../types'

interface UpdatePricesButtonProps {
  latas: Lata[]
  onUpdatePrice: (id: number, precio: number) => Promise<void>
  onFinished: () => Promise<void>
}

type Status = 'idle' | 'confirm' | 'running' | 'done'

interface LogEntry {
  id: number
  label: string
  kind: 'updated' | 'not-found' | 'error'
  detail: string
}

const DELAY_BETWEEN_REQUESTS_MS = 400

function formatPrecio(precio: number) {
  return precio.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function UpdatePricesButton({ latas, onUpdatePrice, onFinished }: UpdatePricesButtonProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [log, setLog] = useState<LogEntry[]>([])
  const cancelRef = useRef(false)

  const candidates = latas.filter((l) => (l.enlace ?? '').trim() !== '')

  function openConfirm() {
    setStatus('confirm')
  }

  function handleClose() {
    setStatus('idle')
    setLog([])
    setProgress({ done: 0, total: 0 })
  }

  function handleCancel() {
    cancelRef.current = true
  }

  async function handleStart() {
    cancelRef.current = false
    setLog([])
    setProgress({ done: 0, total: candidates.length })
    setStatus('running')

    for (let i = 0; i < candidates.length; i++) {
      if (cancelRef.current) break
      const lata = candidates[i]
      const label = `${lata.marca} — ${lata.producto}`

      try {
        const { data, error } = await supabase.functions.invoke<{ price: number | null; error?: string }>(
          'scrape-price',
          { body: { url: lata.enlace } },
        )

        if (error) {
          setLog((prev) => [...prev, { id: lata.id, label, kind: 'error', detail: error.message }])
        } else if (data?.price && data.price > 0) {
          await onUpdatePrice(lata.id, data.price)
          setLog((prev) => [...prev, { id: lata.id, label, kind: 'updated', detail: formatPrecio(data.price as number) }])
        } else {
          setLog((prev) => [...prev, { id: lata.id, label, kind: 'not-found', detail: data?.error ?? 'Precio no encontrado' }])
        }
      } catch (err) {
        setLog((prev) => [
          ...prev,
          { id: lata.id, label, kind: 'error', detail: err instanceof Error ? err.message : 'Error desconocido' },
        ])
      }

      setProgress({ done: i + 1, total: candidates.length })
      if (i < candidates.length - 1) await sleep(DELAY_BETWEEN_REQUESTS_MS)
    }

    await onFinished()
    setStatus('done')
  }

  const isModalOpen = status !== 'idle'
  const updatedCount = log.filter((l) => l.kind === 'updated').length
  const notFoundCount = log.filter((l) => l.kind === 'not-found').length
  const errorCount = log.filter((l) => l.kind === 'error').length

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-periwinkle-300 bg-white px-4 py-2 text-sm font-semibold text-periwinkle-900 shadow-sm transition-colors hover:bg-periwinkle-50"
      >
        <span aria-hidden>💶</span> Actualizar precios
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-periwinkle-900/40 p-4" role="dialog" aria-modal="true">
          <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-periwinkle-900">Actualizar precios desde el enlace</h2>

            {status === 'confirm' && (
              <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                <p>
                  Se recorrerán las <span className="font-semibold text-periwinkle-700">{candidates.length}</span> latas
                  que tienen un enlace de compra guardado, se leerá el precio de la página de cada una y se actualizará
                  en la base de datos.
                </p>
                <p className="text-xs text-slate-500">
                  El proceso puede tardar varios segundos (se espera un poco entre cada lata para no saturar las
                  tiendas). Puedes cancelarlo en cualquier momento.
                </p>
              </div>
            )}

            {(status === 'running' || status === 'done') && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {status === 'running' ? 'Procesando…' : 'Completado'} {progress.done} / {progress.total}
                  </span>
                  <span>
                    ✅ {updatedCount} · ⚠️ {notFoundCount} · ❌ {errorCount}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-periwinkle-100">
                  <div
                    className="h-full bg-periwinkle-500 transition-all"
                    style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                  />
                </div>
                <ul className="scroll-thin max-h-56 overflow-y-auto rounded-lg border border-periwinkle-100 bg-periwinkle-50/50 p-2 text-xs">
                  {log
                    .slice()
                    .reverse()
                    .map((entry, idx) => (
                      <li key={`${entry.id}-${idx}`} className="flex items-start gap-1.5 py-0.5">
                        <span aria-hidden>{entry.kind === 'updated' ? '✅' : entry.kind === 'not-found' ? '⚠️' : '❌'}</span>
                        <span className="truncate">
                          <span className="font-medium">{entry.label}</span> — {entry.detail}
                        </span>
                      </li>
                    ))}
                  {log.length === 0 && <li className="py-1 text-slate-400">Esperando resultados…</li>}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={status === 'running' ? handleCancel : handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {status === 'running' ? 'Cancelar' : 'Cerrar'}
              </button>
              {status === 'confirm' && (
                <button
                  type="button"
                  onClick={() => void handleStart()}
                  disabled={candidates.length === 0}
                  className="rounded-lg bg-periwinkle-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-periwinkle-600 disabled:opacity-50"
                >
                  Empezar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
