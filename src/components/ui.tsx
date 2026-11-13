import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cx('rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-semibold text-stone-800">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp'; size?: 'sm' | 'md' }
export function Button({ variant = 'primary', size = 'md', className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1.5 text-sm' : 'px-4 py-2',
        variant === 'primary' && 'bg-teal-700 text-white hover:bg-teal-800',
        variant === 'secondary' && 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
        variant === 'ghost' && 'text-stone-600 hover:bg-stone-100',
        variant === 'danger' && 'text-red-600 hover:bg-red-50',
        variant === 'whatsapp' && 'bg-green-600 text-white hover:bg-green-700',
        className,
      )}
    />
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

const base = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20'
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(base, p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={cx(base, p.className)} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(base, p.className)} />

export function NumInput({ value, onChange, className, ...p }: { value: number; onChange: (n: number) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...p}
      type="number"
      inputMode="decimal"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      className={cx(base, 'tabular-nums', className)}
    />
  )
}

const coloresEstado: Record<string, string> = {
  Consultó: 'bg-sky-100 text-sky-800',
  Interesado: 'bg-indigo-100 text-indigo-800',
  Señó: 'bg-amber-100 text-amber-800',
  'Pagó todo': 'bg-emerald-100 text-emerald-800',
  Asistió: 'bg-teal-100 text-teal-800',
  Canceló: 'bg-red-100 text-red-700',
  'No respondió': 'bg-stone-200 text-stone-700',
  Armando: 'bg-stone-200 text-stone-700',
  Abierta: 'bg-emerald-100 text-emerald-800',
  Llena: 'bg-amber-100 text-amber-800',
  Realizada: 'bg-teal-100 text-teal-800',
  Cancelada: 'bg-red-100 text-red-700',
}
export function Badge({ children, className }: { children: string; className?: string }) {
  return <span className={cx('inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', coloresEstado[children] ?? 'bg-stone-100 text-stone-700', className)}>{children}</span>
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-stone-500">{label}</div>
      <div className={cx('mt-1 text-2xl font-semibold tabular-nums', tone === 'good' && 'text-emerald-700', tone === 'warn' && 'text-amber-700', tone === 'bad' && 'text-red-600')}>{value}</div>
      {hint && <div className="mt-1 text-xs text-stone-500">{hint}</div>}
    </div>
  )
}

export function CupoBar({ confirmados, min, max }: { confirmados: number; min: number; max: number }) {
  const total = Math.max(max, confirmados, 1)
  const w = (confirmados / total) * 100
  const m = (min / total) * 100
  const ok = confirmados >= min
  return (
    <div>
      <div className="relative h-2.5 rounded-full bg-stone-200">
        <div className={cx('h-full rounded-full', ok ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${w}%` }} />
        <div className="absolute -top-1 h-4.5 w-0.5 bg-stone-700" style={{ left: `${m}%` }} title={`Mínimo: ${min}`} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-stone-500">
        <span>
          {confirmados}/{max} confirmados
        </span>
        <span className={ok ? 'text-emerald-700' : 'text-amber-700'}>{ok ? 'Sale ✔' : `Faltan ${min - confirmados} para el mínimo`}</span>
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-stone-500 hover:bg-stone-100" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
        {subtitle && <p className="text-stone-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">{children}</div>
}
