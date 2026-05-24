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

export async function getMiembrosGlobales() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_users")
    .select(`
      id,
      role,
      status,
      user:user_id(email, raw_user_meta_data),
      tenant:tenant_id(name, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];

  return (data ?? []).map((m) => {
    const user = m.user as unknown as { email: string; raw_user_meta_data: Record<string, unknown> } | null;
    const tenant = Array.isArray(m.tenant)
      ? (m.tenant[0] as { name: string; slug: string } | undefined)
      : (m.tenant as { name: string; slug: string } | null);
    const meta = user?.raw_user_meta_data ?? {};
    return {
      id: m.id as string,
      nombre: (meta.full_name as string) || user?.email?.split("@")[0] || "Usuario",
      email: user?.email ?? "—",
      rol: traducirRolMiembro(m.role as string),
      organizacion: tenant?.name ?? "—",
      slugOrg: tenant?.slug ?? "",
      estado: m.status as string,
    };
  });
}

export async function getRolesGlobales() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("roles")
    .select(`
      id,
      name,
      code,
      scope,
      tenant:tenant_id(name),
      permisos:role_permissions(permission_id)
    `)
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((r) => {
    const tenant = Array.isArray(r.tenant)
      ? (r.tenant[0] as { name: string } | undefined)
      : (r.tenant as { name: string } | null);
    return {
      id: r.id as string,
      nombre: r.name as string,
      codigo: r.code as string,
      alcance: traducirAlcance(r.scope as string),
      permisos: Array.isArray(r.permisos) ? r.permisos.length : 0,
      organizacion: tenant?.name ?? "Global",
    };
  });
}

function traducirRolMiembro(rol: string): string {
  const roles: Record<string, string> = {
    platform_admin: "Admin de plataforma",
    tenant_owner: "Dueño",
    tenant_admin: "Administrador",
    member: "Miembro",
    viewer: "Solo lectura",
  };
  return roles[rol] ?? rol;
}

function traducirAlcance(scope: string): string {
  const alcances: Record<string, string> = {
    platform: "Plataforma",
    tenant: "Organización",
    workspace: "Espacio",
  };
  return alcances[scope] ?? scope;
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
