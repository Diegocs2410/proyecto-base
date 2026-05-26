import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatFechaCO } from "@/lib/i18n/co";
import { Building2, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AceptarButton } from "./aceptar-button";

const ROLES: Record<string, string> = {
  tenant_admin: "Administrador",
  member: "Miembro",
  viewer: "Solo lectura",
};

export default async function UnirmePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: inv } = await admin
    .from("invitations")
    .select("email, role, status, expires_at, tenants!tenant_id(name, slug)")
    .eq("token", token)
    .maybeSingle();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const invPath = `/unirme/${token}`;

  if (!inv) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Invitación no encontrada</h1>
          <p className="mt-2 text-sm text-slate-500">
            Este enlace no es válido o ya fue usado. Pídele a tu administrador que te envíe uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  const vencida = inv.status !== "pending" || new Date(inv.expires_at as string) < new Date();
  const tenant = Array.isArray(inv.tenants)
    ? (inv.tenants[0] as { name: string; slug: string } | undefined)
    : (inv.tenants as { name: string; slug: string } | null);

  const rol = ROLES[inv.role as string] ?? inv.role;
  const expira = formatFechaCO(inv.expires_at as string);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
              {tenant?.name?.slice(0, 2).toUpperCase() ?? "ORG"}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Te invitaron a unirte</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tienes una invitación para acceder a una organización.
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Organización</span>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">{tenant?.name}</span>
              </div>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Tu rol</span>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
                {rol}
              </span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Válida hasta</span>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                {expira}
              </div>
            </div>
          </div>

          {vencida ? (
            <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              Esta invitación ya fue usada o venció.
            </div>
          ) : user ? (
            <div className="mt-6 grid gap-3">
              <p className="text-center text-xs text-slate-500">
                Entrando como <strong>{user.email}</strong>
              </p>
              <AceptarButton token={token} />
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              <p className="text-center text-sm text-slate-600">
                Para aceptar la invitación, entra o crea tu cuenta:
              </p>
              <Link
                className="block w-full rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-slate-800"
                href={`/auth/login?next=${encodeURIComponent(invPath)}`}
              >
                Ya tengo cuenta — Entrar
              </Link>
              <Link
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                href={`/auth/registro?next=${encodeURIComponent(invPath)}`}
              >
                Crear cuenta gratis
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
