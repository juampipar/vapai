import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Ajustes, Datos, Experiencia, Gasto, Lead, Tabla } from './types'
import { borrarFila, cargar, guardarFila, reemplazarTodo } from './backend'

type TipoFila = { experiencias: Experiencia; leads: Lead; gastos: Gasto }

type Ctx = {
  datos: Datos
  guardar: <T extends Tabla>(tabla: T, fila: TipoFila[T]) => void
  borrar: (tabla: Tabla, id: string) => void
  guardarAjustes: (a: Ajustes) => void
  importar: (d: Datos) => Promise<void>
  error: string | null
}

const C = createContext<Ctx | null>(null)

export function DatosProvider({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<Datos | null>(null)
  ref.current = datos

  useEffect(() => {
    cargar().then(setDatos).catch((e) => setError(String(e.message ?? e)))
  }, [])

  const fallo = (e: unknown) => setError('No se pudo guardar: ' + String((e as Error).message ?? e))

  const guardar = useCallback(<T extends Tabla>(tabla: T, fila: TipoFila[T]) => {
    const prev = ref.current!
    const lista = prev[tabla] as { id: string }[]
    const existe = lista.some((x) => x.id === fila.id)
    const nueva = existe ? lista.map((x) => (x.id === fila.id ? fila : x)) : [...lista, fila]
    const next = { ...prev, [tabla]: nueva } as Datos
    ref.current = next
    setDatos(next)
    guardarFila(tabla, fila, next).catch(fallo)
  }, [])

  const borrar = useCallback((tabla: Tabla, id: string) => {
    const prev = ref.current!
    const next = { ...prev, [tabla]: (prev[tabla] as { id: string }[]).filter((x) => x.id !== id) } as Datos
    ref.current = next
    setDatos(next)
    borrarFila(tabla, id, next).catch(fallo)
  }, [])

  const guardarAjustes = useCallback((a: Ajustes) => {
    const next = { ...ref.current!, ajustes: a }
    ref.current = next
    setDatos(next)
    guardarFila('ajustes', a, next).catch(fallo)
  }, [])

  const importar = useCallback(async (d: Datos) => {
    await reemplazarTodo(d)
    setDatos(d)
  }, [])

  if (!datos)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center text-stone-500">
        {error ? <p className="max-w-md text-red-600">Error cargando datos: {error}</p> : 'Cargando…'}
      </div>
    )

  return <C.Provider value={{ datos, guardar, borrar, guardarAjustes, importar, error }}>{children}</C.Provider>
}

export function useDatos() {
  const c = useContext(C)
  if (!c) throw new Error('useDatos fuera de DatosProvider')
  return c
}
