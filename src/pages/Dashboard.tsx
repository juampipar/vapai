import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MessageCircle, Plus } from 'lucide-react'
import { useDatos } from '../lib/store'
import { resumenExperiencia, esConfirmado } from '../lib/calc'
import { diasHasta, fechaCorta, fechaLarga, hoy, money, pct } from '../lib/format'
import { ESTADOS_ABIERTOS, ESTADOS_LEAD, type Lead } from '../lib/types'
import { mpDisponible } from '../lib/mp'
import { Badge, Button, Card, CupoBar, Empty, PageHeader, Stat } from '../components/ui'
import { LeadModal, WhatsAppModal, faltaDe, nuevoLead } from '../components/Leads'

export default function Dashboard() {
  const { datos } = useDatos()
  const aj = datos.ajustes
  const [leadAbierto, setLeadAbierto] = useState<Lead | null>(null)
  const [waLead, setWaLead] = useState<Lead | null>(null)

  const proximas = datos.experiencias
    .filter((e) => diasHasta(e.fecha) >= 0 && e.estado !== 'Cancelada' && e.estado !== 'Realizada')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const resumenes = proximas.map((e) => ({ e, r: resumenExperiencia(e, datos.leads, datos.gastos, aj) }))

  const mes = hoy().slice(0, 7)
  const cobradoMes = datos.leads.flatMap((l) => l.pagos).filter((p) => p.fecha.startsWith(mes)).reduce((a, p) => a + p.monto, 0)
  const porCobrar = resumenes.reduce((a, x) => a + x.r.pendiente, 0)
  const gananciaProx = resumenes.filter((x) => x.r.confirmados > 0).reduce((a, x) => a + x.r.ganancia, 0)
  const confirmadosProx = resumenes.reduce((a, x) => a + x.r.confirmados, 0)

  const paraHoy = datos.leads
    .filter((l) => l.proximoContacto && l.proximoContacto <= hoy() && ESTADOS_ABIERTOS.includes(l.estado))
    .sort((a, b) => a.proximoContacto.localeCompare(b.proximoContacto))
  const sinSeguimiento = datos.leads.filter((l) => !l.proximoContacto && (l.estado === 'Consultó' || l.estado === 'Interesado'))

  const saldos = datos.leads
    .filter((l) => esConfirmado(l) && faltaDe(l, datos) > 0)
    .map((l) => ({ l, e: datos.experiencias.find((e) => e.id === l.experienciaId) }))
    .filter((x) => x.e && diasHasta(x.e.fecha) >= 0 && diasHasta(x.e.fecha) <= aj.diasSaldo + 7)

  const alertas: string[] = []
  for (const { e, r } of resumenes) {
    const d = diasHasta(e.fecha)
    if (r.faltanMin > 0 && d <= 14) alertas.push(`A “${e.nombre}” le faltan ${r.faltanMin} personas para el mínimo y es en ${d} días.`)
    const pend = e.checklist.filter((c) => !c.hecho && c.etapa !== 'Después' && c.etapa !== 'El día').length
    if (d <= 7 && pend > 0) alertas.push(`“${e.nombre}”: quedan ${pend} tareas del checklist antes del día.`)
    if (e.estado === 'Abierta' && !e.linkPago && !mpDisponible(aj)) alertas.push(`“${e.nombre}” no tiene link de pago cargado.`)
  }
  if (!aj.whatsapp) alertas.push('Cargá el WhatsApp del negocio en Ajustes para que funcione la página pública.')

  const embudo = ESTADOS_LEAD.map((s) => ({ s, n: datos.leads.filter((l) => l.estado === s).length }))
  const maxEmb = Math.max(1, ...embudo.map((x) => x.n))
  const totalLeads = datos.leads.length
  const convertidos = datos.leads.filter(esConfirmado).length

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`¡Hola! 👋`}
        subtitle={fechaLarga(hoy())}
        action={<Button onClick={() => setLeadAbierto(nuevoLead(proximas[0]?.id))}><Plus size={18} /> Nuevo cliente</Button>}
      />

      {alertas.length > 0 && (
        <div className="mb-5 space-y-1.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          {alertas.map((a) => (
            <div key={a} className="flex items-start gap-2 text-sm text-amber-900">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {a}
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Cobrado este mes" value={money(cobradoMes)} tone="good" />
        <Stat label="Falta cobrar" value={money(porCobrar)} hint="De las próximas fechas" tone={porCobrar > 0 ? 'warn' : undefined} />
        <Stat label="Ganancia estimada" value={money(gananciaProx)} hint="Si las próximas fechas salieran con los confirmados de hoy" tone={gananciaProx < 0 ? 'bad' : undefined} />
        <Stat label="Confirmados" value={confirmadosProx} hint={`Conversión total: ${pct(totalLeads ? convertidos / totalLeads : 0)}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <Card title="Próximas experiencias" action={<Link to="/experiencias" className="text-sm text-teal-700">Ver todas</Link>}>
            {resumenes.length === 0 && <Empty>No hay fechas próximas. <Link to="/experiencias" className="text-teal-700 underline">Creá una</Link>.</Empty>}
            <div className="space-y-4">
              {resumenes.map(({ e, r }) => (
                <Link key={e.id} to={`/experiencias/${e.id}`} className="block rounded-xl border border-stone-200 p-3 hover:border-teal-300 hover:bg-teal-50/30">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{e.nombre}</div>
                      <div className="text-sm text-stone-500">{fechaLarga(e.fecha)} · faltan {diasHasta(e.fecha)} días</div>
                    </div>
                    <Badge>{e.estado}</Badge>
                  </div>
                  <CupoBar confirmados={r.confirmados} min={e.cupoMin} max={e.cupoMax} />
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-stone-600">
                    <span>Cobrado: <b>{money(r.cobrado)}</b></span>
                    <span>Falta: <b>{money(r.pendiente)}</b></span>
                    <span>{r.confirmados ? 'Ganancia hoy' : 'Si sale con el mínimo'}: <b className={(r.confirmados ? r.ganancia : e.cupoMin * r.neto - r.fijos) < 0 ? 'text-red-600' : 'text-emerald-700'}>{money(r.confirmados ? r.ganancia : e.cupoMin * r.neto - r.fijos)}</b></span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card title={`Para escribir hoy (${paraHoy.length})`}>
            {paraHoy.length === 0 ? (
              <Empty>Nadie pendiente para hoy 🎉</Empty>
            ) : (
              <ul className="divide-y divide-stone-100">
                {paraHoy.map((l) => {
                  const e = datos.experiencias.find((x) => x.id === l.experienciaId)
                  return (
                    <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                      <button className="min-w-0 text-left" onClick={() => setLeadAbierto(l)}>
                        <div className="truncate font-medium">{l.nombre}</div>
                        <div className="truncate text-xs text-stone-500">
                          {e?.nombre ?? 'Sin experiencia'} · {l.proximoContacto < hoy() ? `atrasado desde ${fechaCorta(l.proximoContacto)}` : 'hoy'}
                          {l.notas && ` · ${l.notas}`}
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge>{l.estado}</Badge>
                        <Button size="sm" variant="whatsapp" onClick={() => setWaLead(l)} aria-label="WhatsApp"><MessageCircle size={16} /></Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {sinSeguimiento.length > 0 && (
              <p className="mt-3 text-xs text-amber-700">
                Hay {sinSeguimiento.length} consultas sin fecha de seguimiento. <Link to="/clientes" className="underline">Revisalas</Link> para que no se pierdan.
              </p>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card title="Saldos por cobrar">
            {saldos.length === 0 ? (
              <Empty>Sin saldos pendientes cerca de la fecha.</Empty>
            ) : (
              <ul className="divide-y divide-stone-100 text-sm">
                {saldos.map(({ l, e }) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                    <button className="min-w-0 text-left" onClick={() => setLeadAbierto(l)}>
                      <div className="truncate font-medium">{l.nombre}</div>
                      <div className="truncate text-xs text-stone-500">{e!.nombre} · {fechaCorta(e!.fecha)}</div>
                    </button>
                    <div className="flex items-center gap-2">
                      <b className="tabular-nums text-amber-700">{money(faltaDe(l, datos))}</b>
                      <Button size="sm" variant="whatsapp" onClick={() => setWaLead(l)} aria-label="WhatsApp"><MessageCircle size={16} /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Embudo de ventas">
            <div className="space-y-2">
              {embudo.map(({ s, n }) => (
                <div key={s} className="text-sm">
                  <div className="mb-0.5 flex justify-between"><span>{s}</span><span className="tabular-nums text-stone-500">{n}</span></div>
                  <div className="h-2 rounded-full bg-stone-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${(n / maxEmb) * 100}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-500">De {totalLeads} personas que escribieron, {convertidos} reservaron ({pct(totalLeads ? convertidos / totalLeads : 0)}).</p>
          </Card>
        </div>
      </div>

      {leadAbierto && <LeadModal key={leadAbierto.id} lead={leadAbierto} open onClose={() => setLeadAbierto(null)} />}
      {waLead && <WhatsAppModal key={waLead.id} lead={waLead} open onClose={() => setWaLead(null)} />}
    </div>
  )
}
