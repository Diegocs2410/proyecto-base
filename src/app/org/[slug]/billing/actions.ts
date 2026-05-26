"use server";

import { requirePermission, esFalla } from "@/lib/security/require";
import { logAudit } from "@/lib/audit/log";
import { construirUrlCheckout } from "@/lib/payments/wompi/checkout";
import { isWompiConfigured } from "@/lib/payments/wompi/client";
import { getAppUrl } from "@/lib/email/client";

export interface IniciarUpgradeParams {
  tenantId: string;
  slug: string;
  planId: string;
}

export type IniciarUpgradeResult = { error: string } | { url: string };

export async function iniciarUpgrade(params: IniciarUpgradeParams): Promise<IniciarUpgradeResult> {
  if (!isWompiConfigured()) {
    return {
      error:
        "Wompi no está configurado en este servidor. Pide al administrador que configure las claves.",
    };
  }

  const resultado = await requirePermission(params.tenantId, "billing.manage");
  if (esFalla(resultado)) return resultado;
  const { user, admin } = resultado;

  const { data: plan } = await admin
    .from("subscription_plans")
    .select("id, code, name, price_cop")
    .eq("id", params.planId)
    .eq("is_active", true)
    .maybeSingle();

  if (!plan) return { error: "Plan no disponible." };

  if (plan.price_cop <= 0) {
    return {
      error: "Ese plan no se puede contratar directamente. Contacta a ventas.",
    };
  }

  const checkout = construirUrlCheckout({
    tenantId: params.tenantId,
    planId: plan.id,
    planCode: plan.code,
    priceCop: plan.price_cop,
    emailCliente: user.email ?? "",
    nombreCliente: (user.user_metadata?.nombre_completo as string | undefined) ?? undefined,
    redirectUrl: `${getAppUrl()}/org/${params.slug}/billing?pago=procesando`,
  });

  await logAudit(
    {
      tenantId: params.tenantId,
      actorUserId: user.id,
      action: "iniciar_upgrade",
      entityType: "subscription",
      metadata: { plan: plan.code, reference: checkout.reference },
    },
    admin,
  );

  return { url: checkout.url };
}

export async function cancelarSuscripcion(tenantId: string): Promise<{ error?: string; ok?: true }> {
  const resultado = await requirePermission(tenantId, "billing.manage");
  if (esFalla(resultado)) return resultado;
  const { user, admin } = resultado;

  const { error } = await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("tenant_id", tenantId);

  if (error) return { error: "No se pudo cancelar la suscripción. Intenta de nuevo." };

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "cancelar_suscripcion",
      entityType: "subscription",
    },
    admin,
  );

  return { ok: true };
}

export async function reactivarSuscripcion(tenantId: string): Promise<{ error?: string; ok?: true }> {
  const resultado = await requirePermission(tenantId, "billing.manage");
  if (esFalla(resultado)) return resultado;
  const { user, admin } = resultado;

  const { error } = await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: false })
    .eq("tenant_id", tenantId);

  if (error) return { error: "No se pudo reactivar la suscripción." };

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "reactivar_suscripcion",
      entityType: "subscription",
    },
    admin,
  );

  return { ok: true };
}
