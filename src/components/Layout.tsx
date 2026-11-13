import { NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, ExternalLink, LayoutDashboard, LogOut, MessageCircle, Settings, Users, Wallet } from 'lucide-react'
import { useDatos } from '../lib/store'
import { modo, supabase } from '../lib/backend'
import { cx } from './ui'

const links = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/experiencias', label: 'Experiencias', icon: CalendarDays },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet },
  { to: '/mensajes', label: 'Mensajes', icon: MessageCircle },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

export default function Layout() {
  const { datos, error } = useDatos()
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-stone-200 bg-white p-4 md:flex">
        <div className="mb-6 px-2">
          <div className="text-lg font-bold text-teal-800">{datos.ajustes.marca}</div>
          <div className="text-xs text-stone-500">Panel de gestión</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium', isActive ? 'bg-teal-50 text-teal-800' : 'text-stone-600 hover:bg-stone-100')}
            >
              <l.icon size={18} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <a href="/p" target="_blank" className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">
          <ExternalLink size={16} /> Ver página pública
        </a>
        {supabase && (
          <button onClick={() => supabase!.auth.signOut()} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">
            <LogOut size={16} /> Salir
          </button>
        )}
        <div className="mt-2 px-3 text-xs text-stone-400">{modo === 'nube' ? '☁️ Datos en la nube' : '💾 Modo local (este navegador)'}</div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-10 lg:px-10">
        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2 text-[10px]', isActive ? 'text-teal-700' : 'text-stone-500')}>
            <l.icon size={20} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
