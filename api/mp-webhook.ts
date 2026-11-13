// Mercado Pago llama a esta dirección cada vez que cambia un pago.
// Nunca confiamos en lo que viene en la notificación: buscamos el pago en la API de Mercado Pago con nuestro token.
import { firmaValida, json, mp, registrarPago } from './_lib.js'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } }
  const tipo = body.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic')
  const id = String(url.searchParams.get('data.id') ?? body.data?.id ?? url.searchParams.get('id') ?? '')

  if (tipo !== 'payment' || !id) return json({ ok: true, ignorado: tipo })
  if (!firmaValida(req, id)) return json({ error: 'firma inválida' }, 401)

  try {
    const pago = await mp(`/v1/payments/${encodeURIComponent(id)}`)
    if (pago.status !== 'approved') return json({ ok: true, estado: pago.status })
    const resultado = await registrarPago(pago)
    return json({ ok: true, resultado })
  } catch (e) {
    console.error('mp-webhook', e)
    // 500 hace que Mercado Pago reintente la notificación más tarde.
    return json({ error: (e as Error).message }, 500)
  }
}

export const GET = () => json({ ok: true })
