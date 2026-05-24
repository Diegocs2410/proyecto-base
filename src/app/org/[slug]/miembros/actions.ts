"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ROLES_GESTIONABLES = ["tenant_admin", "member", "viewer"];
const ROLES_CON_PERMISOS = ["platform_admin", "tenant_owner", "tenant_admin"];

async function verificarPermisos(tenantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesión expirada." };

  const admin = createAdminClient();
  const { data: membresia } = await admin
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membresia || !ROLES_CON_PERMISOS.includes(membresia.role as string)) {
    return { error: "No tienes permisos para gestionar miembros." };
  }

  return { user, admin };
}

export async function cambiarRol(
  membresiaId: string,
  tenantId: string,
  nuevoRol: string,
): Promise<{ error?: string }> {
  if (!ROLES_GESTIONABLES.includes(nuevoRol)) {
    return { error: "Rol no válido." };
  }

  const resultado = await verificarPermisos(tenantId);
  if ("error" in resultado) return resultado;
  const { user, admin } = resultado;

  const { data: objetivo } = await admin
    .from("tenant_users")
    .select("role, user_id")
    .eq("id", membresiaId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!objetivo) return { error: "Miembro no encontrado." };

  if (!ROLES_GESTIONABLES.includes(objetivo.role as string)) {
    return { error: "No puedes cambiar el rol de este usuario." };
  }

  if (objetivo.user_id === user.id) {
    return { error: "No puedes cambiar tu propio rol." };
  }

  const { error } = await admin
    .from("tenant_users")
    .update({ role: nuevoRol })
    .eq("id", membresiaId);

  if (error) return { error: "No se pudo actualizar el rol." };

  await admin.from("audit_logs").insert({
    tenant_id: tenantId,
    actor_user_id: user.id,
    action: "update",
    entity_type: "user",
    entity_id: objetivo.user_id as string,
    metadata: { rol_anterior: objetivo.role, rol_nuevo: nuevoRol },
  });

  return {};
}

export async function removerMiembro(
  membresiaId: string,
  tenantId: string,
): Promise<{ error?: string }> {
  const resultado = await verificarPermisos(tenantId);
  if ("error" in resultado) return resultado;
  const { user, admin } = resultado;

  const { data: objetivo } = await admin
    .from("tenant_users")
    .select("role, user_id")
    .eq("id", membresiaId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!objetivo) return { error: "Miembro no encontrado." };

  if (!ROLES_GESTIONABLES.includes(objetivo.role as string)) {
    return { error: "No puedes eliminar a este usuario." };
  }

  if (objetivo.user_id === user.id) {
    return { error: "No puedes eliminarte a ti mismo." };
  }

  const { error } = await admin
    .from("tenant_users")
    .delete()
    .eq("id", membresiaId);

  if (error) return { error: "No se pudo eliminar al miembro." };

  await admin.from("audit_logs").insert({
    tenant_id: tenantId,
    actor_user_id: user.id,
    action: "delete",
    entity_type: "user",
    entity_id: objetivo.user_id as string,
    metadata: { rol: objetivo.role },
  });

  return {};
}
