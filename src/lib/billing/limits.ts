import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type RecursoLimitado = "users" | "workspaces";

export interface ResultadoLimite {
  permitido: boolean;
  usado: number;
  limite: number;
  motivo?: string;
}

/**
 * Verifica si el tenant puede agregar más recursos del tipo dado.
 * Si la suscripción está cancelled o past_due bloquea todo.
 */
export async function verificarLimite(
  tenantId: string,
  recurso: RecursoLimitado,
  cliente?: SupabaseClient<Database>,
): Promise<ResultadoLimite> {
  const admin = cliente ?? createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select(
      "status, plan:subscription_plans!plan_id(max_users, max_workspaces)",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!sub) {
    return {
      permitido: false,
      usado: 0,
      limite: 0,
      motivo: "Esta organización no tiene suscripción activa.",
    };
  }

  if (sub.status === "canceled" || sub.status === "past_due") {
    return {
      permitido: false,
      usado: 0,
      limite: 0,
      motivo:
        sub.status === "past_due"
          ? "Tu suscripción tiene un pago pendiente. Renueva para continuar."
          : "Tu suscripción está cancelada.",
    };
  }

  const plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan;
  if (!plan) {
    return { permitido: false, usado: 0, limite: 0, motivo: "Plan no encontrado." };
  }

  const limite = recurso === "users" ? plan.max_users : plan.max_workspaces;
  const usado = await contarUso(admin, tenantId, recurso);

  if (usado >= limite) {
    return {
      permitido: false,
      usado,
      limite,
      motivo: `Llegaste al límite de tu plan (${usado}/${limite} ${etiquetaRecurso(recurso)}). Cambia de plan para agregar más.`,
    };
  }

  return { permitido: true, usado, limite };
}

async function contarUso(
  admin: SupabaseClient<Database>,
  tenantId: string,
  recurso: RecursoLimitado,
): Promise<number> {
  if (recurso === "users") {
    // Cuenta miembros activos + invitaciones pendientes (consumen cupo).
    const [{ count: activos }, { count: pendientes }] = await Promise.all([
      admin
        .from("tenant_users")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "active"),
      admin
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "pending"),
    ]);
    return (activos ?? 0) + (pendientes ?? 0);
  }

  // workspaces: cuando exista el módulo correspondiente. Por ahora 0.
  return 0;
}

function etiquetaRecurso(recurso: RecursoLimitado): string {
  return recurso === "users" ? "usuarios" : "espacios de trabajo";
}
