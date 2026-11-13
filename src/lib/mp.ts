import { modo, supabase } from './backend'
import type { Ajustes } from './types'

/** El cobro automático solo funciona con la app online (Supabase + funciones del servidor en Vercel). */
export const mpDisponible = (aj: Pick<Ajustes, 'mpActivo'>) => modo === 'nube' && !!aj.mpActivo

async function llamar<T>(path: string, init: RequestInit = {}, conLogin = false): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (conLogin && supabase) {
    const { data } = await supabase.auth.getSession()
    if (data.session) headers.authorization = `Bearer ${data.session.access_token}`
  }
  const r = await fetch(path, { ...init, headers })
  const body = await r.json().catch(() => ({ error: `Error ${r.status}: el servidor no respondió (¿la app está publicada en Vercel?)` }))
  if (!r.ok || body.error) throw new Error(body.error ?? `Error ${r.status}`)
  return body as T
}

export const crearLinkPago = (leadId: string) =>
  llamar<{ url: string; monto: number; concepto: string }>('/api/link-pago', { method: 'POST', body: JSON.stringify({ leadId }) }, true)

export const reservarOnline = (d: { nombre: string; whatsapp: string; email: string; experienciaId: string }) =>
  llamar<{ url: string }>('/api/reservar', { method: 'POST', body: JSON.stringify(d) })

export const estadoMP = () =>
  llamar<{ ok: boolean; cuenta?: string; error?: string; firma?: boolean }>('/api/mp-estado', {}, true).catch((e) => ({ ok: false, error: (e as Error).message, firma: false }))
