import { useMemo, useState } from 'react'
import { useLatas } from './hooks/useLatas'
import { COLUMNS } from './types'
import type { Lata, LataInput } from './types'
import { DatabaseTab } from './components/DatabaseTab'
import { SearchTab } from './components/SearchTab'
import { LataFormModal } from './components/LataFormModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Toast } from './components/Toast'

const FACET_COLUMNS = COLUMNS.filter((c) => c.facetFilter).map((c) => c.key)

type Tab = 'database' | 'search'

const TABS: { id: Tab; label: string }[] = [
  { id: 'search', label: 'Buscar' },
  { id: 'database', label: 'Base de datos' },
]

export default function App() {
  const { latas, loading, error, reload, addLata, addLatas, updateLata, updatePrecio, deleteLata } = useLatas()

  const [activeTab, setActiveTab] = useState<Tab>('search')

  const [editingLata, setEditingLata] = useState<Lata | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Lata | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const distinctValues = useMemo(() => {
    const result: Record<string, string[]> = {}
    for (const key of FACET_COLUMNS) {
      const values = new Set<string>()
      for (const lata of latas) {
        values.add(((lata[key] as string | null) ?? '').trim())
      }
      result[key] = Array.from(values).sort((a, b) => a.localeCompare(b, 'es'))
    }
    // Para el formulario también interesan sugerencias de marca (no es columna facetada aparte)
    result.marca = Array.from(new Set(latas.map((l) => l.marca))).sort((a, b) => a.localeCompare(b, 'es'))
    return result
  }, [latas])

  function openAddForm() {
    setEditingLata(null)
    setIsFormOpen(true)
  }

  function openEditForm(lata: Lata) {
    setEditingLata(lata)
    setIsFormOpen(true)
  }

  async function handleSave(input: LataInput) {
    setBusy(true)
    try {
      if (editingLata) {
        await updateLata(editingLata.id, input)
        setToast({ message: 'Lata actualizada correctamente.', type: 'success' })
      } else {
        await addLata(input)
        setToast({ message: 'Lata añadida correctamente.', type: 'success' })
      }
      setIsFormOpen(false)
      setEditingLata(null)
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Ha ocurrido un error.', type: 'error' })
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setBusy(true)
    try {
      await deleteLata(pendingDelete.id)
      setToast({ message: 'Lata eliminada.', type: 'success' })
      setPendingDelete(null)
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'No se ha podido eliminar.', type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function handleImportMissing(toAdd: LataInput[]) {
    if (toAdd.length === 0) return
    await addLatas(toAdd)
    setToast({
      message: `Se ${toAdd.length === 1 ? 'ha' : 'han'} añadido ${toAdd.length} ${toAdd.length === 1 ? 'lata nueva' : 'latas nuevas'} desde el Excel.`,
      type: 'success',
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-periwinkle-200 bg-periwinkle-300/95 backdrop-blur">
        <div className="mx-auto flex flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-xl font-bold text-periwinkle-900 sm:text-2xl">
              <img src={`${import.meta.env.BASE_URL}gato.png`} alt="" className="h-8 w-8 sm:h-9 sm:w-9" />
              Lara · Comparador de latas para gatos
            </h1>
            <p className="text-xs text-periwinkle-800/80 sm:text-sm">
              Consulta, filtra, ordena y gestiona la comparativa de comida húmeda para Luna y Artemis.
            </p>
          </div>

          <nav className="flex items-center justify-between gap-2" role="tablist">
            <div className="flex gap-1.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-periwinkle-900 shadow-sm'
                      : 'text-periwinkle-900/70 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-butter-200 px-4 py-2 text-sm font-semibold text-periwinkle-900 shadow-sm transition-colors hover:bg-butter-300"
            >
              <span aria-hidden>＋</span> Añadir lata
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full flex-1 flex-col gap-3 px-4 py-4 sm:px-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Error al cargar los datos: {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-periwinkle-200 bg-white/70 p-16 text-periwinkle-600 shadow-soft">
            Cargando latas…
          </div>
        ) : activeTab === 'database' ? (
          <DatabaseTab
            latas={latas}
            distinctValues={distinctValues}
            onEdit={openEditForm}
            onDeleteRequest={setPendingDelete}
            onImportMissing={handleImportMissing}
            onUpdatePrecio={updatePrecio}
            onReload={reload}
          />
        ) : (
          <SearchTab
            latas={latas}
            distinctValues={distinctValues}
            onEdit={openEditForm}
            onDeleteRequest={setPendingDelete}
          />
        )}
      </main>

      {isFormOpen && (
        <LataFormModal
          initial={editingLata}
          distinctValues={distinctValues}
          busy={busy}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false)
            setEditingLata(null)
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar lata"
          description={`¿Seguro que quieres eliminar "${pendingDelete.producto}" (${pendingDelete.marca})? Esta acción no se puede deshacer.`}
          busy={busy}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
