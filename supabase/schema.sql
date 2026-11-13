-- Ejecutar una sola vez en Supabase: SQL Editor > New query > pegar todo > Run.

create table if not exists experiencias (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists leads        (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists gastos       (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists ajustes      (id text primary key, data jsonb not null, updated_at timestamptz default now());

alter table experiencias enable row level security;
alter table leads        enable row level security;
alter table gastos       enable row level security;
alter table ajustes      enable row level security;

-- Solo usuarios logueados (el dueño del negocio) pueden leer y escribir todo.
-- Creá el usuario en Authentication > Users > Add user, y desactivá "Allow new users to sign up".
do $$
declare t text;
begin
  foreach t in array array['experiencias','leads','gastos','ajustes'] loop
    execute format('drop policy if exists "panel" on %I', t);
    execute format('create policy "panel" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Página pública: devuelve solo las experiencias publicadas, con la cantidad de confirmados
-- (nunca los datos de los clientes) y los datos públicos del negocio.
create or replace function catalogo_publico()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'ajustes', (
      select json_build_object(
        'marca', a.data->>'marca', 'lema', a.data->>'lema', 'whatsapp', a.data->>'whatsapp',
        'instagram', a.data->>'instagram', 'reglas', a.data->>'reglas',
        'senaPct', coalesce((a.data->>'senaPct')::numeric, 30), 'diasSaldo', coalesce((a.data->>'diasSaldo')::numeric, 7),
        'comision', coalesce((a.data->>'comision')::numeric, 0), 'mpActivo', coalesce((a.data->>'mpActivo')::boolean, false), 'descuentoAmigo', coalesce((a.data->>'descuentoAmigo')::numeric, 0))
      from ajustes a where a.id = 'ajustes'
    ),
    'experiencias', coalesce((
      select json_agg(
        (e.data - 'costosFijos' - 'costosVariables' - 'checklist' - 'linkPago')
        || jsonb_build_object(
          'confirmados', (select count(*) from leads l where l.data->>'experienciaId' = e.id and l.data->>'estado' in ('Señó','Pagó todo','Asistió')),
          -- se mandan solo los totales de costos para que la página pueda calcular el precio sugerido
          'costosFijos', jsonb_build_array(jsonb_build_object('id','f','nombre','','monto', (select coalesce(sum((x->>'monto')::numeric),0) from jsonb_array_elements(e.data->'costosFijos') x))),
          'costosVariables', jsonb_build_array(jsonb_build_object('id','v','nombre','','monto', (select coalesce(sum((x->>'monto')::numeric),0) from jsonb_array_elements(e.data->'costosVariables') x))),
          'checklist', '[]'::jsonb, 'linkPago', ''
        )
      )
      from experiencias e
      where (e.data->>'publica')::boolean and e.data->>'estado' in ('Abierta','Llena')
    ), '[]'::json)
  );
$$;

-- Formulario "Dejar mis datos" de la página pública: crea el cliente en estado "Consultó".
create or replace function crear_consulta(p_nombre text, p_whatsapp text, p_email text, p_experiencia text, p_notas text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare nid text := gen_random_uuid()::text;
begin
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_whatsapp), '') = '' then
    raise exception 'Faltan datos';
  end if;
  insert into leads (id, data) values (nid, jsonb_build_object(
    'id', nid, 'creado', to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD'),
    'nombre', left(p_nombre, 120), 'whatsapp', left(p_whatsapp, 40), 'instagram', '', 'email', left(coalesce(p_email,''), 120),
    'experienciaId', coalesce(p_experiencia, ''), 'origen', 'Página web', 'estado', 'Consultó', 'precio', null,
    'pagos', '[]'::jsonb, 'aceptaFotos', true,
    'proximoContacto', to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD'),
    'notas', left(coalesce(p_notas,''), 1000)));
end $$;

revoke all on function catalogo_publico() from public;
revoke all on function crear_consulta(text, text, text, text, text) from public;
grant execute on function catalogo_publico() to anon, authenticated;
grant execute on function crear_consulta(text, text, text, text, text) to anon, authenticated;
