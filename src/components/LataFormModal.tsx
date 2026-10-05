import { useEffect, useState } from 'react'
import type { Lata, LataInput } from '../types'
import { EMPTY_LATA_INPUT } from '../types'

interface LataFormModalProps {
  initial: Lata | null
  distinctValues: Record<string, string[]>
  busy: boolean
  onSave: (input: LataInput) => Promise<void>
  onClose: () => void
}

export function LataFormModal({ initial, distinctValues, busy, onSave, onClose }: LataFormModalProps) {
  const [form, setForm] = useState<LataInput>(EMPTY_LATA_INPUT)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    // Sincroniza el formulario con la fila que se está editando (o lo resetea al añadir una nueva).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(
      initial
        ? {
            marca: initial.marca,
            producto: initial.producto,
            composicion: initial.composicion,
            lleva_huevo: initial.lleva_huevo,
            tipo: initial.tipo,
            le_gusta: initial.le_gusta,
            tiendanimal_puntos: initial.tiendanimal_puntos,
            enlace: initial.enlace,
            precio: initial.precio,
          }
        : EMPTY_LATA_INPUT,
    )
  }, [initial])

  function update<K extends keyof LataInput>(key: K, value: LataInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!form.marca.trim() || !form.producto.trim()) {
      setFormError('Marca y Producto / Variante son obligatorios.')
      return
    }
    try {
      await onSave({
        ...form,
        marca: form.marca.trim(),
        producto: form.producto.trim(),
        lleva_huevo: form.lleva_huevo.trim() || 'NO',
        precio: form.precio === null || Number.isNaN(form.precio) ? null : form.precio,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se ha podido guardar la lata.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-periwinkle-900/40 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-soft"
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-periwinkle-900">
            {initial ? 'Editar lata' : 'Añadir nueva lata'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Marca *">
            <input
              required
              list="marca-options"
              value={form.marca}
              onChange={(e) => update('marca', e.target.value)}
              className="input"
            />
            <datalist id="marca-options">
              {distinctValues.marca?.map((v) => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="Producto / Variante *">
            <input
              required
              value={form.producto}
              onChange={(e) => update('producto', e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Composición" full>
            <textarea
              value={form.composicion ?? ''}
              onChange={(e) => update('composicion', e.target.value)}
              rows={3}
              className="input resize-y"
            />
          </Field>

          <Field label="¿Lleva huevo?">
            <input
              list="huevo-options"
              placeholder="NO / SÍ – detalle"
              value={form.lleva_huevo}
              onChange={(e) => update('lleva_huevo', e.target.value)}
              className="input"
            />
            <datalist id="huevo-options">
              {distinctValues.lleva_huevo?.map((v) => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="Completo / Complementario">
            <input
              list="tipo-options"
              value={form.tipo ?? ''}
              onChange={(e) => update('tipo', e.target.value)}
              className="input"
            />
            <datalist id="tipo-options">
              {distinctValues.tipo?.map((v) => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="¿Le gusta a...?">
            <input
              list="gusta-options"
              value={form.le_gusta ?? ''}
              onChange={(e) => update('le_gusta', e.target.value)}
              className="input"
            />
            <datalist id="gusta-options">
              {distinctValues.le_gusta?.map((v) => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="Tiendanimal / puntos">
            <input
              list="puntos-options"
              value={form.tiendanimal_puntos ?? ''}
              onChange={(e) => update('tiendanimal_puntos', e.target.value)}
              className="input"
            />
            <datalist id="puntos-options">
              {distinctValues.tiendanimal_puntos?.map((v) => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="Precio (€)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.precio ?? ''}
              onChange={(e) => update('precio', e.target.value === '' ? null : Number(e.target.value))}
              className="input"
            />
          </Field>

          <Field label="Enlace" full>
            <input
              type="url"
              placeholder="https://..."
              value={form.enlace ?? ''}
              onChange={(e) => update('enlace', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        {formError && <p className="mt-4 text-sm text-red-600">{formError}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-periwinkle-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-periwinkle-600 disabled:opacity-50"
          >
            {busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Añadir lata'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${full ? 'sm:col-span-2' : ''}`}>
      <span className="font-medium text-periwinkle-900">{label}</span>
      {children}
    </label>
  )
}
