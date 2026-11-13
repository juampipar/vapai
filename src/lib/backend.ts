import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Ajustes, Datos, Experiencia, Lead, Tabla } from './types'
import { ajustesDefault, datosDemo } from './seed'
import { hoy, uid } from './format'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = URL && KEY ? createClient(URL, KEY) : null
export const modo: 'nube' | 'local' = supabase ? 'nube' : 'local'

export type Publico = {
  ajustes: Pick<Ajustes, 'marca' | 'lema' | 'whatsapp' | 'instagram' | 'reglas' | 'senaPct' | 'diasSaldo' | 'comision' | 'descuentoAmigo' | 'mpActivo'>
  experiencias: (Experiencia & { confirmados: number })[]
}

/* ---------------- Modo local (navegador) ---------------- */
const LS = 'vapai-datos-v1'
function leerLocal(): Datos {
  try {
    const raw = localStorage.getItem(LS)
    if (raw) {
      const d = JSON.parse(raw) as Datos
      d.ajustes = { ...ajustesDefault(), ...d.ajustes }
      return d
    }
  } catch {
    /* sin acceso a storage */
  }
  const d = datosDemo()
  escribirLocal(d)
  return d
}
function escribirLocal(d: Datos) {
  try {
    localStorage.setItem(LS, JSON.stringify(d))
  } catch {
    /* sin acceso a storage */
  }
}

/* ---------------- API común ---------------- */
export async function cargar(): Promise<Datos> {
  if (!supabase) return leerLocal()
  const [e, l, g, a] = await Promise.all([
    supabase.from('experiencias').select('data'),
    supabase.from('leads').select('data'),
    supabase.from('gastos').select('data'),
    supabase.from('ajustes').select('data').eq('id', 'ajustes').maybeSingle(),
  ])
  const err = e.error || l.error || g.error || a.error
  if (err) throw err
  return {
    experiencias: (e.data ?? []).map((r) => r.data),
    leads: (l.data ?? []).map((r) => r.data),
    gastos: (g.data ?? []).map((r) => r.data),
    ajustes: { ...ajustesDefault(), ...(a.data?.data ?? {}) },
  }
}

export async function guardarFila(tabla: Tabla | 'ajustes', fila: { id: string }, todo: Datos) {
  if (!supabase) return escribirLocal(todo)
  const { error } = await supabase.from(tabla).upsert({ id: fila.id, data: fila, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function borrarFila(tabla: Tabla, id: string, todo: Datos) {
  if (!supabase) return escribirLocal(todo)
  const { error } = await supabase.from(tabla).delete().eq('id', id)
  if (error) throw error
}

export async function reemplazarTodo(d: Datos) {
  if (!supabase) return escribirLocal(d)
  for (const t of ['experiencias', 'leads', 'gastos'] as const) {
    const { error: e1 } = await supabase.from(t).delete().neq('id', '')
    if (e1) throw e1
    const filas = (d[t] as { id: string }[]).map((x) => ({ id: x.id, data: x }))
    if (filas.length) {
      const { error } = await supabase.from(t).insert(filas)
      if (error) throw error
    }
  }
  await guardarFila('ajustes', d.ajustes, d)
}

/* ---------------- Página pública ---------------- */
export async function cargarPublico(): Promise<Publico> {
  if (!supabase) {
    const d = leerLocal()
    return {
      ajustes: d.ajustes,
      experiencias: d.experiencias
        .filter((e) => e.publica && (e.estado === 'Abierta' || e.estado === 'Llena'))
        .map((e) => ({
          ...e,
          confirmados: d.leads.filter((l) => l.experienciaId === e.id && ['Señó', 'Pagó todo', 'Asistió'].includes(l.estado)).length,
        })),
    }
  }
  const { data, error } = await supabase.rpc('catalogo_publico')
  if (error) throw error
  return data as Publico
}

export async function crearConsultaPublica(c: { nombre: string; whatsapp: string; email: string; experienciaId: string; notas: string }) {
  if (!supabase) {
    const d = leerLocal()
    const lead: Lead = {
      id: uid(), creado: hoy(), nombre: c.nombre, whatsapp: c.whatsapp, instagram: '', email: c.email,
      experienciaId: c.experienciaId, origen: 'Página web', estado: 'Consultó', precio: null, pagos: [],
      aceptaFotos: true, proximoContacto: hoy(), notas: c.notas,
    }
    d.leads.push(lead)
    escribirLocal(d)
    return
  }
  const { error } = await supabase.rpc('crear_consulta', {
    p_nombre: c.nombre, p_whatsapp: c.whatsapp, p_email: c.email, p_experiencia: c.experienciaId, p_notas: c.notas,
  })
  if (error) throw error
}
