// Cálculos puros, sin dependencias en tiempo de ejecución: los usan tanto la app como las funciones del servidor (/api).
import type { Experiencia, Lead } from './types'

export const CONFIRMADOS = ['Señó', 'Pagó todo', 'Asistió']

export const suma = (xs: { monto: number }[]) => xs.reduce((a, x) => a + (Number(x.monto) || 0), 0)

export function precioExperiencia(e: Experiencia, comision: number) {
  const fijos = suma(e.costosFijos)
  const variable = suma(e.costosVariables)
  const min = Math.max(1, e.cupoMin || 1)
  const divisor = 1 - e.margen - comision
  const bruto = divisor > 0 ? (fijos / min + variable) / divisor : 0
  const r = e.redondeo > 0 ? e.redondeo : 1
  const sugerido = Math.ceil(bruto / r) * r
  const precio = e.precio ?? sugerido
  const neto = precio * (1 - comision) - variable
  const equilibrio = neto > 0 ? Math.ceil(fijos / neto) : null
  const sena = Math.round((precio * e.senaPct) / 100 / 100) * 100
  return { fijos, variable, sugerido, precio, neto, equilibrio, sena, saldo: precio - sena }
}

export const cobrado = (l: Lead) => suma(l.pagos)
export const precioLead = (l: Lead, e: Experiencia | undefined, comision: number) =>
  l.precio ?? (e ? precioExperiencia(e, comision).precio : 0)
export const esConfirmado = (l: Lead) => CONFIRMADOS.includes(l.estado)

/** Cuánto cobrar ahora: la seña si todavía no pagó nada, si no lo que falta. */
export function montoACobrar(l: Lead, e: Experiencia, comision: number) {
  const total = precioLead(l, e, comision)
  const pagado = cobrado(l)
  if (pagado <= 0) {
    const sena = l.precio == null ? precioExperiencia(e, comision).sena : Math.round((total * e.senaPct) / 100 / 100) * 100
    return { monto: sena, concepto: 'Seña' as const }
  }
  return { monto: Math.max(0, total - pagado), concepto: 'Saldo' as const }
}
