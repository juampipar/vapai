import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, MessageCircle, Plus, Trash2 } from 'lucide-react'
import { useDatos } from '../lib/store'
import type { EstadoExperiencia, Experiencia, Gasto, Lead, Linea } from '../lib/types'
import { escenarios, precioExperiencia, resumenExperiencia, cobrado, precioLead } from '../lib/calc'
import { fechaLarga, hoy, money, pct, uid } from '../lib/format'
import { rellenar } from '../lib/plantillas'
import { Badge, Button, Card, CupoBar, Empty, Field, Input, NumInput, Select, Stat, Textarea, cx } from '../components/ui'
import { LeadModal, WhatsAppModal, faltaDe, nuevoLead } from '../components/Leads'

const TABS = ['Ficha', 'Costos y precio', 'Participantes', 'Checklist', 'Resultado'] as const

export default function ExperienciaDetalle() {
  const { id } = useParams()
  const { datos } = useDatos()
  const e = datos.experiencias.find((x) => x.id === id)
  if (!e) return <Empty>No se encontró la experiencia. <Link to="/experiencias" className="underline">Volver</Link></Empty>
  return <Editor key={e.id} inicial={e} />
}

function Editor({ inicial }: { inicial: Experiencia }) {
  const { datos, guardar, borrar } = useDatos()
  const nav = useNavigate()
  const [e, setE] = useState(inicial)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Ficha')
  const primera = useRef(true)
  useEffect(() => {
    if (primera.current) { primera.current = false; return }
    const t = setTimeout(() => guardar('experiencias', e), 500)
    return () => clearTimeout(t)
  }, [e, guardar])
  const set = <K extends keyof Experiencia>(k: K, v: Experiencia[K]) => setE((x) => ({ ...x, [k]: v }))
  const r = resumenExperiencia(e, datos.leads, datos.gastos, datos.ajustes)

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/experiencias" className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"><ArrowLeft size={16} /> Experiencias</Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input value={e.nombre} onChange={(x) => set('nombre', x.target.value)} className="w-full bg-transparent text-2xl font-bold outline-none focus:underline" />
          <div className="text-stone-500">{fechaLarga(e.fecha)} · {money(r.precio)} por persona</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={e.estado} onChange={(x) => set('estado', x.target.value as EstadoExperiencia)} className="w-auto">
            {['Armando', 'Abierta', 'Llena', 'Realizada', 'Cancelada'].map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
      </div>
      <div className="mb-5 max-w-md"><CupoBar confirmados={r.confirmados} min={e.cupoMin} max={e.cupoMax} /></div>

      <div className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-stone-200 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx('whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', tab === t ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-500 hover:text-stone-800')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Ficha' && <Ficha e={e} set={set} />}
      {tab === 'Costos y precio' && <Costos e={e} set={set} />}
      {tab === 'Participantes' && <Participantes e={e} />}
      {tab === 'Checklist' && <Checklist e={e} set={set} />}
      {tab === 'Resultado' && <Resultado e={e} />}

      <div className="mt-10 border-t border-stone-200 pt-4">
        <Button variant="danger" onClick={() => { if (confirm('¿Borrar esta experiencia? Los clientes quedan, pero sin experiencia asignada.')) { borrar('experiencias', e.id); nav('/experiencias') } }}>
          <Trash2 size={16} /> Borrar experiencia
        </Button>
      </div>
    </div>
  )
}

type SetFn = <K extends keyof Experiencia>(k: K, v: Experiencia[K]) => void

function Ficha({ e, set }: { e: Experiencia; set: SetFn }) {
  const { datos } = useDatos()
  const pl = datos.ajustes.plantillas.find((p) => p.id === 'info')
  const texto = pl ? rellenar(pl.texto, datos, e) : ''
  const [copiado, setCopiado] = useState(false)
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Fecha"><Input type="date" value={e.fecha} onChange={(x) => set('fecha', x.target.value)} /></Field>
          <Field label="Horario / duración"><Input value={e.horario} onChange={(x) => set('horario', x.target.value)} placeholder="9:00 a 17:00" /></Field>
          <Field label="Lugar" className="sm:col-span-2"><Input value={e.lugar} onChange={(x) => set('lugar', x.target.value)} /></Field>
          <Field label="Descripción (para la página pública)" className="sm:col-span-2"><Textarea value={e.descripcion} onChange={(x) => set('descripcion', x.target.value)} /></Field>
          <Field label="Qué incluye" className="sm:col-span-2"><Textarea value={e.incluye} onChange={(x) => set('incluye', x.target.value)} /></Field>
          <Field label="Qué llevar" className="sm:col-span-2"><Input value={e.llevar} onChange={(x) => set('llevar', x.target.value)} /></Field>
          <Field label="Cupo mínimo" hint="Si no se llega, no sale"><NumInput value={e.cupoMin} onChange={(n) => set('cupoMin', n)} /></Field>
          <Field label="Cupo máximo"><NumInput value={e.cupoMax} onChange={(n) => set('cupoMax', n)} /></Field>
          <Field label="Link de pago de la seña" hint="Link de Mercado Pago u otro" className="sm:col-span-2"><Input value={e.linkPago} onChange={(x) => set('linkPago', x.target.value)} placeholder="https://mpago.la/..." /></Field>
          <Field label="Foto (URL)" hint="Link a una foto de gente haciendo la actividad" className="sm:col-span-2"><Input value={e.imagen} onChange={(x) => set('imagen', x.target.value)} placeholder="https://..." /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={e.publica} onChange={(x) => set('publica', x.target.checked)} className="size-4 accent-teal-700" />
            Mostrar en la página pública (cuando esté “Abierta”)
          </label>
        </div>
      </Card>
      <Card title="Así se ve el mensaje" action={
        <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }}>
          <Copy size={14} /> {copiado ? '¡Copiado!' : 'Copiar'}
        </Button>
      }>
        <pre className="whitespace-pre-wrap rounded-xl bg-[#e7ffdb] p-3 font-sans text-sm text-stone-800">{texto}</pre>
      </Card>
    </div>
  )
}

function Lineas({ titulo, ayuda, items, onChange }: { titulo: string; ayuda: string; items: Linea[]; onChange: (l: Linea[]) => void }) {
  const upd = (id: string, p: Partial<Linea>) => onChange(items.map((x) => (x.id === id ? { ...x, ...p } : x)))
  return (
    <Card title={titulo}>
      <p className="-mt-2 mb-3 text-xs text-stone-500">{ayuda}</p>
      <div className="space-y-2">
        {items.map((l) => (
          <div key={l.id} className="grid grid-cols-[1fr_7.5rem_auto] gap-2">
            <Input value={l.nombre} placeholder="Concepto" onChange={(x) => upd(l.id, { nombre: x.target.value })} />
            <NumInput value={l.monto} onChange={(n) => upd(l.id, { monto: n })} />
            <Button variant="danger" size="sm" onClick={() => onChange(items.filter((x) => x.id !== l.id))} aria-label="Quitar"><Trash2 size={16} /></Button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => onChange([...items, { id: uid(), nombre: '', monto: 0 }])}><Plus size={14} /> Agregar</Button>
        <span className="font-semibold tabular-nums">{money(items.reduce((a, x) => a + x.monto, 0))}</span>
      </div>
    </Card>
  )
}

function Costos({ e, set }: { e: Experiencia; set: SetFn }) {
  const { datos } = useDatos()
  const com = datos.ajustes.comision
  const p = precioExperiencia(e, com)
  const esc = escenarios(e, com)
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Lineas titulo="Costos fijos del grupo" ayuda="Se pagan igual vayan 5 o 14 (guía, profe, combi, fotógrafo). Van siempre dentro del precio base." items={e.costosFijos} onChange={(v) => set('costosFijos', v)} />
        <Lineas titulo="Costos por persona" ayuda="Se multiplican por cada participante (actividad, comida, seguro)." items={e.costosVariables} onChange={(v) => set('costosVariables', v)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Precio" className="lg:col-span-1">
          <div className="space-y-3">
            <Field label="Margen de ganancia buscado (%)" hint="En turismo suele ir de 20 a 35 %">
              <NumInput value={Math.round(e.margen * 100)} onChange={(n) => set('margen', n / 100)} />
            </Field>
            <Field label="Redondear a múltiplos de"><NumInput value={e.redondeo} onChange={(n) => set('redondeo', n)} /></Field>
            <div className="rounded-xl bg-teal-50 p-3">
              <div className="text-sm text-teal-900">Precio sugerido (con el cupo mínimo)</div>
              <div className="text-2xl font-bold text-teal-900 tabular-nums">{money(p.sugerido)}</div>
            </div>
            <Field label="Precio de venta" hint="Vacío = usar el sugerido">
              <Input type="number" value={e.precio ?? ''} placeholder={String(p.sugerido)} onChange={(x) => set('precio', x.target.value === '' ? null : Number(x.target.value))} />
            </Field>
            <Field label="Seña (%)"><NumInput value={e.senaPct} onChange={(n) => set('senaPct', n)} /></Field>
            <p className="text-sm text-stone-600">Seña <b>{money(p.sena)}</b> · Saldo <b>{money(p.saldo)}</b></p>
            <p className="text-xs text-stone-500">Comisión de cobro: {pct(com)} (se cambia en Ajustes)</p>
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Te queda por persona" value={money(p.neto)} hint="Después de comisión y costo por persona" />
            <Stat label="Punto de equilibrio" value={p.equilibrio ? `${p.equilibrio} pers.` : '—'} hint={p.equilibrio ? 'Mínimo para no perder' : 'El precio no cubre el costo'} tone={p.equilibrio == null || p.equilibrio > e.cupoMin ? 'bad' : 'good'} />
            <Stat label="Ganancia cupo mínimo" value={money(e.cupoMin * p.neto - p.fijos)} tone={e.cupoMin * p.neto - p.fijos < 0 ? 'bad' : 'good'} />
            <Stat label="Ganancia cupo lleno" value={money(e.cupoMax * p.neto - p.fijos)} tone="good" />
          </div>
          {p.equilibrio != null && p.equilibrio > e.cupoMin && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Ojo: con el cupo mínimo ({e.cupoMin}) pierden plata. Suban el precio o el cupo mínimo a {p.equilibrio}.</div>
          )}
          <Card title="¿Cuánto ganamos según cuánta gente va?">
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[520px] text-sm tabular-nums">
                <thead className="text-left text-stone-500">
                  <tr><th className="p-2">Personas</th><th className="p-2">Ingresos</th><th className="p-2">Costos</th><th className="p-2">Ganancia</th><th className="p-2">Margen</th></tr>
                </thead>
                <tbody>
                  {esc.map((x) => (
                    <tr key={x.n} className={cx('border-t border-stone-100', x.ganancia < 0 ? 'bg-red-50 text-red-700' : x.n >= e.cupoMin && x.n <= e.cupoMax ? 'bg-emerald-50/60' : 'text-stone-500')}>
                      <td className="p-2 font-medium">{x.n}{x.n === e.cupoMin && ' (mín)'}{x.n === e.cupoMax && ' (máx)'}</td>
                      <td className="p-2">{money(x.ingresos)}</td>
                      <td className="p-2">{money(x.com + x.fijos + x.vars)}</td>
                      <td className="p-2 font-semibold">{money(x.ganancia)}</td>
                      <td className="p-2">{pct(x.margen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Actividades opcionales (cada uno paga la suya)">
        <p className="-mt-2 mb-3 text-xs text-stone-500">Lo que es por persona puede ser opcional. Ponés el costo del proveedor y el precio al cliente.</p>
        {e.opcionales.map((o) => (
          <div key={o.id} className="mb-2 grid grid-cols-[1fr_6rem_6rem_auto] items-center gap-2 sm:grid-cols-[1fr_8rem_8rem_8rem_auto]">
            <Input value={o.nombre} placeholder="Actividad" onChange={(x) => set('opcionales', e.opcionales.map((y) => (y.id === o.id ? { ...y, nombre: x.target.value } : y)))} />
            <NumInput value={o.costo} title="Costo" onChange={(n) => set('opcionales', e.opcionales.map((y) => (y.id === o.id ? { ...y, costo: n } : y)))} />
            <NumInput value={o.precio} title="Precio" onChange={(n) => set('opcionales', e.opcionales.map((y) => (y.id === o.id ? { ...y, precio: n } : y)))} />
            <span className="hidden text-sm text-emerald-700 sm:block">Ganás {money(o.precio * (1 - com) - o.costo)}</span>
            <Button variant="danger" size="sm" onClick={() => set('opcionales', e.opcionales.filter((y) => y.id !== o.id))} aria-label="Quitar"><Trash2 size={16} /></Button>
          </div>
        ))}
        <div className="mb-2 hidden grid-cols-[1fr_8rem_8rem_8rem_auto] gap-2 text-xs text-stone-500 sm:grid"><span /><span>Costo proveedor</span><span>Precio cliente</span></div>
        <Button variant="secondary" size="sm" onClick={() => set('opcionales', [...e.opcionales, { id: uid(), nombre: '', costo: 0, precio: 0 }])}><Plus size={14} /> Agregar opcional</Button>
      </Card>
    </div>
  )
}

function Participantes({ e }: { e: Experiencia }) {
  const { datos, guardar } = useDatos()
  const [abierto, setAbierto] = useState<Lead | null>(null)
  const [wa, setWa] = useState<Lead | null>(null)
  const leads = datos.leads.filter((l) => l.experienciaId === e.id)
  const orden = ['Pagó todo', 'Señó', 'Asistió', 'Interesado', 'Consultó', 'No respondió', 'Canceló']
  leads.sort((a, b) => orden.indexOf(a.estado) - orden.indexOf(b.estado))
  const confirmados = leads.filter((l) => ['Señó', 'Pagó todo', 'Asistió'].includes(l.estado))
  const lista = confirmados.map((l, i) => `${i + 1}. ${l.nombre}${l.whatsapp ? ` – ${l.whatsapp}` : ''}${!l.aceptaFotos ? ' (NO fotos)' : ''}`).join('\n')
  return (
    <Card title={`Participantes (${leads.length})`} action={
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(`${e.nombre} – ${fechaLarga(e.fecha)}\n${lista}`)}><Copy size={14} /> Copiar lista</Button>
        <Button size="sm" onClick={() => setAbierto(nuevoLead(e.id))}><Plus size={14} /> Agregar</Button>
      </div>
    }>
      {leads.length === 0 ? <Empty>Todavía nadie para esta fecha.</Empty> : (
        <ul className="divide-y divide-stone-100">
          {leads.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <button className="min-w-0 text-left" onClick={() => setAbierto(l)}>
                <div className="font-medium">{l.nombre} {!l.aceptaFotos && <span className="text-xs text-red-600">· sin fotos</span>}</div>
                <div className="text-xs text-stone-500">Pagó {money(cobrado(l))} de {money(precioLead(l, e, datos.ajustes.comision))}{faltaDe(l, datos) > 0 && <span className="text-amber-700"> · falta {money(faltaDe(l, datos))}</span>}</div>
              </button>
              <div className="flex items-center gap-2">
                <Select value={l.estado} onChange={(x) => guardar('leads', { ...l, estado: x.target.value as Lead['estado'] })} className="w-auto py-1 text-sm">
                  {['Consultó', 'Interesado', 'Señó', 'Pagó todo', 'Asistió', 'Canceló', 'No respondió'].map((s) => <option key={s}>{s}</option>)}
                </Select>
                <Button size="sm" variant="whatsapp" onClick={() => setWa(l)} aria-label="WhatsApp"><MessageCircle size={16} /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {abierto && <LeadModal key={abierto.id} lead={abierto} open onClose={() => setAbierto(null)} />}
      {wa && <WhatsAppModal key={wa.id} lead={wa} open onClose={() => setWa(null)} />}
    </Card>
  )
}

function Checklist({ e, set }: { e: Experiencia; set: SetFn }) {
  const [nuevo, setNuevo] = useState('')
  const etapas = [...new Set(e.checklist.map((c) => c.etapa))]
  const hechos = e.checklist.filter((c) => c.hecho).length
  return (
    <Card title={`Checklist (${hechos}/${e.checklist.length})`}>
      <div className="mb-4 h-2 rounded-full bg-stone-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${e.checklist.length ? (hechos / e.checklist.length) * 100 : 0}%` }} /></div>
      <div className="grid gap-5 sm:grid-cols-2">
        {etapas.map((et) => (
          <div key={et}>
            <h4 className="mb-2 text-sm font-semibold text-stone-600">{et}</h4>
            {e.checklist.filter((c) => c.etapa === et).map((c) => (
              <label key={c.id} className="flex items-start gap-2 py-1 text-sm">
                <input type="checkbox" checked={c.hecho} onChange={(x) => set('checklist', e.checklist.map((y) => (y.id === c.id ? { ...y, hecho: x.target.checked } : y)))} className="mt-0.5 size-4 accent-teal-700" />
                <span className={c.hecho ? 'text-stone-400 line-through' : ''}>{c.texto}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(x) => { x.preventDefault(); if (!nuevo.trim()) return; set('checklist', [...e.checklist, { id: uid(), texto: nuevo.trim(), hecho: false, etapa: 'Otras' }]); setNuevo('') }}>
        <Input value={nuevo} onChange={(x) => setNuevo(x.target.value)} placeholder="Agregar tarea…" />
        <Button type="submit" variant="secondary"><Plus size={16} /></Button>
      </form>
    </Card>
  )
}

function Resultado({ e }: { e: Experiencia }) {
  const { datos, guardar, borrar } = useDatos()
  const r = resumenExperiencia(e, datos.leads, datos.gastos, datos.ajustes)
  const gastos = datos.gastos.filter((g) => g.experienciaId === e.id)
  const upd = (g: Gasto, p: Partial<Gasto>) => guardar('gastos', { ...g, ...p })
  const comision = r.ingresos * datos.ajustes.comision
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ingresos (confirmados)" value={money(r.ingresos)} hint={`${r.confirmados} personas`} />
        <Stat label="Cobrado" value={money(r.cobrado)} hint={r.pendiente > 0 ? `Falta ${money(r.pendiente)}` : 'Todo cobrado'} tone={r.pendiente > 0 ? 'warn' : 'good'} />
        <Stat label={r.usaCostoReal ? 'Gastos reales' : 'Costos estimados'} value={money(r.usaCostoReal ? r.costoReal : r.costoEstimado)} hint={`+ comisiones ${money(comision)}`} />
        <Stat label="Ganancia" value={money(r.ganancia)} tone={r.ganancia < 0 ? 'bad' : 'good'} hint={r.ingresos ? `Margen ${pct(r.ganancia / r.ingresos)}` : undefined} />
      </div>
      <Card title="Gastos reales" action={<Button size="sm" onClick={() => guardar('gastos', { id: uid(), experienciaId: e.id, fecha: hoy(), concepto: '', monto: 0, pagado: false })}><Plus size={14} /> Agregar gasto</Button>}>
        <p className="-mt-2 mb-3 text-xs text-stone-500">Cargá lo que realmente pagaste. Mientras no haya gastos cargados, la ganancia se calcula con los costos estimados (estimado para {r.confirmados} personas: {money(r.costoEstimado)}).</p>
        {gastos.length === 0 ? <Empty>Sin gastos cargados.</Empty> : gastos.map((g) => (
          <div key={g.id} className="mb-2 grid grid-cols-[1fr_7rem_auto] gap-2 sm:grid-cols-[9rem_1fr_9rem_auto_auto]">
            <Input type="date" value={g.fecha} onChange={(x) => upd(g, { fecha: x.target.value })} className="hidden sm:block" />
            <Input value={g.concepto} placeholder="Concepto" onChange={(x) => upd(g, { concepto: x.target.value })} />
            <NumInput value={g.monto} onChange={(n) => upd(g, { monto: n })} />
            <label className="hidden items-center gap-1 text-sm sm:flex"><input type="checkbox" checked={g.pagado} onChange={(x) => upd(g, { pagado: x.target.checked })} className="accent-teal-700" /> Pagado</label>
            <Button variant="danger" size="sm" onClick={() => borrar('gastos', g.id)} aria-label="Borrar"><Trash2 size={16} /></Button>
          </div>
        ))}
        {gastos.some((g) => !g.pagado) && <p className="mt-2 text-sm text-amber-700">Falta pagar a proveedores: {money(gastos.filter((g) => !g.pagado).reduce((a, g) => a + g.monto, 0))}</p>}
      </Card>
      <Card title="Origen de los clientes">
        {(() => {
          const ls = datos.leads.filter((l) => l.experienciaId === e.id)
          const m = new Map<string, number>()
          ls.forEach((l) => m.set(l.origen, (m.get(l.origen) ?? 0) + 1))
          return ls.length === 0 ? <Empty>Sin datos.</Empty> : (
            <div className="flex flex-wrap gap-2">{[...m].sort((a, b) => b[1] - a[1]).map(([k, v]) => <Badge key={k}>{`${k}: ${v}`}</Badge>)}</div>
          )
        })()}
      </Card>
    </div>
  )
}
