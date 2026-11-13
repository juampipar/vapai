export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))

export const money = (n: number) => {
  const v = Math.round(n || 0)
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('es-AR')
}

export const pct = (n: number) => `${Math.round((n || 0) * 1000) / 10}%`

export const hoy = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export const sumarDias = (iso: string, dias: number) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

export const diasHasta = (iso: string) => {
  if (!iso) return Infinity
  const a = new Date(hoy() + 'T12:00:00').getTime()
  const b = new Date(iso + 'T12:00:00').getTime()
  return Math.round((b - a) / 86400000)
}

export const fechaLarga = (iso: string) => {
  if (!iso) return 'Sin fecha'
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export const fechaCorta = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export const soloNumeros = (s: string) => (s || '').replace(/\D/g, '')

export const waLink = (numero: string, texto: string) => {
  const n = soloNumeros(numero)
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`
}
