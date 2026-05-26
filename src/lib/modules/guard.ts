import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgPorSlug, type OrgContexto } from "@/lib/data/org";
import { getManifestByKey } from "@/modules/registry";
import type { ModuleManifest } from "@/modules/types";
import { notFound, redirect } from "next/navigation";

export interface GuardResult {
  org: OrgContexto;
  manifest: ModuleManifest;
}

/**
 * Llamar al inicio de cada page wrapper de un módulo.
 * Garantiza:
 *   - El slug corresponde a una org existente.
 *   - El módulo está registrado en el registry.
 *   - El módulo está activado para esa org (tenant_features.enabled = true).
 *
 * Si el módulo no está activado, redirige a la UI de activación.
 * Si la org o el módulo no existen, devuelve 404.
 */
export async function requireModuleEnabled(
  slug: string,
  moduleKey: string,
): Promise<GuardResult> {
  const org = await getOrgPorSlug(slug);
  if (!org) notFound();

  const manifest = getManifestByKey(moduleKey);
  if (!manifest) notFound();

  const admin = createAdminClient();
  const { data: feature } = await admin
    .from("tenant_features")
    .select("enabled")
    .eq("tenant_id", org.id)
    .eq("feature_key", moduleKey)
    .maybeSingle();

  if (!feature?.enabled) {
    redirect(`/org/${slug}/configuracion/modulos?activar=${moduleKey}`);
  }

  return { org, manifest };
}
