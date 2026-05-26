"use server";

import { esFalla, requirePermission } from "@/lib/security/require";
import { logAudit } from "@/lib/audit/log";
import { revalidatePath } from "next/cache";

export async function crearNota(
  tenantId: string,
  slug: string,
  cuerpo: string,
): Promise<{ error?: string; ok?: true }> {
  const texto = cuerpo.trim();
  if (texto.length < 1) return { error: "Escribe algo antes de guardar." };
  if (texto.length > 4000) return { error: "La nota es demasiado larga (máx 4000 caracteres)." };

  // tenant.read alcanza: cualquier miembro activo puede crear notas internas.
  const resultado = await requirePermission(tenantId, "tenant.read");
  if (esFalla(resultado)) return resultado;
  const { user, admin } = resultado;

  const { data, error } = await admin
    .from("notas")
    .insert({ tenant_id: tenantId, body: texto, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo guardar la nota." };

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "create",
      entityType: "nota",
      entityId: data.id,
    },
    admin,
  );

  revalidatePath(`/org/${slug}/notas`);
  return { ok: true };
}

export async function eliminarNota(
  tenantId: string,
  slug: string,
  notaId: string,
): Promise<{ error?: string; ok?: true }> {
  const resultado = await requirePermission(tenantId, "tenant.read");
  if (esFalla(resultado)) return resultado;
  const { user, admin } = resultado;

  // RLS solo permite borrar la propia. Verificamos también para mensaje claro.
  const { data: nota } = await admin
    .from("notas")
    .select("created_by")
    .eq("id", notaId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!nota) return { error: "La nota no existe." };
  if (nota.created_by !== user.id) {
    return { error: "Solo puedes eliminar tus propias notas." };
  }

  const { error } = await admin.from("notas").delete().eq("id", notaId);
  if (error) return { error: "No se pudo eliminar la nota." };

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "delete",
      entityType: "nota",
      entityId: notaId,
    },
    admin,
  );

  revalidatePath(`/org/${slug}/notas`);
  return { ok: true };
}
