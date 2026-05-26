import { createAdminClient } from "@/lib/supabase/admin";
import { moduleRegistry } from "@/modules/registry";
import type { ModuleManifest } from "@/modules/types";

/**
 * Devuelve los manifests de los módulos actualmente activados para un tenant.
 * Hace JOIN entre tenant_features (BD) y moduleRegistry (código).
 */
export async function getEnabledModules(tenantId: string): Promise<ModuleManifest[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_features")
    .select("feature_key")
    .eq("tenant_id", tenantId)
    .eq("enabled", true);

  const keysActivas = new Set((data ?? []).map((f) => f.feature_key));
  return moduleRegistry.filter((m) => keysActivas.has(m.key));
}

/**
 * Devuelve el estado de TODOS los módulos disponibles para un tenant,
 * usado por la UI de activación.
 */
export async function getEstadoModulos(tenantId: string): Promise<
  Array<{ manifest: ModuleManifest; enabled: boolean }>
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_features")
    .select("feature_key, enabled")
    .eq("tenant_id", tenantId);

  const estado = new Map<string, boolean>(
    (data ?? []).map((f) => [f.feature_key, f.enabled]),
  );

  return moduleRegistry.map((manifest) => ({
    manifest,
    enabled: estado.get(manifest.key) ?? false,
  }));
}
