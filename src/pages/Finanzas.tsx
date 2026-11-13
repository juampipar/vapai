import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../lib/store'
import { resumenExperiencia } from '../lib/calc'
import { fechaCorta, hoy, money, pct } from '../lib/format'
import { Card, Empty, PageHeader, Select, Stat, cx } from '../components/ui'

export default function Finanzas() {
  const { datos } = useDatos()
  const anios = [...new Set([hoy().slice(0, 4), ...datos.experiencias.map((e) => e.fecha.slice(0, 4))])].sort().reverse()
  const [anio, setAnio] = useState(hoy().slice(0, 4))
  const exps = datos.experiencias.filter((e) => e.fecha.startsWith(anio) && e.estado !== 'Cancelada').sort((a, b) => a.fecha.localeCompare(b.fecha))
  const filas = exps.map((e) => ({ e, r: resumenExperiencia(e, datos.leads, datos.gastos, datos.ajustes) }))
  const tot = filas.reduce(
    (a, { r }) => ({ ingresos: a.ingresos + r.ingresos, cobrado: a.cobrado + r.cobrado, pendiente: a.pendiente + r.pendiente, ganancia: a.ganancia + r.ganancia, personas: a.personas + r.confirmados }),
    { ingresos: 0, cobrado: 0, pendiente: 0, ganancia: 0, personas: 0 },
  )
  const pagos = datos.leads
    .flatMap((l) => l.pagos.map((p) => ({ ...p, lead: l })))
    .filter((p) => p.fecha.startsWith(anio))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const porPagar = datos.gastos.filter((g) => !g.pagado)

  const meses = Array.from({ length: 12 }, (_, i) => {
    const m = `${anio}-${String(i + 1).padStart(2, '0')}`
    return { m, total: pagos.filter((p) => p.fecha.startsWith(m)).reduce((a, p) => a + p.monto, 0) }
  })
  const maxMes = Math.max(1, ...meses.map((x) => x.total))

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Finanzas" subtitle="Cuánto entra, cuánto sale y cuánto queda" action={
        <Select value={anio} onChange={(e) => setAnio(e.target.value)} className="w-28">{anios.map((a) => <option key={a}>{a}</option>)}</Select>
      } />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ventas del año" value={money(tot.ingresos)} hint={`${tot.personas} personas`} />
        <Stat label="Cobrado" value={money(tot.cobrado)} tone="good" />
        <Stat label="Falta cobrar" value={money(tot.pendiente)} tone={tot.pendiente ? 'warn' : undefined} />
        <Stat label="Ganancia" value={money(tot.ganancia)} hint={tot.ingresos ? `Margen ${pct(tot.ganancia / tot.ingresos)}` : undefined} tone={tot.ganancia < 0 ? 'bad' : 'good'} />
      </div>

      <Card title="Cobros por mes" className="mb-5">
        <div className="flex h-40 items-end gap-1.5">
          {meses.map(({ m, total }) => (
            <div key={m} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${m}: ${money(total)}`}>
              <div className="w-full rounded-t-md bg-teal-600" style={{ height: `${(total / maxMes) * 100}%`, minHeight: total ? 4 : 0 }} />
              <span className="text-[10px] text-stone-500">{new Date(m + '-15').toLocaleDateString('es-AR', { month: 'short' })}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Resultado por experiencia" className="mb-5">
        {filas.length === 0 ? <Empty>No hay experiencias en {anio}.</Empty> : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[640px] text-sm tabular-nums">
              <thead className="text-left text-stone-500">
                <tr><th className="p-2">Experiencia</th><th className="p-2">Pers.</th><th className="p-2 text-right">Ventas</th><th className="p-2 text-right">Cobrado</th><th className="p-2 text-right">Costos</th><th className="p-2 text-right">Ganancia</th></tr>
              </thead>
              <tbody>
                {filas.map(({ e, r }) => (
                  <tr key={e.id} className="border-t border-stone-100">
                    <td className="p-2"><Link to={`/experiencias/${e.id}`} className="font-medium text-teal-800 hover:underline">{e.nombre}</Link><div className="text-xs text-stone-500">{fechaCorta(e.fecha)} · {e.estado}</div></td>
                    <td className="p-2">{r.confirmados}</td>
                    <td className="p-2 text-right">{money(r.ingresos)}</td>
                    <td className="p-2 text-right">{money(r.cobrado)}</td>
                    <td className="p-2 text-right">{money(r.usaCostoReal ? r.costoReal : r.costoEstimado)}{!r.usaCostoReal && <span className="text-xs text-stone-400"> est.</span>}</td>
                    <td className={cx('p-2 text-right font-semibold', r.ganancia < 0 ? 'text-red-600' : 'text-emerald-700')}>{money(r.ganancia)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-stone-500">La ganancia descuenta la comisión de cobro ({pct(datos.ajustes.comision)}). “est.” = todavía no cargaste los gastos reales.</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Últimos cobros">
          {pagos.length === 0 ? <Empty>Sin cobros.</Empty> : (
            <ul className="divide-y divide-stone-100 text-sm">
              {pagos.slice(0, 15).map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span>{fechaCorta(p.fecha)} · {p.lead.nombre} <span className="text-stone-500">({p.concepto}, {p.medio})</span></span>
                  <b className="tabular-nums">{money(p.monto)}</b>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Falta pagar a proveedores">
          {porPagar.length === 0 ? <Empty>Todo pagado.</Empty> : (
            <ul className="divide-y divide-stone-100 text-sm">
              {porPagar.map((g) => (
                <li key={g.id} className="flex justify-between py-2">
                  <span>{g.concepto} <span className="text-stone-500">({datos.experiencias.find((e) => e.id === g.experienciaId)?.nombre})</span></span>
                  <b className="tabular-nums text-amber-700">{money(g.monto)}</b>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
