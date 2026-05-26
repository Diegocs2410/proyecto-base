"use server";

import { requirePermission, esFalla } from "@/lib/security/require";
import { logAudit } from "@/lib/audit/log";

const ROLES_GESTIONABLES = ["tenant_admin", "member", "viewer"];

export async function cambiarRol(
  membresiaId: string,
  tenantId: string,
  nuevoRol: string,
): Promise<{ error?: string }> {
  if (!ROLES_GESTIONABLES.includes(nuevoRol)) {
    return { error: "Rol no válido." };
  }

  const resultado = await requirePermission(tenantId, "members.manage");
  if (esFalla(resultado)) return resultado;
  const { user, admin } = resultado;

  const { data: objetivo } = await admin
    .from("tenant_users")
    .select("role, user_id")
    .eq("id", membresiaId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!objetivo) return { error: "Miembro no encontrado." };

  if (!ROLES_GESTIONABLES.includes(objetivo.role)) {
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

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "update",
      entityType: "user",
      entityId: objetivo.user_id,
      metadata: { rol_anterior: objetivo.role, rol_nuevo: nuevoRol },
    },
    admin,
  );

  return {};
}

export async function removerMiembro(
  membresiaId: string,
  tenantId: string,
): Promise<{ error?: string }> {
  const resultado = await requirePermission(tenantId, "members.manage");
  if (esFalla(resultado)) return resultado;
  const { user, admin } = resultado;

  const { data: objetivo } = await admin
    .from("tenant_users")
    .select("role, user_id")
    .eq("id", membresiaId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!objetivo) return { error: "Miembro no encontrado." };

  if (!ROLES_GESTIONABLES.includes(objetivo.role)) {
    return { error: "No puedes eliminar a este usuario." };
  }

  if (objetivo.user_id === user.id) {
    return { error: "No puedes eliminarte a ti mismo." };
  }

  const { error } = await admin.from("tenant_users").delete().eq("id", membresiaId);

  if (error) return { error: "No se pudo eliminar al miembro." };

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "delete",
      entityType: "user",
      entityId: objetivo.user_id,
      metadata: { rol: objetivo.role },
    },
    admin,
  );

  return {};
}
