-- Fase 2: Billing con Wompi (one-time checkout + recordatorios)
-- Convención: price_cop es el precio en pesos colombianos enteros.
-- Para Wompi: amountInCents = price_cop * 100 (1 COP = 100 wompi cents).

-- ─── subscription_plans: agregar price_cop, deprecar price_cents ─────
alter table public.subscription_plans
  add column if not exists price_cop integer not null default 0;

-- Backfill desde valores existentes (los valores demo eran muy bajos; se actualizan abajo).
update public.subscription_plans set price_cop = price_cents where price_cop = 0;

-- Precios realistas para PYMES colombianas (ajustar via Studio).
update public.subscription_plans set price_cop = 0 where code = 'starter';
update public.subscription_plans set price_cop = 49000 where code = 'team';
update public.subscription_plans set price_cop = 149000 where code = 'business';
update public.subscription_plans set price_cop = 0 where code = 'enterprise';

comment on column public.subscription_plans.price_cents is 'DEPRECADO: usar price_cop. Mantenida por compatibilidad.';
comment on column public.subscription_plans.price_cop is 'Precio mensual en pesos colombianos enteros (sin centavos).';

-- ─── trigger reusable para updated_at ────────────────────────────────
create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── tabla subscriptions ─────────────────────────────────────────────
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  wompi_customer_id text,
  wompi_payment_source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_tenant_id_idx on public.subscriptions(tenant_id);
create index subscriptions_status_idx on public.subscriptions(status);
create index subscriptions_period_end_idx on public.subscriptions(current_period_end)
  where status in ('active', 'trialing');

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function app_private.set_updated_at();

-- ─── tabla payment_events (bitácora idempotente de webhooks) ─────────
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  wompi_transaction_id text,
  wompi_event_type text not null,
  signature_checksum text not null unique,
  amount_in_cents bigint,
  status text,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index payment_events_subscription_id_idx on public.payment_events(subscription_id);
create index payment_events_tenant_id_idx on public.payment_events(tenant_id);
create index payment_events_transaction_id_idx on public.payment_events(wompi_transaction_id);

-- ─── RLS ─────────────────────────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;

create policy "members can read their subscription"
on public.subscriptions
for select
to authenticated
using (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin());

create policy "members can read their payment events"
on public.payment_events
for select
to authenticated
using (
  tenant_id is not null
  and (app_private.is_tenant_member(tenant_id) or app_private.is_platform_admin())
);

-- Sin políticas insert/update/delete: solo service_role (admin client) escribe.

-- ─── Backfill subscriptions para tenants existentes ──────────────────
-- Cada tenant existente arranca trial de 14 días con su plan actual o starter.
insert into public.subscriptions (tenant_id, plan_id, status, trial_ends_at)
select
  t.id,
  coalesce(t.subscription_plan_id, (select id from public.subscription_plans where code = 'starter')),
  'trialing',
  now() + interval '14 days'
from public.tenants t
where not exists (
  select 1 from public.subscriptions s where s.tenant_id = t.id
);
