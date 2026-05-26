"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import { redirect } from "next/navigation";

export async function aceptarInvitacion(token: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para aceptar esta invitación." };

  const admin = createAdminClient();

  const { data: inv, error: invError } = await admin
    .from("invitations")
    .select("id, tenant_id, email, role, status, expires_at, tenants!tenant_id(slug)")
    .eq("token", token)
    .maybeSingle();

  if (invError || !inv) return { error: "Esta invitación no existe o ya no es válida." };
  if (inv.status !== "pending") return { error: "Esta invitación ya fue usada o venció." };
  if (new Date(inv.expires_at) < new Date()) {
    await admin.from("invitations").update({ status: "expired" }).eq("id", inv.id);
    return { error: "Esta invitación venció. Pídele a tu administrador que envíe una nueva." };
  }

  const { error: memberError } = await admin.from("tenant_users").insert({
    tenant_id: inv.tenant_id,
    user_id: user.id,
    role: inv.role,
    status: "active",
  });

  if (memberError) {
    if (memberError.code === "23505") return { error: "Ya eres miembro de esta organización." };
    return { error: "No se pudo completar la unión. Intenta de nuevo." };
  }

  await admin.from("invitations").update({ status: "accepted" }).eq("id", inv.id);

  await logAudit(
    {
      tenantId: inv.tenant_id,
      actorUserId: user.id,
      action: "accept",
      entityType: "invitation",
      entityId: inv.id,
      metadata: { email: inv.email, rol: inv.role },
    },
    admin,
  );

  redirect(`/org/${inv.tenants?.slug ?? ""}`);
}
