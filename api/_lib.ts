// Código compartido por las funciones del servidor (Vercel). Los archivos que empiezan con "_" no son rutas.
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Ajustes, Experiencia, Lead } from '../src/lib/types'
import { cobrado, esConfirmado, montoACobrar, precioLead } from '../src/lib/precio.js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const MP_TOKEN = process.env.MP_ACCESS_TOKEN ?? ''
const MP_SECRET = process.env.MP_WEBHOOK_SECRET ?? ''
const MP_API = 'https://api.mercadopago.com'

export const configurado = () => ({ supabase: !!(SUPABASE_URL && SERVICE_KEY), mercadopago: !!MP_TOKEN, firma: !!MP_SECRET })

let _db: SupabaseClient | null = null
export function db() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el servidor')
  _db ??= createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  return _db
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

export const hoyAR = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })

/* ------------ Base de datos ------------ */
export async function leer<T>(tabla: 'experiencias' | 'leads' | 'ajustes', id: string): Promise<T | null> {
  const { data, error } = await db().from(tabla).select('data').eq('id', id).maybeSingle()
  if (error) throw error
  return (data?.data as T) ?? null
}
export async function escribir<T extends { id: string }>(tabla: 'experiencias' | 'leads', fila: T) {
  const { error } = await db().from(tabla).upsert({ id: fila.id, data: fila, updated_at: new Date().toISOString() })
  if (error) throw error
}
export async function leadsDe(experienciaId: string): Promise<Lead[]> {
  const { data, error } = await db().from('leads').select('data').eq('data->>experienciaId', experienciaId)
  if (error) throw error
  return (data ?? []).map((r) => r.data as Lead)
}
export const ajustes = async () => ({ comision: 0, marca: '', ...(await leer<Ajustes>('ajustes', 'ajustes')) }) as Ajustes

/** Verifica que quien llama sea el dueño logueado en el panel (token de Supabase). */
export async function usuario(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await db().auth.getUser(token)
  return error ? null : data.user
}

/* ------------ Mercado Pago ------------ */
export async function mp<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  if (!MP_TOKEN) throw new Error('Falta MP_ACCESS_TOKEN en el servidor')
  const r = await fetch(MP_API + path, {
    ...init,
    headers: { authorization: `Bearer ${MP_TOKEN}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${body?.message ?? JSON.stringify(body)}`)
  return body as T
}

export const baseUrl = (req: Request) => (process.env.PUBLIC_URL ?? new URL(req.url).origin).replace(/\/$/, '')

/** Crea un link de pago (Checkout Pro) por lo que corresponda cobrarle ahora a ese cliente. */
export async function crearLinkDePago(req: Request, lead: Lead, exp: Experiencia, aj: Ajustes) {
  const { monto, concepto } = montoACobrar(lead, exp, aj.comision)
  if (monto <= 0) throw new Error('Este cliente no tiene nada pendiente de pago')
  const base = baseUrl(req)
  const pref = await mp<{ id: string; init_point: string }>('/checkout/preferences', {
    method: 'POST',
    headers: { 'x-idempotency-key': randomUUID() },
    body: JSON.stringify({
      items: [{ id: exp.id, title: `${exp.nombre} – ${concepto}`, description: `${aj.marca} · ${exp.fecha}`, quantity: 1, unit_price: monto, currency_id: 'ARS' }],
      payer: { name: lead.nombre, ...(lead.email ? { email: lead.email } : {}) },
      external_reference: lead.id,
      metadata: { lead_id: lead.id, experiencia_id: exp.id, concepto },
      notification_url: `${base}/api/mp-webhook`,
      back_urls: { success: `${base}/p?pago=ok`, pending: `${base}/p?pago=pendiente`, failure: `${base}/p?pago=error` },
      auto_return: 'approved',
    }),
  })
  return { url: pref.init_point, monto, concepto }
}

/** Valida la firma "x-signature" de las notificaciones (si se configuró MP_WEBHOOK_SECRET). */
export function firmaValida(req: Request, dataId: string) {
  if (!MP_SECRET) return true
  const sig = req.headers.get('x-signature') ?? ''
  const requestId = req.headers.get('x-request-id') ?? ''
  const partes = Object.fromEntries(sig.split(',').map((p) => p.trim().split('=') as [string, string]))
  if (!partes.ts || !partes.v1) return false
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${partes.ts};`
  const esperado = createHmac('sha256', MP_SECRET).update(manifest).digest('hex')
  const a = Buffer.from(esperado), b = Buffer.from(partes.v1)
  return a.length === b.length && timingSafeEqual(a, b)
}

type PagoMP = {
  id: number
  status: string
  transaction_amount: number
  date_approved?: string
  external_reference?: string
  metadata?: { concepto?: string; lead_id?: string }
}

/** Registra un pago aprobado en la ficha del cliente y actualiza su estado. Es idempotente. */
export async function registrarPago(pago: PagoMP) {
  const leadId = pago.external_reference || pago.metadata?.lead_id
  if (!leadId) return 'sin referencia'
  const lead = await leer<Lead>('leads', leadId)
  if (!lead) return 'cliente no encontrado'
  const pid = `mp-${pago.id}`
  if (lead.pagos.some((p) => p.id === pid)) return 'ya registrado'

  const concepto = (pago.metadata?.concepto as Lead['pagos'][number]['concepto']) ?? (lead.pagos.length ? 'Saldo' : 'Seña')
  lead.pagos.push({ id: pid, fecha: pago.date_approved?.slice(0, 10) ?? hoyAR(), monto: pago.transaction_amount, concepto, medio: 'Mercado Pago' })

  const [exp, aj] = await Promise.all([leer<Experiencia>('experiencias', lead.experienciaId), ajustes()])
  const total = precioLead(lead, exp ?? undefined, aj.comision)
  if (total > 0 && cobrado(lead) >= total) lead.estado = lead.estado === 'Asistió' ? 'Asistió' : 'Pagó todo'
  else if (!esConfirmado(lead)) lead.estado = 'Señó'
  if (esConfirmado(lead)) lead.proximoContacto = ''
  await escribir('leads', lead)

  // Si con este pago se llenó el cupo, marcar la experiencia como "Llena".
  if (exp && exp.estado === 'Abierta') {
    const confirmados = (await leadsDe(exp.id)).filter(esConfirmado).length
    if (confirmados >= exp.cupoMax) await escribir('experiencias', { ...exp, estado: 'Llena' })
  }
  return `registrado: ${lead.estado}`
}
