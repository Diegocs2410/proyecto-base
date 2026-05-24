"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function enviarInvitacion(
  tenantId: string,
  email: string,
  rol: string,
): Promise<{ error?: string; token?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  const admin = createAdminClient();

  const { error } = await admin.from("invitations").insert({
    tenant_id: tenantId,
    email,
    role: rol,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ya existe una invitación pendiente para ese correo." };
    return { error: "No se pudo enviar la invitación. Intenta de nuevo." };
  }

  const { data: inv } = await admin
    .from("invitations")
    .select("token")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return { token: inv?.token as string | undefined };
}

export type EnviarInvitacionResult = { error?: string; token?: string };
