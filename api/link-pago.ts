// Panel → "Crear link de Mercado Pago" para un cliente (seña o saldo). Solo para el usuario logueado.
import type { Experiencia, Lead } from '../src/lib/types'
import { ajustes, crearLinkDePago, json, leer, usuario } from './_lib.js'

export async function POST(req: Request) {
  try {
    if (!(await usuario(req))) return json({ error: 'No autorizado' }, 401)
    const { leadId } = (await req.json().catch(() => ({}))) as { leadId?: string }
    const lead = leadId ? await leer<Lead>('leads', leadId) : null
    if (!lead) return json({ error: 'Guardá el cliente antes de crear el link' }, 404)
    const exp = await leer<Experiencia>('experiencias', lead.experienciaId)
    if (!exp) return json({ error: 'El cliente no tiene una experiencia asignada' }, 400)
    return json(await crearLinkDePago(req, lead, exp, await ajustes()))
  } catch (e) {
    console.error('link-pago', e)
    return json({ error: (e as Error).message }, 500)
  }
}
