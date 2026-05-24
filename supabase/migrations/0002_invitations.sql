create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('tenant_admin', 'member', 'viewer')),
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create index invitations_tenant_id_idx on public.invitations(tenant_id);
create index invitations_token_idx on public.invitations(token);

alter table public.invitations enable row level security;

create policy "members can read invitations of their tenant"
on public.invitations
for select
to authenticated
using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "tenant admins can create invitations"
on public.invitations
for insert
to authenticated
with check (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "tenant admins can update invitations"
on public.invitations
for update
to authenticated
using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());
