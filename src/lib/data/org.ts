import { createAdminClient } from "@/lib/supabase/admin";
import { formatFechaCortaCO } from "@/lib/i18n/co";

export interface OrgContexto {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  plan: string;
  totalMiembros: number;
}

export interface OrgMiembro {
  id: string;
  userId: string;
  nombre: string;
  email: string;
  rol: string;
  rolCode: string;
  estado: string;
  desde: string;
}

export interface Membresia {
  tenantId: string;
  slug: string;
  nombre: string;
  rol: string;
}

export async function getOrgPorSlug(slug: string): Promise<OrgContexto | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("tenants")
    .select(`
      id, name, slug, status,
      plan:subscription_plans!subscription_plan_id(name),
      miembros:tenant_users!tenant_id(id)
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    nombre: data.name as string,
    slug: data.slug as string,
    estado: data.status as string,
    plan: (Array.isArray(data.plan)
      ? (data.plan[0] as { name: string } | undefined)?.name
      : (data.plan as { name: string } | null)?.name) ?? "Sin plan",
    totalMiembros: Array.isArray(data.miembros) ? data.miembros.length : 0,
  };
}

export async function getMembresiaUsuario(userId: string): Promise<Membresia | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("tenant_users")
    .select("tenant_id, role, tenants!tenant_id(name, slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const tenant = Array.isArray(data.tenants)
    ? (data.tenants[0] as { name: string; slug: string } | undefined)
    : (data.tenants as { name: string; slug: string } | null);

  if (!tenant) return null;

  return {
    tenantId: data.tenant_id as string,
    slug: tenant.slug,
    nombre: tenant.name,
    rol: data.role as string,
  };
}

export async function getOrgMiembros(tenantId: string): Promise<OrgMiembro[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("tenant_users")
    .select("id, user_id, role, status, created_at, user:user_id(email, raw_user_meta_data)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((m) => {
    const userRaw = m.user as unknown;
    const user = userRaw as { email: string; raw_user_meta_data: Record<string, unknown> } | null;
    const meta = user?.raw_user_meta_data ?? {};
    return {
      id: m.id as string,
      userId: m.user_id as string,
      nombre: (meta.nombre_completo as string) || (meta.full_name as string) || user?.email?.split("@")[0] || "Usuario",
      email: user?.email ?? "—",
      rol: traducirRol(m.role as string),
      rolCode: m.role as string,
      estado: m.status as string,
      desde: formatFechaCortaCO(m.created_at as string),
    };
  });
}

export async function getInvitacionesPendientes(tenantId: string) {
  const admin = createAdminClient();

  const { data } = await admin
    .from("invitations")
    .select("id, email, role, status, expires_at, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []).map((inv) => ({
    id: inv.id as string,
    email: inv.email as string,
    rol: traducirRol(inv.role as string),
    expira: formatFechaCortaCO(inv.expires_at as string),
  }));
}

function traducirRol(rol: string): string {
  const roles: Record<string, string> = {
    platform_admin: "Admin de plataforma",
    tenant_owner: "Dueño",
    tenant_admin: "Administrador",
    member: "Miembro",
    viewer: "Solo lectura",
  };
  return roles[rol] ?? rol;
}
