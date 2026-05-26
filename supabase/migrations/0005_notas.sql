-- Fase 4: módulo demo "Notas internas"
-- Esta tabla pertenece al módulo notas (src/modules/notas/).
-- Convención: las migraciones de módulos también van en supabase/migrations/
-- con prefijo numérico para mantener orden global.

create table public.notas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index notas_tenant_id_created_at_idx
  on public.notas(tenant_id, created_at desc);

alter table public.notas enable row level security;

create policy "members read tenant notas"
  on public.notas for select to authenticated
  using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members insert tenant notas"
  on public.notas for insert to authenticated
  with check (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "users delete their own notas"
  on public.notas for delete to authenticated
  using (created_by = auth.uid() or app_private.is_platform_admin());
