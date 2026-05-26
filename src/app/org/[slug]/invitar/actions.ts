"use server";

import { requirePermission, esFalla } from "@/lib/security/require";
import { logAudit } from "@/lib/audit/log";
import { enviarEmail } from "@/lib/email/send";
import { getAppUrl } from "@/lib/email/client";
import { InvitacionEmail } from "@/lib/email/templates/invitacion";
import { verificarLimite } from "@/lib/billing/limits";
import { formatFechaCO } from "@/lib/i18n/co";

const ROLES_INVITABLES = ["tenant_admin", "member", "viewer"];

export async function enviarInvitacion(
  tenantId: string,
  email: string,
  rol: string,
): Promise<{ error?: string; token?: string }> {
  if (!ROLES_INVITABLES.includes(rol)) {
    return { error: "Rol no válido para invitación." };
  }

  const resultado = await requirePermission(tenantId, "members.manage");
  if (esFalla(resultado)) return resultado;
  const { user, context, admin } = resultado;

  const limite = await verificarLimite(tenantId, "users", admin);
  if (!limite.permitido) {
    return { error: limite.motivo ?? "Llegaste al límite de tu plan." };
  }

  const { error } = await admin.from("invitations").insert({
    tenant_id: tenantId,
    email,
    role: rol,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una invitación pendiente para ese correo." };
    }
    return { error: "No se pudo enviar la invitación. Intenta de nuevo." };
  }

  const { data: inv } = await admin
    .from("invitations")
    .select("id, token, expires_at")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!inv) return { error: "No se pudo recuperar la invitación recién creada." };

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "invite",
      entityType: "invitation",
      entityId: inv.id,
      metadata: { email, rol },
    },
    admin,
  );

  const nombreInvitador =
    (user.user_metadata?.nombre_completo as string | undefined) ?? user.email ?? null;
  const urlAceptar = `${getAppUrl()}/unirme/${inv.token}`;
  const expiraEn = formatFechaCO(inv.expires_at);

  const envio = await enviarEmail({
    to: email,
    subject: `Te invitaron a ${context.tenantName}`,
    react: InvitacionEmail({
      nombreOrg: context.tenantName,
      nombreInvitador,
      rol,
      urlAceptar,
      expiraEn,
    }),
    tags: [
      { name: "tipo", value: "invitacion" },
      { name: "tenant_id", value: tenantId },
    ],
  });

  if (!envio.ok) {
    console.warn("[invitar] Invitación creada pero el email falló:", envio.error);
  }

  return { token: inv.token };
}

export type EnviarInvitacionResult = { error?: string; token?: string };
