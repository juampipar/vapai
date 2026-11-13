export type Linea = { id: string; nombre: string; monto: number }
export type Opcional = { id: string; nombre: string; costo: number; precio: number }
export type ChecklistItem = { id: string; texto: string; hecho: boolean; etapa: string }

export type EstadoExperiencia = 'Armando' | 'Abierta' | 'Llena' | 'Realizada' | 'Cancelada'

export interface Experiencia {
  id: string
  nombre: string
  fecha: string // YYYY-MM-DD
  lugar: string
  horario: string
  descripcion: string
  incluye: string
  llevar: string
  imagen: string
  estado: EstadoExperiencia
  publica: boolean
  cupoMin: number
  cupoMax: number
  costosFijos: Linea[]
  costosVariables: Linea[]
  margen: number // 0.3 = 30 %
  redondeo: number
  precio: number | null // null = usar el sugerido
  senaPct: number
  linkPago: string
  opcionales: Opcional[]
  checklist: ChecklistItem[]
  creado: string
}

export const ESTADOS_LEAD = ['Consultó', 'Interesado', 'Señó', 'Pagó todo', 'Asistió', 'Canceló', 'No respondió'] as const
export type EstadoLead = (typeof ESTADOS_LEAD)[number]
export const ESTADOS_CONFIRMADOS: EstadoLead[] = ['Señó', 'Pagó todo', 'Asistió']
export const ESTADOS_ABIERTOS: EstadoLead[] = ['Consultó', 'Interesado', 'No respondió']

export const ORIGENES = ['Instagram', 'Página web', 'Amigo que fue', 'Historia de un participante', 'Recomendación', 'Otro'] as const

export type Pago = { id: string; fecha: string; monto: number; concepto: 'Seña' | 'Saldo' | 'Opcional' | 'Otro'; medio: string }

export interface Lead {
  id: string
  creado: string
  nombre: string
  whatsapp: string
  instagram: string
  email: string
  experienciaId: string
  origen: string
  estado: EstadoLead
  precio: number | null // total acordado; null = precio de la experiencia
  pagos: Pago[]
  aceptaFotos: boolean
  proximoContacto: string
  notas: string
}

export interface Gasto {
  id: string
  experienciaId: string
  fecha: string
  concepto: string
  monto: number
  pagado: boolean
}

export interface Plantilla {
  id: string
  atajo: string
  nombre: string
  cuando: string
  texto: string
}

export interface Ajustes {
  id: 'ajustes'
  marca: string
  lema: string
  whatsapp: string // solo números, con código de país: 5491100000000
  instagram: string
  comision: number
  senaPct: number
  diasSaldo: number
  descuentoAmigo: number
  reglas: string
  plantillas: Plantilla[]
}

export interface Datos {
  experiencias: Experiencia[]
  leads: Lead[]
  gastos: Gasto[]
  ajustes: Ajustes
}

export type Tabla = 'experiencias' | 'leads' | 'gastos'
