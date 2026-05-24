"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface DatosOrganizacion {
  nombre: string;
  slug: string;
  planCode: string;
}

export async function crearOrganizacion(datos: DatosOrganizacion): Promise<{ error?: string }> {
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
      tenant_type: "small_business",
      subscription_plan_id: plan.id,
      status: "active",
    })
    .select("id")
    .single();

  if (tenantError) {
    if (tenantError.code === "23505") return { error: "Ese nombre de URL ya está en uso. Elige otro." };
    return { error: "No se pudo crear la organización. Intenta nuevamente." };
  }

  const totalTenants = await admin.from("tenants").select("id", { count: "exact", head: true });
  const esPrimerAdmin = (totalTenants.count ?? 0) === 1;

  await admin.from("tenant_users").insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: esPrimerAdmin ? "platform_admin" : "tenant_owner",
    status: "active",
  });

  await admin.from("tenant_settings").insert({
    tenant_id: tenant.id,
    locale: "es",
    timezone: "America/Bogota",
  });

  redirect("/");
}
