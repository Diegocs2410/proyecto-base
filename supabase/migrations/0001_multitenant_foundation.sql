create schema if not exists app_private;

create extension if not exists pgcrypto;

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  max_users integer not null default 5,
  max_workspaces integer not null default 1,
  price_cents integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tenant_type text not null check (tenant_type in ('small_business', 'mid_market', 'enterprise', 'partner', 'internal_demo')),
  subscription_plan_id uuid references public.subscription_plans(id),
  status text not null default 'active' check (status in ('active', 'trialing', 'suspended', 'archived')),
  primary_color text not null default '#4f46e5',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  timezone text not null default 'UTC',
  locale text not null default 'es',
  security_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_features (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, feature_key)
);

create table public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('platform_admin', 'tenant_owner', 'tenant_admin', 'member', 'viewer')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text not null,
  code text not null,
  scope text not null check (scope in ('platform', 'tenant', 'workspace')),
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index tenants_subscription_plan_id_idx on public.tenants(subscription_plan_id);
create index tenant_users_user_id_idx on public.tenant_users(user_id);
create index tenant_users_tenant_id_idx on public.tenant_users(tenant_id);
create index tenant_features_tenant_id_idx on public.tenant_features(tenant_id);
create index audit_logs_tenant_id_created_at_idx on public.audit_logs(tenant_id, created_at desc);

create or replace function app_private.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_users tu
    where tu.tenant_id = target_tenant_id
      and tu.user_id = auth.uid()
      and tu.status = 'active'
  );
$$;

create or replace function app_private.is_platform_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.role = 'platform_admin'
      and tu.status = 'active'
  );
$$;

grant usage on schema app_private to authenticated;
grant execute on function app_private.is_tenant_member(uuid) to authenticated;
grant execute on function app_private.is_platform_admin() to authenticated;

alter table public.subscription_plans enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.tenant_features enable row level security;
alter table public.tenant_users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_logs enable row level security;

create policy "authenticated can read active plans"
on public.subscription_plans
for select
to authenticated
using (is_active = true);

create policy "members can read their tenants"
on public.tenants
for select
to authenticated
using (app_private.is_tenant_member(id) or app_private.is_platform_admin());

create policy "members can read tenant settings"
on public.tenant_settings
for select
to authenticated
using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members can read tenant features"
on public.tenant_features
for select
to authenticated
using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members can read tenant memberships"
on public.tenant_users
for select
to authenticated
using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members can read tenant roles"
on public.roles
for select
to authenticated
using (tenant_id is null or app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "authenticated can read permissions"
on public.permissions
for select
to authenticated
using (true);

create policy "members can read role permissions"
on public.role_permissions
for select
to authenticated
using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and (r.tenant_id is null or app_private.is_tenant_member(r.tenant_id) or app_private.is_platform_admin())
  )
);

create policy "members can read tenant audit logs"
on public.audit_logs
for select
to authenticated
using (tenant_id is not null and (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin()));

insert into public.subscription_plans (name, code, max_users, max_workspaces, price_cents)
values
  ('Starter', 'starter', 5, 1, 0),
  ('Team', 'team', 25, 5, 2900),
  ('Business', 'business', 100, 25, 9900),
  ('Enterprise', 'enterprise', 1000, 250, 0)
on conflict (code) do nothing;
