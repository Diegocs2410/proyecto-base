"use server";

import { esFalla, requirePermission } from "@/lib/security/require";
import { logAudit } from "@/lib/audit/log";
import { getManifestByKey } from "@/modules/registry";
import { planAlcanza } from "@/modules/types";
import { revalidatePath } from "next/cache";

export async function activarModulo(
  tenantId: string,
  slug: string,
  moduleKey: string,
): Promise<{ error?: string; ok?: true }> {
  const manifest = getManifestByKey(moduleKey);
  if (!manifest) return { error: "Módulo no reconocido." };

  const resultado = await requirePermission(tenantId, "modules.manage");
  if (esFalla(resultado)) return resultado;
  const { user, admin } = resultado;

  // Verificar plan
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan:subscription_plans!plan_id(code)")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const plan = Array.isArray(sub?.plan) ? sub?.plan[0] : sub?.plan;
  const planActual = plan?.code ?? "starter";

  if (!planAlcanza(planActual, manifest.minPlanCode)) {
    return {
      error: `Este módulo requiere el plan ${manifest.minPlanCode} o superior. Tu plan actual es ${planActual}.`,
    };
  }

  const { error } = await admin
    .from("tenant_features")
    .upsert(
      { tenant_id: tenantId, feature_key: moduleKey, enabled: true },
      { onConflict: "tenant_id,feature_key" },
    );

  if (error) return { error: "No se pudo activar el módulo." };

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "activar",
      entityType: "modulo",
      metadata: { key: moduleKey, plan: planActual },
    },
    admin,
  );

  revalidatePath(`/org/${slug}`, "layout");
  return { ok: true };
}

export async function desactivarModulo(
  tenantId: string,
  slug: string,
  moduleKey: string,
): Promise<{ error?: string; ok?: true }> {
  const resultado = await requirePermission(tenantId, "modules.manage");
  if (esFalla(resultado)) return resultado;
  const { user, admin } = resultado;

  const { error } = await admin
    .from("tenant_features")
    .upsert(
      { tenant_id: tenantId, feature_key: moduleKey, enabled: false },
      { onConflict: "tenant_id,feature_key" },
    );

  if (error) return { error: "No se pudo desactivar el módulo." };

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "desactivar",
      entityType: "modulo",
      metadata: { key: moduleKey },
    },
    admin,
  );

  revalidatePath(`/org/${slug}`, "layout");
  return { ok: true };
}
