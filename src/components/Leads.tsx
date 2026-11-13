import { useState } from 'react'
import { Copy, MessageCircle, Plus, Trash2 } from 'lucide-react'
import { useDatos } from '../lib/store'
import { ESTADOS_LEAD, ORIGENES, type Lead, type Pago } from '../lib/types'
import { hoy, money, uid, waLink } from '../lib/format'
import { rellenar } from '../lib/plantillas'
import { cobrado, faltaCobrar, precioLead } from '../lib/calc'
import { Button, Field, Input, Modal, NumInput, Select, Textarea } from './ui'

export function nuevoLead(experienciaId = ''): Lead {
  return {
    id: uid(), creado: hoy(), nombre: '', whatsapp: '', instagram: '', email: '', experienciaId, origen: 'Instagram',
    estado: 'Consultó', precio: null, pagos: [], aceptaFotos: true, proximoContacto: '', notas: '',
  }
}

/** Elegir una plantilla, ver el mensaje armado y mandarlo por WhatsApp */
export function WhatsAppModal({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const { datos } = useDatos()
  const [pid, setPid] = useState(datos.ajustes.plantillas[0]?.id ?? '')
  const exp = datos.experiencias.find((e) => e.id === lead.experienciaId)
  const pl = datos.ajustes.plantillas.find((p) => p.id === pid)
  const [texto, setTexto] = useState('')
  const armado = pl ? rellenar(pl.texto, datos, exp, lead) : ''
  const actual = texto || armado
  const [copiado, setCopiado] = useState(false)
  return (
    <Modal open={open} onClose={onClose} title={`Escribirle a ${lead.nombre || 'cliente'}`}>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {datos.ajustes.plantillas.map((p) => (
          <button
            key={p.id}
            onClick={() => { setPid(p.id); setTexto('') }}
            className={`rounded-full border px-3 py-1 text-sm ${p.id === pid ? 'border-teal-700 bg-teal-700 text-white' : 'border-stone-300 text-stone-700 hover:bg-stone-50'}`}
          >
            {p.nombre}
          </button>
        ))}
      </div>
      {pl && <p className="mb-2 text-xs text-stone-500">Cuándo usarlo: {pl.cuando}</p>}
      <Textarea rows={11} value={actual} onChange={(e) => setTexto(e.target.value)} />
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => { navigator.clipboard?.writeText(actual); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }}
        >
          <Copy size={16} /> {copiado ? '¡Copiado!' : 'Copiar'}
        </Button>
        <a href={waLink(lead.whatsapp, actual)} target="_blank" rel="noreferrer">
          <Button variant="whatsapp" disabled={!lead.whatsapp}>
            <MessageCircle size={16} /> Abrir WhatsApp
          </Button>
        </a>
      </div>
      {!lead.whatsapp && <p className="mt-2 text-right text-xs text-amber-700">Cargale el número de WhatsApp para poder abrir el chat.</p>}
    </Modal>
  )
}

/** Alta / edición completa de un cliente, con sus pagos */
export function LeadModal({ lead: inicial, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const { datos, guardar, borrar } = useDatos()
  const [l, setL] = useState<Lead>(inicial)
  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => setL((x) => ({ ...x, [k]: v }))
  const exp = datos.experiencias.find((e) => e.id === l.experienciaId)
  const total = precioLead(l, exp, datos.ajustes.comision)
  const esNuevo = !datos.leads.some((x) => x.id === l.id)

  const setPago = (id: string, p: Partial<Pago>) => set('pagos', l.pagos.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const agregarPago = () => {
    const concepto: Pago['concepto'] = l.pagos.length === 0 ? 'Seña' : 'Saldo'
    const falta = Math.max(0, total - cobrado(l))
    const monto = concepto === 'Seña' && exp ? Math.round((total * exp.senaPct) / 100 / 100) * 100 : falta
    set('pagos', [...l.pagos, { id: uid(), fecha: hoy(), monto, concepto, medio: 'Mercado Pago' }])
  }

  const ok = () => {
    let estado = l.estado
    const pagado = cobrado(l)
    if (pagado > 0 && ['Consultó', 'Interesado', 'No respondió'].includes(estado)) estado = 'Señó'
    if (pagado >= total && total > 0 && estado === 'Señó') estado = 'Pagó todo'
    guardar('leads', { ...l, estado })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={esNuevo ? 'Nuevo cliente' : l.nombre} wide>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">
          <Input value={l.nombre} onChange={(e) => set('nombre', e.target.value)} autoFocus />
        </Field>
        <Field label="WhatsApp" hint="Con código de país, ej: 5491123456789">
          <Input value={l.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} inputMode="tel" />
        </Field>
        <Field label="Instagram">
          <Input value={l.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@usuario" />
        </Field>
        <Field label="Email">
          <Input value={l.email} onChange={(e) => set('email', e.target.value)} type="email" />
        </Field>
        <Field label="Experiencia">
          <Select value={l.experienciaId} onChange={(e) => set('experienciaId', e.target.value)}>
            <option value="">— Sin definir —</option>
            {datos.experiencias.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} ({e.fecha})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={l.estado} onChange={(e) => set('estado', e.target.value as Lead['estado'])}>
            {ESTADOS_LEAD.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="¿Cómo nos conoció?">
          <Select value={l.origen} onChange={(e) => set('origen', e.target.value)}>
            {ORIGENES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Volver a escribirle el" hint="Aparece en el Inicio ese día">
          <Input type="date" value={l.proximoContacto} onChange={(e) => set('proximoContacto', e.target.value)} />
        </Field>
        <Field label="Precio acordado" hint={`Vacío = precio de la experiencia (${money(exp ? precioLead({ ...l, precio: null }, exp, datos.ajustes.comision) : 0)})`}>
          <Input
            type="number"
            value={l.precio ?? ''}
            onChange={(e) => set('precio', e.target.value === '' ? null : Number(e.target.value))}
            placeholder="Precio de la experiencia"
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={l.aceptaFotos} onChange={(e) => set('aceptaFotos', e.target.checked)} className="size-4 accent-teal-700" />
          Acepta salir en fotos / redes
        </label>
        <Field label="Notas" className="sm:col-span-2">
          <Textarea value={l.notas} onChange={(e) => set('notas', e.target.value)} rows={2} />
        </Field>
      </div>

      <div className="mt-5 rounded-xl bg-stone-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-medium">Pagos</h4>
          <span className="text-sm text-stone-600">
            Cobrado <b>{money(cobrado(l))}</b> de {money(total)} · Falta{' '}
            <b className={total - cobrado(l) > 0 ? 'text-amber-700' : 'text-emerald-700'}>{money(Math.max(0, total - cobrado(l)))}</b>
          </span>
        </div>
        {l.pagos.map((p) => (
          <div key={p.id} className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Input type="date" value={p.fecha} onChange={(e) => setPago(p.id, { fecha: e.target.value })} />
            <Select value={p.concepto} onChange={(e) => setPago(p.id, { concepto: e.target.value as Pago['concepto'] })}>
              {['Seña', 'Saldo', 'Opcional', 'Otro'].map((x) => <option key={x}>{x}</option>)}
            </Select>
            <NumInput value={p.monto} onChange={(n) => setPago(p.id, { monto: n })} />
            <Select value={p.medio} onChange={(e) => setPago(p.id, { medio: e.target.value })}>
              {['Mercado Pago', 'Transferencia', 'Efectivo', 'Otro'].map((x) => <option key={x}>{x}</option>)}
            </Select>
            <Button variant="danger" size="sm" onClick={() => set('pagos', l.pagos.filter((x) => x.id !== p.id))} aria-label="Borrar pago">
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={agregarPago}>
          <Plus size={16} /> Registrar pago
        </Button>
        <p className="mt-2 text-xs text-stone-500">Al registrar un pago, el estado pasa solo a “Señó” o “Pagó todo”.</p>
      </div>

      <div className="mt-5 flex justify-between gap-2">
        {!esNuevo ? (
          <Button variant="danger" onClick={() => { if (confirm('¿Borrar este cliente?')) { borrar('leads', l.id); onClose() } }}>
            <Trash2 size={16} /> Borrar
          </Button>
        ) : <span />}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={ok} disabled={!l.nombre.trim()}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

export function faltaDe(l: Lead, datos: ReturnType<typeof useDatos>['datos']) {
  return faltaCobrar(l, datos.experiencias.find((e) => e.id === l.experienciaId), datos.ajustes.comision)
}
