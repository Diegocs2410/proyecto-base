import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { can, type Permission } from "@/lib/security/permissions";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { TenantContext } from "@/lib/auth/tenant-context";

export type PermissionFailure = { error: string };

export type PermissionGrant = {
  user: User;
  context: TenantContext;
  admin: SupabaseClient<Database>;
};

export async function requirePermission(
  tenantId: string,
  permission: Permission,
): Promise<PermissionFailure | PermissionGrant> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesión expirada. Vuelve a ingresar." };

  const admin = createAdminClient();
  const { data: membresia } = await admin
    .from("tenant_users")
    .select("role, tenants!tenant_id(name)")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();

  if (!membresia) return { error: "No perteneces a esta organización." };

  const context: TenantContext = {
    tenantId,
    tenantName: membresia.tenants?.name ?? "Organización",
    role: membresia.role,
  };

  if (!can(context, permission)) {
    return { error: "No tienes permisos para esta acción." };
  }

  return { user, context, admin };
}

export function esFalla(
  resultado: PermissionFailure | PermissionGrant,
): resultado is PermissionFailure {
  return "error" in resultado;
}
