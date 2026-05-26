import { createAdminClient } from "@/lib/supabase/admin";

export interface PlanInfo {
  id: string;
  code: string;
  name: string;
  priceCop: number;
  maxUsers: number;
  maxWorkspaces: number;
}

export interface SubscriptionInfo {
  id: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  planId: string;
  planCode: string;
  planName: string;
  priceCop: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface PaymentEventInfo {
  id: string;
  fecha: string;
  monto: number;
  estado: string;
  tipo: string;
  transactionId: string | null;
}

export async function getPlanesActivos(): Promise<PlanInfo[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscription_plans")
    .select("id, code, name, price_cop, max_users, max_workspaces")
    .eq("is_active", true)
    .order("price_cop", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    priceCop: p.price_cop,
    maxUsers: p.max_users,
    maxWorkspaces: p.max_workspaces,
  }));
}

export async function getSubscription(tenantId: string): Promise<SubscriptionInfo | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select(
      "id, status, plan_id, trial_ends_at, current_period_end, cancel_at_period_end, plan:subscription_plans!plan_id(code, name, price_cop)",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!data) return null;

  const plan = Array.isArray(data.plan) ? data.plan[0] : data.plan;
  if (!plan) return null;

  return {
    id: data.id,
    status: data.status as SubscriptionInfo["status"],
    planId: data.plan_id,
    planCode: plan.code,
    planName: plan.name,
    priceCop: plan.price_cop,
    trialEndsAt: data.trial_ends_at,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
}

export async function getHistorialPagos(tenantId: string, limite = 20): Promise<PaymentEventInfo[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("payment_events")
    .select("id, created_at, amount_in_cents, status, wompi_event_type, wompi_transaction_id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limite);

  return (data ?? []).map((e) => ({
    id: e.id,
    fecha: e.created_at,
    monto: Math.round((e.amount_in_cents ?? 0) / 100),
    estado: e.status ?? "—",
    tipo: e.wompi_event_type,
    transactionId: e.wompi_transaction_id,
  }));
}
