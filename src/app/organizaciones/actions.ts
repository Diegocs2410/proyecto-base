"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface NuevaOrgData {
  nombre: string;
  slug: string;
  tipo: "small_business" | "mid_market" | "enterprise" | "partner" | "internal_demo";
  planCode: string;
}

export async function crearOrganizacionAdmin(
  datos: NuevaOrgData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesión expirada. Vuelve a ingresar." };

  const { data: plan } = await admin
    .from("subscription_plans")
    .select("id")
    .eq("code", datos.planCode)
    .single();

  if (!plan) return { error: "Plan seleccionado no válido." };

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name: datos.nombre,
      slug: datos.slug,
      tenant_type: datos.tipo,
      subscription_plan_id: plan.id,
      status: "active",
    })
    .select("id")
    .single();

  if (tenantError) {
    if (tenantError.code === "23505") return { error: "Esa URL ya está en uso. Elige otra." };
    return { error: "No se pudo crear la organización. Intenta de nuevo." };
  }

  await admin.from("tenant_settings").insert({
    tenant_id: tenant.id,
    locale: "es",
    timezone: "America/Bogota",
  });

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "create",
    entity_type: "tenant",
    entity_id: tenant.id,
    metadata: { nombre: datos.nombre },
  });

  return {};
}
