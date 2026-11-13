import { useState } from 'react'
import { MessageCircle, Plus, Search } from 'lucide-react'
import { useDatos } from '../lib/store'
import { ESTADOS_LEAD, type Lead } from '../lib/types'
import { cobrado } from '../lib/calc'
import { fechaCorta, hoy, money } from '../lib/format'
import { Badge, Button, Card, Empty, Input, PageHeader, Select, cx } from '../components/ui'
import { LeadModal, WhatsAppModal, faltaDe, nuevoLead } from '../components/Leads'

export default function Clientes() {
  const { datos, guardar } = useDatos()
  const [estado, setEstado] = useState<string>('Todos')
  const [exp, setExp] = useState('')
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState<Lead | null>(null)
  const [wa, setWa] = useState<Lead | null>(null)

  const filtrados = datos.leads
    .filter((l) => estado === 'Todos' || l.estado === estado)
    .filter((l) => !exp || l.experienciaId === exp)
    .filter((l) => !q || `${l.nombre} ${l.whatsapp} ${l.instagram} ${l.notas}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.proximoContacto || '9999').localeCompare(b.proximoContacto || '9999') || b.creado.localeCompare(a.creado))

  const n = (s: string) => datos.leads.filter((l) => (s === 'Todos' ? true : l.estado === s) && (!exp || l.experienciaId === exp)).length

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Clientes" subtitle="Todos los que escribieron, en qué estado están y cuánto pagaron" action={<Button onClick={() => setAbierto(nuevoLead(exp))}><Plus size={18} /> Nuevo cliente</Button>} />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {['Todos', ...ESTADOS_LEAD].map((s) => (
          <button key={s} onClick={() => setEstado(s)} className={cx('rounded-full border px-3 py-1 text-sm', estado === s ? 'border-teal-700 bg-teal-700 text-white' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50')}>
            {s} <span className="opacity-70">{n(s)}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-stone-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, teléfono, notas…" className="pl-9" />
        </div>
        <Select value={exp} onChange={(e) => setExp(e.target.value)} className="sm:w-72">
          <option value="">Todas las experiencias</option>
          {datos.experiencias.map((e) => <option key={e.id} value={e.id}>{e.nombre} ({fechaCorta(e.fecha)})</option>)}
        </Select>
      </div>

      <Card className="p-0 sm:p-0">
        {filtrados.length === 0 ? <div className="p-4"><Empty>No hay clientes con ese filtro.</Empty></div> : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-stone-200 text-left text-stone-500">
                  <tr>
                    <th className="p-3">Nombre</th><th className="p-3">Experiencia</th><th className="p-3">Estado</th>
                    <th className="p-3 text-right">Pagó</th><th className="p-3 text-right">Falta</th><th className="p-3">Seguimiento</th><th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((l) => {
                    const e = datos.experiencias.find((x) => x.id === l.experienciaId)
                    const atrasado = l.proximoContacto && l.proximoContacto <= hoy()
                    return (
                      <tr key={l.id} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="cursor-pointer p-3" onClick={() => setAbierto(l)}>
                          <div className="font-medium">{l.nombre}</div>
                          <div className="text-xs text-stone-500">{l.origen}{l.instagram && ` · ${l.instagram}`}</div>
                        </td>
                        <td className="p-3 text-stone-600">{e ? `${e.nombre} (${fechaCorta(e.fecha)})` : '—'}</td>
                        <td className="p-3">
                          <Select value={l.estado} onChange={(x) => guardar('leads', { ...l, estado: x.target.value as Lead['estado'] })} className="w-36 py-1 text-sm">
                            {ESTADOS_LEAD.map((s) => <option key={s}>{s}</option>)}
                          </Select>
                        </td>
                        <td className="p-3 text-right tabular-nums">{money(cobrado(l))}</td>
                        <td className={cx('p-3 text-right tabular-nums', faltaDe(l, datos) > 0 && 'text-amber-700')}>{money(faltaDe(l, datos))}</td>
                        <td className={cx('p-3', atrasado && 'font-medium text-red-600')}>
                          <input type="date" value={l.proximoContacto} onChange={(x) => guardar('leads', { ...l, proximoContacto: x.target.value })} className="bg-transparent" />
                        </td>
                        <td className="p-3"><Button size="sm" variant="whatsapp" onClick={() => setWa(l)} aria-label="WhatsApp"><MessageCircle size={16} /></Button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-stone-100 md:hidden">
              {filtrados.map((l) => {
                const e = datos.experiencias.find((x) => x.id === l.experienciaId)
                return (
                  <li key={l.id} className="flex items-center justify-between gap-2 p-3">
                    <button className="min-w-0 text-left" onClick={() => setAbierto(l)}>
                      <div className="flex items-center gap-2"><span className="truncate font-medium">{l.nombre}</span><Badge>{l.estado}</Badge></div>
                      <div className="truncate text-xs text-stone-500">
                        {e?.nombre ?? 'Sin experiencia'}{faltaDe(l, datos) > 0 && ` · falta ${money(faltaDe(l, datos))}`}
                        {l.proximoContacto && ` · escribir ${fechaCorta(l.proximoContacto)}`}
                      </div>
                    </button>
                    <Button size="sm" variant="whatsapp" onClick={() => setWa(l)} aria-label="WhatsApp"><MessageCircle size={16} /></Button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>
      {abierto && <LeadModal key={abierto.id} lead={abierto} open onClose={() => setAbierto(null)} />}
      {wa && <WhatsAppModal key={wa.id} lead={wa} open onClose={() => setWa(null)} />}
    </div>
  )
}
