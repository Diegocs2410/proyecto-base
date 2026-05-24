import { OrgShell } from "@/components/org/org-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getInvitacionesPendientes, getOrgMiembros, getOrgPorSlug } from "@/lib/data/org";
import { createClient } from "@/lib/supabase/server";
import { Mail, Shield, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function OrgDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const org = await getOrgPorSlug(slug);
  if (!org) notFound();

  const [miembros, invitaciones] = await Promise.all([
    getOrgMiembros(org.id),
    getInvitacionesPendientes(org.id),
  ]);

  const activos = miembros.filter((m) => m.estado === "active").length;

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="success">Organización activa</StatusBadge>
            <StatusBadge status={org.plan === "Starter" ? "warning" : "success"}>
              Plan {org.plan}
            </StatusBadge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            ¡Hola, bienvenido a {org.nombre}!
          </h1>
          <p className="mt-2 text-sm text-muted">
            Desde aquí gestionas tu equipo, invitas personas y configuras tu espacio de trabajo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard icon={Users} label="Miembros activos" value={String(activos)} trend="en tu equipo" />
          <MetricCard
            icon={Mail}
            label="Invitaciones pendientes"
            value={String(invitaciones.length)}
            trend="por aceptar"
          />
          <MetricCard icon={Shield} label="Plan actual" value={org.plan} trend="activo" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Tu equipo</h2>
            <p className="mt-0.5 text-sm text-muted">Personas con acceso a esta organización.</p>

            {miembros.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-8 text-center">
                <p className="text-sm text-muted">Aún no hay miembros. ¡Invita a tu equipo!</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {miembros.slice(0, 5).map((m) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
                    key={m.id}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                        {m.nombre[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.nombre}</p>
                        <p className="text-xs text-muted">{m.email}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {m.rol}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Invitaciones enviadas</h2>
            <p className="mt-0.5 text-sm text-muted">Personas que aún no han aceptado.</p>

            {invitaciones.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-8 text-center">
                <p className="text-sm text-muted">No hay invitaciones pendientes.</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {invitaciones.map((inv) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
                    key={inv.id}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.email}</p>
                      <p className="text-xs text-muted">Expira {inv.expira}</p>
                    </div>
                    <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                      Pendiente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </OrgShell>
  );
}
