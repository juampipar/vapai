// Página pública → "Reservar y pagar seña". Crea (o reutiliza) al cliente y devuelve el link de Mercado Pago.
// El monto lo calcula el servidor con los datos guardados: nadie puede cambiarlo desde el navegador.
import type { Experiencia, Lead } from '../src/lib/types'
import { esConfirmado } from '../src/lib/precio.js'
import { ajustes, crearLinkDePago, escribir, hoyAR, json, leadsDe, leer } from './_lib.js'

const limpiar = (s: unknown, max: number) => String(s ?? '').trim().slice(0, max)
const digitos = (s: string) => s.replace(/\D/g, '')

export async function POST(req: Request) {
  try {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const nombre = limpiar(b.nombre, 120)
    const whatsapp = limpiar(b.whatsapp, 40)
    const email = limpiar(b.email, 120)
    const experienciaId = limpiar(b.experienciaId, 80)
    if (!nombre || digitos(whatsapp).length < 8 || !experienciaId) return json({ error: 'Completá nombre y WhatsApp' }, 400)

    const [exp, aj] = await Promise.all([leer<Experiencia>('experiencias', experienciaId), ajustes()])
    if (!aj.mpActivo) return json({ error: 'El pago online no está activado' }, 400)
    if (!exp || !exp.publica || exp.estado !== 'Abierta') return json({ error: 'Esta experiencia no está disponible para reservar' }, 400)

    const leads = await leadsDe(exp.id)
    if (leads.filter(esConfirmado).length >= exp.cupoMax) return json({ error: 'No quedan lugares. Escribinos por WhatsApp para la lista de espera.' }, 409)

    // Si la misma persona ya había consultado o empezado a pagar, reutilizamos su ficha.
    let lead = leads.find((l) => digitos(l.whatsapp).endsWith(digitos(whatsapp).slice(-8)) && l.estado !== 'Canceló')
    if (lead && esConfirmado(lead)) return json({ error: 'Ya tenés tu lugar reservado 🙌. Si querés pagar el saldo, escribinos por WhatsApp.' }, 409)
    if (!lead) {
      lead = {
        id: crypto.randomUUID(), creado: hoyAR(), nombre, whatsapp, instagram: '', email, experienciaId, origen: 'Página web',
        estado: 'Interesado', precio: null, pagos: [], aceptaFotos: true, proximoContacto: '', notas: '',
      } satisfies Lead
    }
    lead = {
      ...lead,
      nombre,
      email: email || lead.email,
      estado: 'Interesado',
      // si no termina de pagar, aparece mañana en "Para escribir hoy"
      proximoContacto: new Date(Date.now() + 86400000).toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }),
      notas: lead.notas.includes('Empezó a pagar') ? lead.notas : `${lead.notas ? lead.notas + ' · ' : ''}Empezó a pagar la seña por la web`,
    }
    await escribir('leads', lead)

    const link = await crearLinkDePago(req, lead, exp, aj)
    return json(link)
  } catch (e) {
    console.error('reservar', e)
    return json({ error: 'No se pudo iniciar el pago. Probá de nuevo o escribinos por WhatsApp.' }, 500)
  }
}
