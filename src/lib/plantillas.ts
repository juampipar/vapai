import type { Ajustes, Experiencia, Lead } from './types'
import { faltaCobrar, precioExperiencia, resumenExperiencia } from './calc'
import { fechaLarga, money, sumarDias } from './format'
import type { Datos } from './types'

export function rellenar(texto: string, datos: Datos, exp?: Experiencia, lead?: Lead, extra: Record<string, string> = {}) {
  const aj: Ajustes = datos.ajustes
  const v: Record<string, string> = {
    marca: aj.marca,
    instagram: aj.instagram,
    nombre: lead ? lead.nombre.replace(/^Ejemplo:\s*/, '').split(' ')[0] : '',
    dias_saldo: String(aj.diasSaldo),
    sena_pct: `${exp?.senaPct ?? aj.senaPct}%`,
    descuento: `${aj.descuentoAmigo}%`,
  }
  if (exp) {
    const p = precioExperiencia(exp, aj.comision)
    const r = resumenExperiencia(exp, datos.leads, datos.gastos, aj)
    Object.assign(v, {
      experiencia: exp.nombre,
      fecha: fechaLarga(exp.fecha),
      fecha_saldo: fechaLarga(sumarDias(exp.fecha, -aj.diasSaldo)),
      lugar: exp.lugar,
      horario: exp.horario,
      incluye: exp.incluye,
      llevar: exp.llevar,
      precio: money(p.precio),
      sena: money(p.sena),
      saldo: money(p.saldo),
      cupo_min: String(exp.cupoMin),
      cupo_max: String(exp.cupoMax),
      lugares: String(r.libres),
      link_pago: exp.linkPago || '[link de pago]',
      opcionales: exp.opcionales.length
        ? `*Opcional (aparte):* ${exp.opcionales.map((o) => `${o.nombre} ${money(o.precio)}`).join(', ')}\n`
        : '',
    })
    if (lead) v.falta = money(faltaCobrar(lead, exp, aj.comision) || p.saldo)
  }
  Object.assign(v, extra)
  v.reglas = aj.reglas.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m)
  return texto.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m)
}

export const VARIABLES = [
  'nombre', 'marca', 'experiencia', 'fecha', 'lugar', 'horario', 'incluye', 'llevar', 'precio', 'sena', 'saldo', 'falta',
  'fecha_saldo', 'lugares', 'cupo_min', 'cupo_max', 'link_pago', 'opcionales', 'instagram', 'reglas', 'descuento', 'dias_saldo',
]
