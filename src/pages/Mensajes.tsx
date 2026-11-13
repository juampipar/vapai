import { useState } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useDatos } from '../lib/store'
import { rellenar, VARIABLES } from '../lib/plantillas'
import { PLANTILLAS_DEFAULT } from '../lib/seed'
import { uid } from '../lib/format'
import type { Plantilla } from '../lib/types'
import { nuevoLead } from '../components/Leads'
import { Button, Card, Field, Input, PageHeader, Select, Textarea, cx } from '../components/ui'

export default function Mensajes() {
  const { datos, guardarAjustes } = useDatos()
  const pls = datos.ajustes.plantillas
  const [sel, setSel] = useState(pls[0]?.id ?? '')
  const [expId, setExpId] = useState(datos.experiencias[0]?.id ?? '')
  const p = pls.find((x) => x.id === sel)
  const exp = datos.experiencias.find((e) => e.id === expId)
  const leadEj = { ...nuevoLead(expId), nombre: 'Sofía' }
  const upd = (patch: Partial<Plantilla>) => guardarAjustes({ ...datos.ajustes, plantillas: pls.map((x) => (x.id === sel ? { ...x, ...patch } : x)) })

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Mensajes" subtitle="Plantillas de WhatsApp. Se completan solas con los datos del cliente y la experiencia." />
      <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-1">
          {pls.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} className={cx('block w-full rounded-xl px-3 py-2 text-left text-sm', x.id === sel ? 'bg-teal-50 font-medium text-teal-800' : 'hover:bg-stone-100')}>
              {x.nombre} <span className="text-xs text-stone-400">{x.atajo}</span>
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => {
            const n: Plantilla = { id: uid(), atajo: '/nuevo', nombre: 'Nuevo mensaje', cuando: '', texto: 'Hola {nombre}!' }
            guardarAjustes({ ...datos.ajustes, plantillas: [...pls, n] }); setSel(n.id)
          }}><Plus size={14} /> Nueva plantilla</Button>
          <Button variant="ghost" size="sm" onClick={() => { if (confirm('¿Volver a las plantillas originales? Se pierden los cambios.')) guardarAjustes({ ...datos.ajustes, plantillas: PLANTILLAS_DEFAULT }) }}><RotateCcw size={14} /> Restaurar originales</Button>
        </div>

        {p && (
          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre"><Input value={p.nombre} onChange={(e) => upd({ nombre: e.target.value })} /></Field>
                  <Field label="Atajo (WhatsApp Business)"><Input value={p.atajo} onChange={(e) => upd({ atajo: e.target.value })} /></Field>
                </div>
                <Field label="Cuándo usarlo"><Input value={p.cuando} onChange={(e) => upd({ cuando: e.target.value })} /></Field>
                <Field label="Texto"><Textarea rows={12} value={p.texto} onChange={(e) => upd({ texto: e.target.value })} /></Field>
                <div className="text-xs text-stone-500">
                  Podés usar: {VARIABLES.map((v) => <code key={v} className="mr-1 inline-block rounded bg-stone-100 px-1">{`{${v}}`}</code>)}
                </div>
                <Button variant="danger" size="sm" onClick={() => { if (confirm('¿Borrar plantilla?')) { guardarAjustes({ ...datos.ajustes, plantillas: pls.filter((x) => x.id !== p.id) }); setSel(pls[0]?.id ?? '') } }}><Trash2 size={14} /> Borrar plantilla</Button>
              </div>
            </Card>
            <Card title="Vista previa" action={
              <Select value={expId} onChange={(e) => setExpId(e.target.value)} className="w-48 py-1 text-sm">
                {datos.experiencias.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </Select>
            }>
              <pre className="whitespace-pre-wrap rounded-xl bg-[#e7ffdb] p-3 font-sans text-sm">{rellenar(p.texto, datos, exp, leadEj)}</pre>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
