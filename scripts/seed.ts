import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient<Database>(url, key);

const PLAN_IDS: Record<string, string> = {};

const TENANT_IDS = {
  techcorp: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  startupx: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  acme: "c3d4e5f6-a7b8-9012-cdef-123456789012",
};

const USER_IDS = {
  admin: "d4e5f6a7-b8c9-0123-def0-234567890123",
  ownerTech: "e5f6a7b8-c9d0-1234-ef01-345678901234",
  ownerStartup: "f6a7b8c9-d0e1-2345-f012-456789012345",
  memberAcme: "a7b8c9d0-e1f2-3456-0123-567890123456",
};

async function cargarPlanes() {
  const { data } = await supabase.from("subscription_plans").select("id, code");
  if (data) {
    for (const plan of data) {
      PLAN_IDS[plan.code] = plan.id;
    }
  }
  console.log("✅ Planes cargados:", Object.keys(PLAN_IDS).join(", "));
}

async function crearUsuarios() {
  const usuarios = [
    {
      id: USER_IDS.admin,
      email: "admin@plataforma.dev",
      password: "Admin1234!",
      name: "Admin Global",
    },
    {
      id: USER_IDS.ownerTech,
      email: "owner@techcorp.dev",
      password: "Owner1234!",
      name: "Carlos Martínez",
    },
    {
      id: USER_IDS.ownerStartup,
      email: "owner@startupx.dev",
      password: "Owner1234!",
      name: "Ana Torres",
    },
    {
      id: USER_IDS.memberAcme,
      email: "miembro@acme.dev",
      password: "Member1234!",
      name: "Luis Pérez",
    },
  ];

  for (const u of usuarios) {
    const { error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name },
      ...(u.id ? { id: u.id } : {}),
    });
    if (error && !error.message.includes("already been registered")) {
      console.error(`❌ Error creando usuario ${u.email}:`, error.message);
    } else {
      console.log(`✅ Usuario: ${u.email}`);
    }
  }
}

async function crearTenants() {
  const tenants = [
    {
      id: TENANT_IDS.techcorp,
      name: "TechCorp",
      slug: "techcorp",
      tenant_type: "mid_market",
      subscription_plan_id: PLAN_IDS["business"],
      status: "active",
      primary_color: "#4f46e5",
    },
    {
      id: TENANT_IDS.startupx,
      name: "StartupX",
      slug: "startupx",
      tenant_type: "small_business",
      subscription_plan_id: PLAN_IDS["starter"],
      status: "trialing",
      primary_color: "#16a34a",
    },
    {
      id: TENANT_IDS.acme,
      name: "Acme Corp",
      slug: "acme",
      tenant_type: "enterprise",
      subscription_plan_id: PLAN_IDS["enterprise"],
      status: "active",
      primary_color: "#0ea5e9",
    },
  ];

  const { error } = await supabase.from("tenants").upsert(tenants, { onConflict: "id" });
  if (error) console.error("❌ Error creando tenants:", error.message);
  else console.log("✅ Tenants creados:", tenants.map((t) => t.name).join(", "));
}

async function crearTenantSettings() {
  const settings = [
    { tenant_id: TENANT_IDS.techcorp, timezone: "America/Bogota", locale: "es" },
    { tenant_id: TENANT_IDS.startupx, timezone: "America/Bogota", locale: "es" },
    { tenant_id: TENANT_IDS.acme, timezone: "America/New_York", locale: "en" },
  ];

  const { error } = await supabase
    .from("tenant_settings")
    .upsert(settings, { onConflict: "tenant_id" });
  if (error) console.error("❌ Error en tenant_settings:", error.message);
  else console.log("✅ Configuraciones de tenant creadas");
}

async function crearMiembros() {
  const miembros = [
    {
      tenant_id: TENANT_IDS.techcorp,
      user_id: USER_IDS.admin,
      role: "platform_admin",
      status: "active",
    },
    {
      tenant_id: TENANT_IDS.techcorp,
      user_id: USER_IDS.ownerTech,
      role: "tenant_owner",
      status: "active",
    },
    {
      tenant_id: TENANT_IDS.startupx,
      user_id: USER_IDS.ownerStartup,
      role: "tenant_owner",
      status: "active",
    },
    {
      tenant_id: TENANT_IDS.acme,
      user_id: USER_IDS.memberAcme,
      role: "member",
      status: "active",
    },
  ];

  const { error } = await supabase
    .from("tenant_users")
    .upsert(miembros, { onConflict: "tenant_id,user_id" });
  if (error) console.error("❌ Error creando miembros:", error.message);
  else console.log("✅ Membresías creadas");
}

async function crearAuditLogs() {
  const { count } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "tenant")
    .in("tenant_id", Object.values(TENANT_IDS));

  if ((count ?? 0) > 0) {
    console.log("↻ Audit logs demo ya existen, saltando");
    return;
  }

  const logs = [
    {
      tenant_id: TENANT_IDS.techcorp,
      actor_user_id: USER_IDS.admin,
      action: "create",
      entity_type: "tenant",
      metadata: { nombre: "TechCorp" },
    },
    {
      tenant_id: TENANT_IDS.startupx,
      actor_user_id: USER_IDS.ownerStartup,
      action: "create",
      entity_type: "tenant",
      metadata: { nombre: "StartupX" },
    },
    {
      tenant_id: TENANT_IDS.techcorp,
      actor_user_id: USER_IDS.ownerTech,
      action: "login",
      entity_type: "user",
      metadata: { name: "Carlos Martínez" },
    },
    {
      tenant_id: TENANT_IDS.acme,
      actor_user_id: USER_IDS.admin,
      action: "update",
      entity_type: "tenant",
      metadata: { nombre: "Acme Corp" },
    },
    {
      tenant_id: TENANT_IDS.startupx,
      actor_user_id: USER_IDS.ownerStartup,
      action: "create",
      entity_type: "user",
      metadata: { name: "Ana Torres" },
    },
  ];

  const { error } = await supabase.from("audit_logs").insert(logs);
  if (error) console.error("❌ Error en audit_logs:", error.message);
  else console.log("✅ Audit logs creados");
}

async function crearInvitaciones() {
  const invitaciones = [
    {
      tenant_id: TENANT_IDS.techcorp,
      email: "dev1@techcorp.dev",
      role: "member",
      created_by: USER_IDS.ownerTech,
      status: "pending",
    },
    {
      tenant_id: TENANT_IDS.techcorp,
      email: "dev2@techcorp.dev",
      role: "tenant_admin",
      created_by: USER_IDS.ownerTech,
      status: "pending",
    },
    {
      tenant_id: TENANT_IDS.startupx,
      email: "cto@startupx.dev",
      role: "tenant_admin",
      created_by: USER_IDS.ownerStartup,
      status: "pending",
    },
  ];

  const { error } = await supabase
    .from("invitations")
    .upsert(invitaciones, { onConflict: "tenant_id,email" });
  if (error) console.error("❌ Error en invitaciones:", error.message);
  else console.log("✅ Invitaciones creadas");
}

async function main() {
  await cargarPlanes();

  if (process.env.SEED_DEMO_TENANTS !== "true") {
    console.log("× SEED_DEMO_TENANTS != true, no se crean datos demo.");
    console.log("  Para sembrar usuarios/tenants demo: SEED_DEMO_TENANTS=true npm run seed");
    return;
  }

  console.log("\n🌱 Sembrando datos demo...\n");

  await crearUsuarios();
  await crearTenants();
  await crearTenantSettings();
  await crearMiembros();
  await crearAuditLogs();
  await crearInvitaciones();

  console.log("\n✨ Seed completado!\n");
  console.log("Usuarios de prueba:");
  console.log("  admin@plataforma.dev  →  Admin1234!  (platform admin)");
  console.log("  owner@techcorp.dev    →  Owner1234!  (tenant owner - TechCorp)");
  console.log("  owner@startupx.dev   →  Owner1234!  (tenant owner - StartupX)");
  console.log("  miembro@acme.dev     →  Member1234! (member - Acme Corp)\n");
}

main().catch((err) => {
  console.error("❌ Seed falló:", err);
  process.exit(1);
});
