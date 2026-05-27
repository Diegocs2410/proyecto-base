-- Fase 6: módulo "Agenda / citas"
-- Esta migración pertenece al módulo agenda (src/modules/agenda/).
-- Tablas: servicios, recursos, recurso_horarios, citas, cita_recordatorios.

-- ─── servicios ───────────────────────────────────────────────────────
create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nombre text not null check (length(nombre) between 1 and 120),
  descripcion text check (descripcion is null or length(descripcion) <= 1000),
  duracion_min integer not null check (duracion_min between 5 and 600),
  precio_cop integer not null default 0 check (precio_cop >= 0),
  color text not null default '#3b82f6',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index servicios_tenant_id_idx on public.servicios(tenant_id) where activo = true;

create trigger servicios_updated_at
  before update on public.servicios
  for each row
  execute function app_private.set_updated_at();

-- ─── recursos (personas, salas, sillas, etc.) ────────────────────────
create table public.recursos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nombre text not null check (length(nombre) between 1 and 120),
  tipo text not null default 'persona'
    check (tipo in ('persona', 'espacio', 'equipo')),
  color text not null default '#22c55e',
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recursos_tenant_id_idx on public.recursos(tenant_id) where activo = true;

create trigger recursos_updated_at
  before update on public.recursos
  for each row
  execute function app_private.set_updated_at();

-- ─── horarios semanales por recurso ──────────────────────────────────
-- dia_semana: 0=domingo, 1=lunes, ..., 6=sábado (compatible con JS Date.getDay()).
create table public.recurso_horarios (
  id uuid primary key default gen_random_uuid(),
  recurso_id uuid not null references public.recursos(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  created_at timestamptz not null default now(),
  check (hora_fin > hora_inicio),
  unique (recurso_id, dia_semana, hora_inicio)
);

create index recurso_horarios_recurso_id_idx on public.recurso_horarios(recurso_id);

-- ─── citas ───────────────────────────────────────────────────────────
create table public.citas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  servicio_id uuid not null references public.servicios(id) on delete restrict,
  recurso_id uuid not null references public.recursos(id) on delete restrict,
  cliente_nombre text not null check (length(cliente_nombre) between 1 and 120),
  cliente_telefono text check (cliente_telefono is null or length(cliente_telefono) <= 30),
  cliente_email text check (cliente_email is null or cliente_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  inicia_en timestamptz not null,
  termina_en timestamptz not null,
  estado text not null default 'confirmada'
    check (estado in ('confirmada', 'completada', 'no_asistio', 'cancelada')),
  origen text not null default 'interno'
    check (origen in ('interno', 'publico')),
  notas text check (notas is null or length(notas) <= 2000),
  creada_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (termina_en > inicia_en)
);

create index citas_tenant_inicia_idx on public.citas(tenant_id, inicia_en);
create index citas_recurso_inicia_idx on public.citas(recurso_id, inicia_en);
create index citas_estado_idx on public.citas(tenant_id, estado);

create trigger citas_updated_at
  before update on public.citas
  for each row
  execute function app_private.set_updated_at();

-- ─── cita_recordatorios (bitácora idempotente) ───────────────────────
create table public.cita_recordatorios (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null references public.citas(id) on delete cascade,
  tipo text not null check (tipo in ('24h', '1h')),
  canal text not null default 'log'
    check (canal in ('log', 'email', 'whatsapp')),
  programado_para timestamptz not null,
  enviado_en timestamptz,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'enviado', 'fallido')),
  error text,
  created_at timestamptz not null default now(),
  unique (cita_id, tipo)
);

create index cita_recordatorios_pendientes_idx
  on public.cita_recordatorios(programado_para)
  where estado = 'pendiente';

-- ─── RLS ─────────────────────────────────────────────────────────────
alter table public.servicios enable row level security;
alter table public.recursos enable row level security;
alter table public.recurso_horarios enable row level security;
alter table public.citas enable row level security;
alter table public.cita_recordatorios enable row level security;

create policy "members read servicios"
  on public.servicios for select to authenticated
  using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members write servicios"
  on public.servicios for all to authenticated
  using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin())
  with check (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members read recursos"
  on public.recursos for select to authenticated
  using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members write recursos"
  on public.recursos for all to authenticated
  using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin())
  with check (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members read horarios"
  on public.recurso_horarios for select to authenticated
  using (exists (
    select 1 from public.recursos r
    where r.id = recurso_id
      and (app_private.is_tenant_member(r.tenant_id) or app_private.is_platform_admin())
  ));

create policy "members write horarios"
  on public.recurso_horarios for all to authenticated
  using (exists (
    select 1 from public.recursos r
    where r.id = recurso_id
      and (app_private.is_tenant_member(r.tenant_id) or app_private.is_platform_admin())
  ))
  with check (exists (
    select 1 from public.recursos r
    where r.id = recurso_id
      and (app_private.is_tenant_member(r.tenant_id) or app_private.is_platform_admin())
  ));

create policy "members read citas"
  on public.citas for select to authenticated
  using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members write citas"
  on public.citas for all to authenticated
  using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin())
  with check (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members read recordatorios"
  on public.cita_recordatorios for select to authenticated
  using (exists (
    select 1 from public.citas c
    where c.id = cita_id
      and (app_private.is_tenant_member(c.tenant_id) or app_private.is_platform_admin())
  ));

-- Las reservas públicas (POST /reservar/[slug]) usan service_role (admin client),
-- así que no se requieren policies anon. Igualmente, inserts/updates de
-- cita_recordatorios solo los hace el job server-side via service_role.
