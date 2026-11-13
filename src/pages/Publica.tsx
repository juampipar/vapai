import { useEffect, useState } from 'react'
import { CalendarDays, Check, Clock, MapPin, MessageCircle, Users } from 'lucide-react'
import { cargarPublico, crearConsultaPublica, type Publico as P } from '../lib/backend'
import { precioExperiencia } from '../lib/calc'
import { fechaLarga, money, waLink } from '../lib/format'
import { Button, Field, Input, Modal, Textarea } from '../components/ui'

type ExpPub = P['experiencias'][number]

export default function Publica() {
  const [d, setD] = useState<P | null>(null)
  const [err, setErr] = useState('')
  const [form, setForm] = useState<ExpPub | null>(null)

  useEffect(() => {
    cargarPublico().then(setD).catch((e) => setErr(String(e.message ?? e)))
  }, [])
  useEffect(() => {
    if (d) document.title = d.ajustes.marca
  }, [d])

  if (err) return <div className="p-8 text-center text-red-600">{err}</div>
  if (!d) return <div className="p-8 text-center text-stone-500">Cargando…</div>
  const aj = d.ajustes
  const exps = [...d.experiencias].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const reglas = aj.reglas.replace('{sena_pct}', `${aj.senaPct}%`).replace('{dias_saldo}', String(aj.diasSaldo))

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-gradient-to-br from-teal-800 to-teal-600 px-4 pb-16 pt-12 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-sm uppercase tracking-widest text-teal-100">{aj.instagram}</div>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{aj.marca}</h1>
          <p className="mt-3 max-w-xl text-lg text-teal-50">{aj.lema}</p>
          {aj.whatsapp && (
            <a href={waLink(aj.whatsapp, '¡Hola! Quiero info de las próximas experiencias')} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-teal-800">
              <MessageCircle size={18} /> Escribinos
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto -mt-8 max-w-5xl px-4 pb-16">
        <h2 className="mb-4 rounded-2xl bg-white px-5 py-3 text-lg font-semibold shadow-sm">Próximas experiencias</h2>
        {exps.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-stone-500">Pronto anunciamos nuevas fechas. ¡Seguinos en Instagram!</p>}
        <div className="grid gap-5 md:grid-cols-2">
          {exps.map((e) => {
            const p = precioExperiencia(e, aj.comision)
            const libres = Math.max(0, e.cupoMax - e.confirmados)
            const lleno = libres === 0 || e.estado === 'Llena'
            return (
              <article key={e.id} className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                {e.imagen ? <img src={e.imagen} alt="" className="h-48 w-full object-cover" /> : <div className="h-3 bg-teal-600" />}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl font-bold">{e.nombre}</h3>
                  <div className="mt-2 space-y-1 text-sm text-stone-600">
                    <div className="flex items-center gap-2"><CalendarDays size={16} /> {fechaLarga(e.fecha)}</div>
                    {e.horario && <div className="flex items-center gap-2"><Clock size={16} /> {e.horario}</div>}
                    {e.lugar && <div className="flex items-center gap-2"><MapPin size={16} /> {e.lugar}</div>}
                    <div className="flex items-center gap-2"><Users size={16} /> Grupo de {e.cupoMin} a {e.cupoMax} personas</div>
                  </div>
                  {e.descripcion && <p className="mt-3 text-stone-700">{e.descripcion}</p>}
                  {e.incluye && (
                    <div className="mt-3">
                      <div className="text-sm font-semibold">Incluye</div>
                      <ul className="mt-1 space-y-0.5 text-sm text-stone-700">
                        {e.incluye.split(/,|\n/).map((x) => x.trim()).filter(Boolean).map((x) => (
                          <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-teal-600" /> {x.replace(/^y /, '')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {e.opcionales.length > 0 && <p className="mt-2 text-sm text-stone-500">Opcional: {e.opcionales.map((o) => `${o.nombre} (${money(o.precio)})`).join(', ')}</p>}
                  <div className="mt-auto pt-5">
                    <div className="mb-3 flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold">{money(p.precio)}</div>
                        <div className="text-xs text-stone-500">por persona · reservás con {money(p.sena)}</div>
                      </div>
                      <div className={`text-sm font-medium ${lleno ? 'text-red-600' : libres <= 4 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {lleno ? 'Agotado' : `Quedan ${libres} lugares`}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {aj.whatsapp && (
                        <a className="flex-1" href={waLink(aj.whatsapp, `¡Hola! Quiero reservar para "${e.nombre}" el ${fechaLarga(e.fecha)} 🙌`)} target="_blank" rel="noreferrer">
                          <Button variant="whatsapp" className="w-full"><MessageCircle size={18} /> {lleno ? 'Lista de espera' : 'Reservar por WhatsApp'}</Button>
                        </a>
                      )}
                      <Button variant="secondary" className="flex-1" onClick={() => setForm(e)}>Dejar mis datos</Button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <details className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
          <summary className="cursor-pointer font-semibold">Cómo funciona la reserva y condiciones</summary>
          <p className="mt-3 whitespace-pre-line text-sm text-stone-700">{reglas}</p>
        </details>
      </main>
      {form && <FormConsulta exp={form} onClose={() => setForm(null)} />}
    </div>
  )
}

function FormConsulta({ exp, onClose }: { exp: ExpPub; onClose: () => void }) {
  const [f, setF] = useState({ nombre: '', whatsapp: '', email: '', notas: '' })
  const [estado, setEstado] = useState<'form' | 'enviando' | 'ok' | 'error'>('form')
  const enviar = async () => {
    setEstado('enviando')
    try {
      await crearConsultaPublica({ ...f, experienciaId: exp.id })
      setEstado('ok')
    } catch {
      setEstado('error')
    }
  }
  return (
    <Modal open onClose={onClose} title={exp.nombre}>
      {estado === 'ok' ? (
        <div className="py-6 text-center">
          <div className="text-4xl">🙌</div>
          <p className="mt-2 font-medium">¡Listo! Te escribimos por WhatsApp a la brevedad.</p>
          <Button className="mt-4" onClick={onClose}>Cerrar</Button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); enviar() }}>
          <Field label="Nombre y apellido"><Input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Field>
          <Field label="WhatsApp" hint="Con código de área, ej: 11 2345 6789"><Input required inputMode="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Field>
          <Field label="Email (opcional)"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="¿Alguna pregunta?"><Textarea rows={2} value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} /></Field>
          {estado === 'error' && <p className="text-sm text-red-600">No se pudo enviar. Probá de nuevo o escribinos por WhatsApp.</p>}
          <Button type="submit" className="w-full" disabled={estado === 'enviando'}>{estado === 'enviando' ? 'Enviando…' : 'Quiero que me contacten'}</Button>
        </form>
      )}
    </Modal>
  )
}
