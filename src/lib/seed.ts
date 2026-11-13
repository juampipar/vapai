import type { Ajustes, ChecklistItem, Datos, Experiencia, Lead, Plantilla } from './types'
import { hoy, sumarDias, uid } from './format'

export const REGLAS_DEFAULT = `• Reserva: el lugar se guarda con una seña del {sena_pct}. Sin seña no hay lugar guardado.
• Saldo: se paga hasta {dias_saldo} días antes de la experiencia.
• Cupo mínimo: si no se llega al mínimo 5 días antes, devolvemos el 100% de la seña o te pasamos a otra fecha (vos elegís).
• Si cancelás: más de 15 días antes, devolvemos la seña o cambiás de fecha. Entre 15 y 7 días, la seña queda como crédito por 6 meses. Menos de 7 días no hay devolución, pero podés mandar a otra persona en tu lugar.
• Clima: si no se puede hacer la actividad de forma segura, reprogramamos sin costo y avisamos con 24 h.
• Fotos: sacamos fotos y videos que podemos usar en nuestras redes. Si preferís no salir, avisanos.
• Salud: cada participante declara estar en condiciones de hacer actividad física y sigue las indicaciones de los instructores.`

export const PLANTILLAS_DEFAULT: Plantilla[] = [
  {
    id: 'hola', atajo: '/hola', nombre: 'Bienvenida', cuando: 'Primer mensaje a quien escribe',
    texto: `¡Hola {nombre}! 👋 Gracias por escribirnos. En {marca} armamos experiencias para hacer cosas que no hacés todos los días, en grupos chicos.
¿Te interesa alguna fecha en particular o te cuento lo próximo que tenemos?`,
  },
  {
    id: 'info', atajo: '/info', nombre: 'Info de la experiencia', cuando: 'Cuando pregunta qué es o cuánto sale',
    texto: `🌊 *{experiencia}* – {fecha}
📍 {lugar} · 🕘 {horario}

*Incluye:* {incluye}
{opcionales}
💰 *{precio} por persona*
Reservás con una seña de {sena} y el resto hasta {dias_saldo} días antes.
👥 Grupo de {cupo_min} a {cupo_max} personas, quedan *{lugares} lugares*.

¿Te guardo uno?`,
  },
  {
    id: 'duda', atajo: '/duda', nombre: '¿Es para mí?', cuando: 'Si duda porque nunca lo hizo',
    texto: `¡Totalmente, {nombre}! La mayoría de los que vinieron nunca lo habían hecho y terminaron disfrutándolo un montón 😄 Los instructores te acompañan desde cero.
Si querés te paso fotos y lo que nos dijeron los que fueron la última vez.`,
  },
  {
    id: 'reservar', atajo: '/reservar', nombre: 'Reservar (link de seña)', cuando: 'Cuando dice que quiere ir',
    texto: `¡Buenísimo {nombre}! 🙌 Para reservar tu lugar en *{experiencia}* aboná la seña de *{sena}* acá: {link_pago}
Cuando lo tengas mandame el comprobante y te confirmo.

Te dejo las condiciones para que las tengas:
{reglas}`,
  },
  {
    id: 'confirmado', atajo: '/confirmado', nombre: 'Reserva confirmada', cuando: 'Cuando pagó la seña',
    texto: `✅ ¡Listo {nombre}! Tu lugar para *{experiencia}* el {fecha} está confirmado.
Te sumo al grupo de WhatsApp de la fecha, donde vamos a pasar toda la info.
El saldo de *{saldo}* se paga hasta el {fecha_saldo}. ¡Nos vemos! 🌊`,
  },
  {
    id: 'saldo', atajo: '/saldo', nombre: 'Recordatorio de saldo', cuando: '~10 días antes',
    texto: `¡Hola {nombre}! Falta poco para *{experiencia}* 🙌 Te recuerdo que el saldo de *{falta}* se paga hasta el {fecha_saldo}. Acá va el link: {link_pago}
¡Cualquier cosa me decís!`,
  },
  {
    id: 'seguimiento', atajo: '/seguimiento', nombre: 'Seguimiento', cuando: 'Preguntó y no respondió (2-3 días)',
    texto: `¡Hola {nombre}! ¿Pudiste ver lo de *{experiencia}*? Quedan {lugares} lugares para el {fecha}. Si tenés alguna duda te la respondo ahora 😊`,
  },
  {
    id: 'previa', atajo: '/previa', nombre: 'La previa', cuando: '2 días antes (al grupo)',
    texto: `📋 *Todo para {experiencia} – {fecha}*
🕘 Horario: {horario}
📍 Lugar: {lugar}
🎒 Traé: {llevar}
🌤 Si hay que reprogramar por clima, avisamos con 24 h.
📸 Vamos a sacar fotos y videos; si no querés salir, avisanos.
Etiquetanos en lo que subas: {instagram} 🙌`,
  },
  {
    id: 'gracias', atajo: '/gracias', nombre: 'Gracias + testimonio', cuando: 'El día después',
    texto: `¡Gracias por venir, {nombre}! 🙌 Ahora te pasamos las fotos y videos del día.
Una pregunta rápida: *¿qué fue lo que más te gustó?* Con un audio cortito alcanza, nos ayuda un montón 💛
Y si la próxima traés a alguien, los dos tienen {descuento} de descuento 😉`,
  },
  {
    id: 'nueva', atajo: '/nueva', nombre: 'Nueva fecha', cuando: 'A los que ya fueron o no respondieron',
    texto: `¡Hola {nombre}! Abrimos nueva fecha: *{experiencia}* el {fecha} 🌊 Te aviso antes que a nadie. Hay {lugares} lugares. ¿Te guardo uno?`,
  },
]

export const checklistDefault = (): ChecklistItem[] =>
  [
    ['2 semanas antes', 'Confirmar fecha y precio con todos los proveedores'],
    ['2 semanas antes', 'Revisar si se llega al cupo mínimo; si no, publicar más y escribir a los que no respondieron'],
    ['2 semanas antes', 'Contratar / confirmar seguro de accidentes del grupo'],
    ['7 días antes', 'Todos los saldos cobrados'],
    ['7 días antes', 'Mandar lista final de participantes a cada proveedor'],
    ['7 días antes', 'Crear grupo de WhatsApp de la fecha'],
    ['2 días antes', 'Mandar mensaje de "La previa" al grupo'],
    ['2 días antes', 'Revisar pronóstico del clima'],
    ['El día', 'Llevar cartel / QR con el Instagram'],
    ['El día', 'Fotos y videos de gente haciendo la actividad'],
    ['El día', 'Foto grupal y pedir que nos etiqueten'],
    ['El día', 'Grabar 2-3 testimonios cortos'],
    ['Después', 'Mandar fotos + pedir testimonio (mensaje "Gracias")'],
    ['Después', 'Marcar a todos como "Asistió"'],
    ['Después', 'Cargar los gastos reales'],
    ['Después', 'Charla de 10 min: qué salió bien y qué cambiar'],
  ].map(([etapa, texto]) => ({ id: uid(), etapa, texto, hecho: false }))

export const ajustesDefault = (): Ajustes => ({
  id: 'ajustes',
  marca: 'Nombre de la marca',
  lema: 'Viajes y experiencias de los que volvés sabiendo hacer algo',
  whatsapp: '',
  instagram: '@tu_usuario',
  comision: 0.065,
  senaPct: 30,
  diasSaldo: 7,
  descuentoAmigo: 10,
  reglas: REGLAS_DEFAULT,
  mpActivo: false,
  plantillas: PLANTILLAS_DEFAULT,
})

export function nuevaExperiencia(aj: Ajustes): Experiencia {
  return {
    id: uid(), nombre: 'Nueva experiencia', fecha: sumarDias(hoy(), 30), lugar: '', horario: '', descripcion: '',
    incluye: '', llevar: '', imagen: '', estado: 'Armando', publica: false, cupoMin: 8, cupoMax: 14,
    costosFijos: [{ id: uid(), nombre: 'Guía / instructor', monto: 0 }],
    costosVariables: [{ id: uid(), nombre: 'Actividad por persona', monto: 0 }],
    margen: 0.3, redondeo: 5000, precio: null, senaPct: aj.senaPct, linkPago: '', opcionales: [],
    checklist: checklistDefault(), creado: hoy(),
  }
}

export function datosDemo(): Datos {
  const aj = ajustesDefault()
  const base = {
    descripcion: 'Un día para salir de la rutina: arrancás con adrenalina arriba de la tabla y cerrás con yoga frente al agua.',
    lugar: 'Completar lugar', horario: '9:00 a 17:00',
    incluye: 'traslado ida y vuelta, sesión de wake con instructor (no hace falta experiencia), clase de yoga, almuerzo, fotos y video del día y seguro',
    llevar: 'malla, toalla, protector solar, ropa cómoda para yoga y muda de ropa',
    imagen: '', cupoMin: 8, cupoMax: 14, margen: 0.3, redondeo: 5000, precio: null, senaPct: 30, linkPago: '',
    costosFijos: [
      { id: uid(), nombre: 'Profe de yoga', monto: 60000 },
      { id: uid(), nombre: 'Traslado / combi', monto: 120000 },
      { id: uid(), nombre: 'Fotógrafo / video', monto: 50000 },
    ],
    costosVariables: [
      { id: uid(), nombre: 'Sesión de wake', monto: 35000 },
      { id: uid(), nombre: 'Comida y bebida', monto: 15000 },
      { id: uid(), nombre: 'Seguro de accidentes', monto: 3000 },
      { id: uid(), nombre: 'Kit / regalo', monto: 5000 },
    ],
    opcionales: [{ id: uid(), nombre: 'Sesión extra de wake', costo: 35000, precio: 48000 }],
  }
  const pasada: Experiencia = {
    ...base, id: uid(), nombre: 'Wake + Yoga (1ª edición)', fecha: sumarDias(hoy(), -20), estado: 'Realizada', publica: false,
    checklist: checklistDefault().map((c) => ({ ...c, hecho: true })), creado: sumarDias(hoy(), -50),
    costosFijos: base.costosFijos.map((c) => ({ ...c, id: uid() })), costosVariables: base.costosVariables.map((c) => ({ ...c, id: uid() })),
  }
  const proxima: Experiencia = {
    ...base, id: uid(), nombre: 'Wake + Yoga', fecha: sumarDias(hoy(), 23), estado: 'Abierta', publica: true,
    checklist: checklistDefault(), creado: hoy(),
  }
  const surf: Experiencia = {
    ...nuevaExperiencia(aj), nombre: 'Aprendé a surfear (fin de semana)', fecha: sumarDias(hoy(), 60), lugar: 'Costa atlántica',
    horario: 'Sábado y domingo', estado: 'Armando',
    descripcion: 'Dos días de surf con instructor para que realmente te pares en la tabla, más una noche de fogón.',
    incluye: 'alojamiento 1 noche, 4 clases de surf con tabla y traje, desayuno y cena, fotos, seguro',
    llevar: 'malla, toalla, abrigo para la noche', cupoMin: 6, cupoMax: 10,
    costosFijos: [{ id: uid(), nombre: 'Instructor de surf (2 días)', monto: 200000 }, { id: uid(), nombre: 'Traslado', monto: 250000 }],
    costosVariables: [{ id: uid(), nombre: 'Alojamiento', monto: 45000 }, { id: uid(), nombre: 'Alquiler tabla y traje', monto: 30000 }, { id: uid(), nombre: 'Comidas', monto: 40000 }],
  }
  const n = (nombre: string, exp: Experiencia, estado: Lead['estado'], pagos: number[], extra: Partial<Lead> = {}): Lead => ({
    id: uid(), creado: sumarDias(hoy(), -Math.floor(Math.random() * 15) - 1), nombre, whatsapp: '5491100000000', instagram: '',
    email: '', experienciaId: exp.id, origen: 'Instagram', estado, precio: null, aceptaFotos: true, proximoContacto: '', notas: '',
    pagos: pagos.map((monto, i) => ({ id: uid(), fecha: sumarDias(hoy(), -10 + i), monto, concepto: i === 0 ? 'Seña' : 'Saldo', medio: 'Mercado Pago' })),
    ...extra,
  })
  const leads: Lead[] = [
    ...['Ejemplo: Sofía', 'Ejemplo: Martín', 'Ejemplo: Lucía', 'Ejemplo: Tomás', 'Ejemplo: Valen', 'Ejemplo: Juli', 'Ejemplo: Nico', 'Ejemplo: Caro', 'Ejemplo: Fran'].map(
      (x) => n(x, pasada, 'Asistió', [42000, 98000]),
    ),
    n('Ejemplo: Agus', proxima, 'Pagó todo', [42000, 98000], { origen: 'Amigo que fue' }),
    n('Ejemplo: Meli', proxima, 'Señó', [42000], { origen: 'Historia de un participante' }),
    n('Ejemplo: Pedro', proxima, 'Señó', [42000]),
    n('Ejemplo: Flor', proxima, 'Interesado', [], { proximoContacto: hoy(), notas: 'Pregunta si puede ir con su hermana' }),
    n('Ejemplo: Joaco', proxima, 'Consultó', [], { proximoContacto: sumarDias(hoy(), -1) }),
    n('Ejemplo: Rocío', surf, 'Interesado', [], { proximoContacto: sumarDias(hoy(), 3), origen: 'Página web' }),
  ]
  return {
    experiencias: [proxima, surf, pasada],
    leads,
    gastos: [
      { id: uid(), experienciaId: pasada.id, fecha: pasada.fecha, concepto: 'Profe de yoga', monto: 60000, pagado: true },
      { id: uid(), experienciaId: pasada.id, fecha: pasada.fecha, concepto: 'Combi', monto: 130000, pagado: true },
      { id: uid(), experienciaId: pasada.id, fecha: pasada.fecha, concepto: 'Wake (9 personas)', monto: 315000, pagado: true },
      { id: uid(), experienciaId: pasada.id, fecha: pasada.fecha, concepto: 'Almuerzo', monto: 140000, pagado: true },
    ],
    ajustes: aj,
  }
}
