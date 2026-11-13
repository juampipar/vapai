// Panel → Ajustes → "Probar conexión": revisa que el servidor tenga todo configurado.
import { configurado, json, mp, usuario } from './_lib.js'

export async function GET(req: Request) {
  const c = configurado()
  if (!c.supabase) return json({ ok: false, error: 'Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en Vercel', ...c })
  if (!(await usuario(req))) return json({ error: 'No autorizado' }, 401)
  if (!c.mercadopago) return json({ ok: false, error: 'Falta MP_ACCESS_TOKEN en Vercel', ...c })
  try {
    const yo = await mp<{ nickname?: string; email?: string }>('/users/me')
    return json({ ok: true, cuenta: yo.nickname ?? yo.email ?? '', ...c })
  } catch (e) {
    return json({ ok: false, error: (e as Error).message, ...c })
  }
}
