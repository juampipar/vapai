import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/backend'
import { DatosProvider } from './lib/store'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Experiencias from './pages/Experiencias'
import ExperienciaDetalle from './pages/ExperienciaDetalle'
import Clientes from './pages/Clientes'
import Finanzas from './pages/Finanzas'
import Mensajes from './pages/Mensajes'
import Ajustes from './pages/Ajustes'
import Publica from './pages/Publica'
import Login from './pages/Login'

function ConLogin({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null | undefined>(supabase ? undefined : null)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (!supabase) return <>{children}</>
  if (sesion === undefined) return <div className="p-8 text-center text-stone-500">Cargando…</div>
  if (!sesion) return <Login />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/p" element={<Publica />} />
        <Route
          element={
            <ConLogin>
              <DatosProvider>
                <Layout />
              </DatosProvider>
            </ConLogin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="experiencias" element={<Experiencias />} />
          <Route path="experiencias/:id" element={<ExperienciaDetalle />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="mensajes" element={<Mensajes />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
