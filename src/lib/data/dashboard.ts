import { createAdminClient } from "@/lib/supabase/admin";

export async function getEstadisticasDashboard() {
  const supabase = createAdminClient();

  const [tenants, usuarios, roles] = await Promise.all([
    supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tenant_users").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("roles").select("id", { count: "exact", head: true }),
  ]);

  return {
    organizaciones: tenants.count ?? 0,
    usuarios: usuarios.count ?? 0,
    roles: roles.count ?? 0,
  };
}

export async function getOrganizaciones() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenants")
    .select(
      `
      id,
      name,
      slug,
      status,
      plan:subscription_plans!subscription_plan_id(name),
      miembros:tenant_users!tenant_id(id)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return [];

  return (data ?? []).map((t) => ({
    id: t.id as string,
    nombre: t.name as string,
    slug: t.slug as string,
    estado: t.status as string,
    plan: (Array.isArray(t.plan) ? (t.plan[0] as { name: string } | undefined)?.name : (t.plan as { name: string } | null)?.name) ?? "Sin plan",
    miembros: Array.isArray(t.miembros) ? t.miembros.length : 0,
  }));
}

export async function getAuditReciente() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return [];

  return (data ?? []).map((log) => ({
    id: log.id as string,
    titulo: formatearAccion(log.action as string, log.entity_type as string),
    descripcion: formatearDescripcion(log.metadata as Record<string, unknown>),
    tiempo: tiempoRelativo(log.created_at as string),
  }));
}

function formatearAccion(action: string, entityType: string): string {
  const acciones: Record<string, string> = {
    create: "creado",
    update: "actualizado",
    delete: "eliminado",
    login: "inició sesión",
    logout: "cerró sesión",
  };
  const entidades: Record<string, string> = {
    tenant: "Organización",
    user: "Usuario",
    role: "Rol",
    permission: "Permiso",
  };
  const accion = acciones[action] ?? action;
  const entidad = entidades[entityType] ?? entityType;
  return `${entidad} ${accion}`;
}

function formatearDescripcion(metadata: Record<string, unknown>): string {
  if (metadata?.nombre) return `${metadata.nombre}`;
  if (metadata?.name) return `${metadata.name}`;
  return "Sin detalles adicionales.";
}

function tiempoRelativo(fecha: string): string {
  const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
