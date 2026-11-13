import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useDatos } from '../lib/store'
import { resumenExperiencia } from '../lib/calc'
import { diasHasta, fechaLarga, money } from '../lib/format'
import { nuevaExperiencia } from '../lib/seed'
import { Badge, Button, CupoBar, Empty, PageHeader } from '../components/ui'

export default function Experiencias() {
  const { datos, guardar } = useDatos()
  const nav = useNavigate()
  const lista = [...datos.experiencias].sort((a, b) => {
    const fa = diasHasta(a.fecha) < 0, fb = diasHasta(b.fecha) < 0
    if (fa !== fb) return fa ? 1 : -1
    return fa ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha)
  })
  const crear = () => {
    const e = nuevaExperiencia(datos.ajustes)
    guardar('experiencias', e)
    nav(`/experiencias/${e.id}`)
  }
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Experiencias" subtitle="Cada fecha con su ficha, costos, precio y participantes" action={<Button onClick={crear}><Plus size={18} /> Nueva experiencia</Button>} />
      {lista.length === 0 && <Empty>Todavía no hay experiencias.</Empty>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((e) => {
          const r = resumenExperiencia(e, datos.leads, datos.gastos, datos.ajustes)
          const pasada = diasHasta(e.fecha) < 0
          return (
            <Link key={e.id} to={`/experiencias/${e.id}`} className={`flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm hover:border-teal-300 ${pasada ? 'opacity-75' : ''}`}>
              {e.imagen && <img src={e.imagen} alt="" className="mb-3 h-32 w-full rounded-xl object-cover" />}
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold">{e.nombre}</h3>
                <Badge>{e.estado}</Badge>
              </div>
              <div className="mb-3 text-sm text-stone-500">{fechaLarga(e.fecha)}{e.lugar && ` · ${e.lugar}`}</div>
              <div className="mt-auto space-y-3">
                <CupoBar confirmados={r.confirmados} min={e.cupoMin} max={e.cupoMax} />
                <div className="flex justify-between text-sm">
                  <span>{money(r.precio)} <span className="text-stone-500">/ persona</span></span>
                  <span className={r.ganancia < 0 ? 'text-red-600' : 'text-emerald-700'}>{pasada ? 'Ganó' : 'Gana'} {money(r.ganancia)}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
