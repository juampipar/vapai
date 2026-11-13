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

### 4. Cobro automático con Mercado Pago (opcional, recomendado)

Con esto, la gente reserva pagando la seña desde la página pública y **el lugar se confirma solo**. Desde el panel también se crean links de pago por la seña o el saldo de cualquier cliente, que se registran solos al pagarse.

1. Entrar a https://www.mercadopago.com.ar/developers/panel/app y crear una aplicación (tipo **Pagos online**, producto **Checkout Pro**).
2. En **Credenciales de producción**, copiar el **Access Token** (empieza con `APP_USR-`). Para probar sin plata real, usar primero las credenciales de prueba.
3. En **Webhooks → Configurar notificaciones**:
   - URL de producción: `https://nombre.vercel.app/api/mp-webhook`
   - Evento: **Pagos**
   - Guardar y copiar la **clave secreta** que muestra.
4. En Supabase, **Project Settings → API**, copiar la **service_role key** (es secreta: solo va en Vercel, nunca en la página).
5. En Vercel → **Settings → Environment Variables**, agregar y volver a hacer deploy:
   - `MP_ACCESS_TOKEN` = el Access Token
   - `MP_WEBHOOK_SECRET` = la clave secreta del webhook
   - `SUPABASE_SERVICE_ROLE_KEY` = la service_role key
6. Si ya habían corrido `supabase/schema.sql` antes, correrlo de nuevo (agrega el dato de Mercado Pago a la página pública).
7. En el panel: **Ajustes → Cobro automático con Mercado Pago → Probar conexión**, tildar **Activar** y **Guardar**.

Cómo funciona:
- **Página pública:** botón “Reservar y pagar seña”. La persona deja nombre y WhatsApp, paga en Mercado Pago y vuelve a la página con un mensaje de confirmación. En el panel aparece como **Señó**, con el pago cargado. Si abandona el pago, queda como **Interesado**, con seguimiento para el día siguiente.
- **Panel:** en el botón de WhatsApp de cada cliente aparece **Crear link de pago**. Calcula solo si corresponde la seña o el saldo y lo mete en el mensaje. Al pagarse, el cliente pasa a **Pagó todo**.
- El monto siempre lo calcula el servidor con el precio guardado. Si el cupo se llena, la experiencia pasa a **Llena** y se deja de poder reservar.
- La comisión de Mercado Pago depende del plazo de acreditación elegido en la cuenta. Cargar la tasa real en Ajustes para que las ganancias den bien.

Si ya cargaron datos en modo local: **Ajustes → Descargar respaldo** antes, y después de conectar Supabase, **Importar respaldo**.

## Uso diario (10 minutos)
1. Abrir **Inicio** y escribirle a todos los de “Para escribir hoy” (el botón verde abre WhatsApp con el mensaje armado).
2. Cada persona nueva que escribe va a **Clientes → Nuevo cliente**, con una fecha de seguimiento.
3. Cuando alguien paga, **Registrar pago** en su ficha: el estado cambia solo.
4. Después de cada experiencia: checklist “Después” y cargar los **gastos reales** en la pestaña Resultado.

En `docs/` está la guía del sistema (reglas, mensajes, checklist) y la planilla de Excel original.

## Técnico
React + TypeScript + Vite + Tailwind. Funciones del servidor en `api/` (Vercel): `reservar` (página pública → preferencia de Checkout Pro), `link-pago` (panel, requiere login), `mp-webhook` (recibe la notificación, valida la firma, consulta el pago en la API de Mercado Pago y lo registra de forma idempotente) y `mp-estado`. Datos en Supabase (tablas con `jsonb`, RLS para usuarios logueados; la página pública usa las funciones `catalogo_publico` y `crear_consulta`, que nunca exponen datos de clientes) o en `localStorage` si no hay variables de entorno.
