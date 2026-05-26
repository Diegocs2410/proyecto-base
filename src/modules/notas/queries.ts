import { createAdminClient } from "@/lib/supabase/admin";
import { formatFechaHoraCO } from "@/lib/i18n/co";

export interface NotaItem {
  id: string;
  cuerpo: string;
  autor: string;
  autorId: string | null;
  fecha: string;
  fechaIso: string;
}

export async function listarNotas(tenantId: string, limite = 50): Promise<NotaItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("notas")
    .select("id, body, created_at, created_by, autor:created_by(email, raw_user_meta_data)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limite);

  return (data ?? []).map((n) => {
    const autorRaw = n.autor as unknown;
    const autor = autorRaw as
      | { email: string; raw_user_meta_data: Record<string, unknown> }
      | null;
    const meta = autor?.raw_user_meta_data ?? {};
    const nombre =
      (meta.nombre_completo as string) ||
      (meta.full_name as string) ||
      autor?.email?.split("@")[0] ||
      "Anónimo";
    return {
      id: n.id,
      cuerpo: n.body,
      autor: nombre,
      autorId: n.created_by,
      fecha: formatFechaHoraCO(n.created_at),
      fechaIso: n.created_at,
    };
  });
}
