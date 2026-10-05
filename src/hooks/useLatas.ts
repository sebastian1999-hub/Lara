import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Lata, LataInput } from '../types'

interface UseLatasResult {
  latas: Lata[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  addLata: (input: LataInput) => Promise<void>
  addLatas: (inputs: LataInput[]) => Promise<void>
  updateLata: (id: number, input: LataInput) => Promise<void>
  /** Actualiza solo el precio de una lata, sin recargar el listado (pensado para procesos en bloque). */
  updatePrecio: (id: number, precio: number) => Promise<void>
  deleteLata: (id: number) => Promise<void>
}

export function useLatas(): UseLatasResult {
  const [latas, setLatas] = useState<Lata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('latas')
      .select('*')
      .order('id', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setLatas(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Carga inicial de datos desde Supabase al montar el componente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  const addLata = useCallback(async (input: LataInput) => {
    const { error: insertError } = await supabase.from('latas').insert(input)
    if (insertError) throw new Error(insertError.message)
    await reload()
  }, [reload])

  const addLatas = useCallback(async (inputs: LataInput[]) => {
    if (inputs.length === 0) return
    const { error: insertError } = await supabase.from('latas').insert(inputs)
    if (insertError) throw new Error(insertError.message)
    await reload()
  }, [reload])

  const updateLata = useCallback(async (id: number, input: LataInput) => {
    const { error: updateError } = await supabase.from('latas').update(input).eq('id', id)
    if (updateError) throw new Error(updateError.message)
    await reload()
  }, [reload])

  const updatePrecio = useCallback(async (id: number, precio: number) => {
    const { error: updateError } = await supabase.from('latas').update({ precio }).eq('id', id)
    if (updateError) throw new Error(updateError.message)
  }, [])

  const deleteLata = useCallback(async (id: number) => {
    const { error: deleteError } = await supabase.from('latas').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    await reload()
  }, [reload])

  return { latas, loading, error, reload, addLata, addLatas, updateLata, updatePrecio, deleteLata }
}
