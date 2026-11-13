# Panel de experiencias

App web para gestionar un negocio de experiencias y viajes de punta a punta: desde que alguien ve la página hasta que la experiencia está cobrada y con los números cerrados.

## Qué tiene

| Sección | Para qué sirve |
|---|---|
| **Inicio** | El panel del día: alertas (falta link de pago, no se llega al mínimo, tareas pendientes), cobrado del mes, lo que falta cobrar, ganancia estimada, próximas fechas con su cupo, **a quién escribirle hoy**, saldos por cobrar y el embudo de ventas. |
| **Experiencias** | Cada fecha con 5 pestañas: **Ficha** (lo que se muestra y se manda), **Costos y precio** (costos fijos y por persona, precio sugerido, punto de equilibrio, tabla de ganancia según cuánta gente va, opcionales), **Participantes**, **Checklist** (antes, durante y después) y **Resultado** (gastos reales y ganancia final). |
| **Clientes** | Todos los que escribieron: estado (Consultó → Señó → Pagó todo → Asistió), pagos, fecha de seguimiento y botón de WhatsApp con el mensaje ya armado. |
| **Finanzas** | Ventas, cobrado, pendiente y ganancia por año y por experiencia, cobros por mes y lo que falta pagar a proveedores. |
| **Mensajes** | Plantillas de WhatsApp editables que se completan solas con el nombre, la fecha, el precio, la seña, los lugares libres, etc. |
| **Ajustes** | Marca, WhatsApp, Instagram, comisión de cobro, seña, reglas de cancelación, respaldo de datos. |
| **Página pública** (`/p`) | La que va en la bio de Instagram: muestra las experiencias abiertas con precio y lugares disponibles, con botón para reservar por WhatsApp y un formulario que carga al cliente directo en el panel. |

## Probarla en la computadora

```bash
npm install
```

```bash
npm run dev
```

Abrir http://localhost:5173. Sin configurar nada funciona en **modo local**: los datos quedan guardados en ese navegador y viene con datos de ejemplo. Cuando quieran arrancar en serio: **Ajustes → Borrar todo y empezar de cero**.

## Ponerla online (gratis)

Para que los datos queden en la nube, haya login y la página pública funcione para cualquiera:

### 1. Base de datos (Supabase)
1. Crear una cuenta y un proyecto en https://supabase.com.
2. En **SQL Editor**, pegar todo el contenido de `supabase/schema.sql` y darle a **Run**.
3. En **Authentication → Users → Add user**, crear el usuario de tu amigo (email y contraseña).
4. En **Authentication → Sign In / Providers**, desactivar **Allow new users to sign up** para que nadie más pueda crearse una cuenta.
5. En **Project Settings → API**, copiar la **Project URL** y la **anon public key**.

### 2. Publicar la web (Vercel)
1. Entrar a https://vercel.com con GitHub e importar este repositorio.
2. En **Environment Variables**, cargar:
   - `VITE_SUPABASE_URL` = la Project URL
   - `VITE_SUPABASE_ANON_KEY` = la anon key
3. Deploy. Queda una dirección tipo `https://nombre.vercel.app`.

### 3. Conectar todo
- Panel: `https://nombre.vercel.app` (pide login).
- Página pública: `https://nombre.vercel.app/p` → ponerla en la bio de Instagram.
- En **Ajustes**, cargar el WhatsApp del negocio (con código de país, ej. `5491123456789`).
- En cada experiencia, cargar el **link de pago** de Mercado Pago y tildar **Mostrar en la página pública**.

Si ya cargaron datos en modo local: **Ajustes → Descargar respaldo** antes, y después de conectar Supabase, **Importar respaldo**.

## Uso diario (10 minutos)
1. Abrir **Inicio** y escribirle a todos los de “Para escribir hoy” (el botón verde abre WhatsApp con el mensaje armado).
2. Cada persona nueva que escribe va a **Clientes → Nuevo cliente**, con una fecha de seguimiento.
3. Cuando alguien paga, **Registrar pago** en su ficha: el estado cambia solo.
4. Después de cada experiencia: checklist “Después” y cargar los **gastos reales** en la pestaña Resultado.

En `docs/` está la guía del sistema (reglas, mensajes, checklist) y la planilla de Excel original.

## Técnico
React + TypeScript + Vite + Tailwind. Datos en Supabase (tablas con `jsonb`, RLS para usuarios logueados; la página pública usa las funciones `catalogo_publico` y `crear_consulta`, que nunca exponen datos de clientes) o en `localStorage` si no hay variables de entorno.
