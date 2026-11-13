import type { Ajustes, Experiencia, Gasto, Lead } from './types'
import { ESTADOS_CONFIRMADOS } from './types'

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

export function escenarios(e: Experiencia, comision: number) {
  const { fijos, variable, precio } = precioExperiencia(e, comision)
  const desde = Math.max(1, Math.min(e.cupoMin, e.cupoMax) - 4)
  const hasta = Math.max(e.cupoMax, e.cupoMin) + 2
  const out = []
  for (let n = desde; n <= hasta; n++) {
    const ingresos = n * precio
    const com = ingresos * comision
    const vars = n * variable
    const ganancia = ingresos - com - fijos - vars
    out.push({ n, ingresos, com, fijos, vars, ganancia, margen: ingresos ? ganancia / ingresos : 0 })
  }
  return out
}

export const cobrado = (l: Lead) => suma(l.pagos)
export const precioLead = (l: Lead, e: Experiencia | undefined, comision: number) =>
  l.precio ?? (e ? precioExperiencia(e, comision).precio : 0)
export const esConfirmado = (l: Lead) => ESTADOS_CONFIRMADOS.includes(l.estado)
export const faltaCobrar = (l: Lead, e: Experiencia | undefined, comision: number) =>
  esConfirmado(l) ? Math.max(0, precioLead(l, e, comision) - cobrado(l)) : 0

export function resumenExperiencia(e: Experiencia, leads: Lead[], gastos: Gasto[], aj: Ajustes) {
  const p = precioExperiencia(e, aj.comision)
  const deEsta = leads.filter((l) => l.experienciaId === e.id)
  const confirmados = deEsta.filter(esConfirmado)
  const n = confirmados.length
  const ingresos = confirmados.reduce((a, l) => a + precioLead(l, e, aj.comision), 0)
  const cobradoTot = deEsta.reduce((a, l) => a + cobrado(l), 0)
  const pendiente = confirmados.reduce((a, l) => a + faltaCobrar(l, e, aj.comision), 0)
  const gastosExp = gastos.filter((g) => g.experienciaId === e.id)
  const costoEstimado = p.fijos + p.variable * n
  const costoReal = suma(gastosExp)
  const costo = gastosExp.length ? costoReal : costoEstimado
  const ganancia = ingresos * (1 - aj.comision) - costo
  return {
    ...p,
    consultas: deEsta.length,
    confirmados: n,
    faltanMin: Math.max(0, e.cupoMin - n),
    libres: Math.max(0, e.cupoMax - n),
    ingresos,
    cobrado: cobradoTot,
    pendiente,
    costoEstimado,
    costoReal,
    usaCostoReal: gastosExp.length > 0,
    ganancia,
  }
}
