import { useRef, useState } from 'react'
import { Download, RotateCcw, Save, Upload } from 'lucide-react'
import { useDatos } from '../lib/store'
import { modo } from '../lib/backend'
import { datosDemo } from '../lib/seed'
import { hoy } from '../lib/format'
import type { Ajustes as A, Datos } from '../lib/types'
import { Button, Card, Field, Input, NumInput, PageHeader, Textarea } from '../components/ui'

export default function Ajustes() {
  const { datos, guardarAjustes, importar } = useDatos()
  const [a, setA] = useState<A>(datos.ajustes)
  const [ok, setOk] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const set = <K extends keyof A>(k: K, v: A[K]) => setA((x) => ({ ...x, [k]: v }))

  const exportar = () => {
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href = url
    el.download = `respaldo-${hoy()}.json`
    el.click()
    URL.revokeObjectURL(url)
  }
  const cargarArchivo = async (f: File) => {
    try {
      const d = JSON.parse(await f.text()) as Datos
      if (!Array.isArray(d.experiencias) || !Array.isArray(d.leads)) throw new Error('Archivo inválido')
      if (!confirm('Esto reemplaza TODOS los datos actuales por los del archivo. ¿Seguir?')) return
      await importar({ ...d, gastos: d.gastos ?? [] })
      setA(d.ajustes)
    } catch (e) {
      alert('No se pudo importar: ' + (e as Error).message)
    }
  }
  const empezarDeCero = async () => {
    if (!confirm('¿Borrar todos los datos de ejemplo y empezar vacío? (Antes podés descargar un respaldo)')) return
    await importar({ experiencias: [], leads: [], gastos: [], ajustes: datos.ajustes })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ajustes" subtitle="Datos del negocio, reglas y respaldo" action={
        <Button onClick={() => { guardarAjustes(a); setOk(true); setTimeout(() => setOk(false), 1500) }}><Save size={16} /> {ok ? '¡Guardado!' : 'Guardar'}</Button>
      } />
      <div className="space-y-5">
        <Card title="Negocio">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre de la marca"><Input value={a.marca} onChange={(e) => set('marca', e.target.value)} /></Field>
            <Field label="Instagram"><Input value={a.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@usuario" /></Field>
            <Field label="Lema" className="sm:col-span-2"><Input value={a.lema} onChange={(e) => set('lema', e.target.value)} /></Field>
            <Field label="WhatsApp del negocio" hint="Con código de país y sin espacios: 5491123456789. Lo usa la página pública." className="sm:col-span-2">
              <Input value={a.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} inputMode="tel" />
            </Field>
          </div>
        </Card>
        <Card title="Cobros">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Comisión de cobro (%)" hint="Mercado Pago u otro: revisen la tasa real de su cuenta"><NumInput step="0.1" value={Math.round(a.comision * 1000) / 10} onChange={(n) => set('comision', n / 100)} /></Field>
            <Field label="Seña por defecto (%)"><NumInput value={a.senaPct} onChange={(n) => set('senaPct', n)} /></Field>
            <Field label="El saldo se paga hasta (días antes)"><NumInput value={a.diasSaldo} onChange={(n) => set('diasSaldo', n)} /></Field>
            <Field label="Descuento por traer un amigo (%)"><NumInput value={a.descuentoAmigo} onChange={(n) => set('descuentoAmigo', n)} /></Field>
          </div>
        </Card>
        <Card title="Reglas (cancelaciones, clima, fotos…)">
          <p className="-mt-2 mb-2 text-xs text-stone-500">Se mandan al reservar y aparecen en la página pública. Podés usar {'{sena_pct}'} y {'{dias_saldo}'}.</p>
          <Textarea rows={10} value={a.reglas} onChange={(e) => set('reglas', e.target.value)} />
        </Card>
        <Card title="Respaldo de datos">
          <p className="mb-3 text-sm text-stone-600">
            {modo === 'local'
              ? '⚠️ Estás en modo local: los datos están guardados solo en este navegador. Descargá un respaldo seguido, o conectá Supabase para tenerlos en la nube (ver README).'
              : '☁️ Los datos están en la nube (Supabase). Igual podés bajar un respaldo cuando quieras.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportar}><Download size={16} /> Descargar respaldo</Button>
            <Button variant="secondary" onClick={() => file.current?.click()}><Upload size={16} /> Importar respaldo</Button>
            <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && cargarArchivo(e.target.files[0])} />
          </div>
        </Card>
        <Card title="Datos de ejemplo">
          <p className="mb-3 text-sm text-stone-600">La app viene con datos de ejemplo para que veas cómo funciona. Cuando quieras arrancar en serio, borralos.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={empezarDeCero}>Borrar todo y empezar de cero</Button>
            <Button variant="ghost" onClick={async () => { if (confirm('¿Reemplazar todo por los datos de ejemplo?')) { const d = datosDemo(); await importar(d); setA(d.ajustes) } }}><RotateCcw size={16} /> Cargar ejemplo</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
