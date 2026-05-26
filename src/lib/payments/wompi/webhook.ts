import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { getWompiConfig } from "./client";
import { parsearReference } from "./checkout";
import { verificarFirmaWebhook, type WompiWebhookPayload } from "./signature";

export type ResultadoWebhook =
  | { ok: true; status: "ignorado"; razon: string }
  | { ok: true; status: "duplicado" }
  | { ok: true; status: "procesado"; subscriptionId: string }
  | { ok: false; codigoHttp: number; error: string };

/**
 * Procesa un evento de Wompi:
 * 1. Verifica firma HMAC contra events_secret.
 * 2. Dedupe por signature.checksum (unique constraint en payment_events).
 * 3. Si transaction APPROVED → activar/extender subscription, marcar period_end.
 * 4. Si DECLINED/VOIDED/ERROR → registrar payment_event pero no tocar status.
 */
export async function procesarWebhook(payload: WompiWebhookPayload): Promise<ResultadoWebhook> {
  const cfg = getWompiConfig();

  if (!verificarFirmaWebhook(payload, cfg.eventsSecret)) {
    return { ok: false, codigoHttp: 401, error: "Firma inválida" };
  }

  const transaction = payload.data.transaction;
  if (!transaction) {
    return { ok: true, status: "ignorado", razon: "sin transaction en payload" };
  }

  const ref = parsearReference(transaction.reference);
  if (!ref) {
    return { ok: true, status: "ignorado", razon: "reference no reconocida" };
  }

  const admin = createAdminClient();

  // Dedupe + persistir evento.
  const { error: insertError } = await admin.from("payment_events").insert({
    tenant_id: ref.tenantId,
    wompi_transaction_id: transaction.id,
    wompi_event_type: payload.event,
    signature_checksum: payload.signature.checksum,
    amount_in_cents: transaction.amount_in_cents,
    status: transaction.status,
    raw_payload: payload as unknown as Json,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: true, status: "duplicado" };
    }
    return { ok: false, codigoHttp: 500, error: insertError.message };
  }

  if (transaction.status !== "APPROVED") {
    return { ok: true, status: "ignorado", razon: `status=${transaction.status}` };
  }

  // Activar/renovar suscripción.
  const ahora = new Date();
  const proximoCobro = new Date(ahora);
  proximoCobro.setMonth(proximoCobro.getMonth() + 1);

  const { data: sub, error: updateError } = await admin
    .from("subscriptions")
    .update({
      plan_id: ref.planId,
      status: "active",
      current_period_start: ahora.toISOString(),
      current_period_end: proximoCobro.toISOString(),
      cancel_at_period_end: false,
    })
    .eq("tenant_id", ref.tenantId)
    .select("id")
    .maybeSingle();

  if (updateError || !sub) {
    return {
      ok: false,
      codigoHttp: 500,
      error: updateError?.message ?? "Suscripción no encontrada para tenant",
    };
  }

  await admin
    .from("payment_events")
    .update({ subscription_id: sub.id })
    .eq("signature_checksum", payload.signature.checksum);

  // Mantener tenants.subscription_plan_id sincronizado.
  await admin
    .from("tenants")
    .update({ subscription_plan_id: ref.planId })
    .eq("id", ref.tenantId);

  return { ok: true, status: "procesado", subscriptionId: sub.id };
}
