import { createClient } from "@/lib/supabase/server";

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  role: string;
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (!userId) {
    return null;
  }

  const { data } = await supabase
    .from("tenant_users")
    .select("tenant_id, role, tenants(name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const tenant = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;

  return {
    tenantId: data.tenant_id,
    tenantName: tenant?.name ?? "Tenant",
    role: data.role,
  };
}
