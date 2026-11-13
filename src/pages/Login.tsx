import { useState } from 'react'
import { supabase } from '../lib/backend'
import { Button, Field, Input } from '../components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [cargando, setCargando] = useState(false)
  const entrar = async () => {
    setCargando(true)
    setErr('')
    const { error } = await supabase!.auth.signInWithPassword({ email, password: pass })
    if (error) setErr('Email o contraseña incorrectos')
    setCargando(false)
  }
  return (
    <div className="grid min-h-screen place-items-center bg-stone-50 p-4">
      <form className="w-full max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" onSubmit={(e) => { e.preventDefault(); entrar() }}>
        <h1 className="text-xl font-bold">Entrar al panel</h1>
        <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
        <Field label="Contraseña"><Input type="password" required value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" /></Field>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Button type="submit" className="w-full" disabled={cargando}>{cargando ? 'Entrando…' : 'Entrar'}</Button>
      </form>
    </div>
  )
}
