import { LandingPage } from "@/app/(public)/landing-page";
import { AppShell } from "@/components/layout/app-shell";
import { AuditTimeline } from "@/components/ui/audit-timeline";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PlanBadge } from "@/components/ui/plan-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAuditReciente,
  getEstadisticasDashboard,
  getOrganizaciones,
} from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import { Building2, CheckCircle2, ExternalLink, Plus, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Visitantes anónimos ven la landing pública.
  if (!user) {
    return <LandingPage />;
  }

  // El proxy ya redirige a /org/[slug] a usuarios no platform_admin,
  // así que aquí solo llegan platform admins.
  const [stats, organizaciones, auditLogs] = await Promise.all([
    getEstadisticasDashboard(),
    getOrganizaciones(),
    getAuditReciente(),
  ]);

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <PlanBadge label="Administrador de plataforma" />
              <StatusBadge status="success">Sistema activo</StatusBadge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Gestiona organizaciones, usuarios y espacios de trabajo desde un solo lugar.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Administración global con seguridad, roles, límites y auditoría como piezas centrales
              desde el inicio.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button>
              <Plus className="h-4 w-4" />
              Nueva organización
            </Button>
            <Button variant="secondary">
              <ShieldCheck className="h-4 w-4" />
              Revisar seguridad
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Building2}
            label="Organizaciones activas"
            trend="activas ahora"
            value={String(stats.organizaciones)}
          />
          <MetricCard
            icon={Users}
            label="Usuarios registrados"
            trend="en la plataforma"
            value={String(stats.usuarios)}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Roles configurados"
            trend="de acceso"
            value={String(stats.roles)}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Disponibilidad"
            trend="Vercel + Supabase"
            value="99.9%"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Organizaciones</h2>
                <p className="text-sm text-muted">
                  Organizaciones registradas, sus planes y estado operativo.
                </p>
              </div>
              <Button variant="secondary">Ver todas</Button>
            </div>

            {organizaciones.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-muted">Aún no hay organizaciones registradas.</p>
                <p className="mt-1 text-xs text-muted">Crea la primera para comenzar.</p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-[1.5fr_0.9fr_0.7fr_0.7fr_auto] bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                  <span>Organización</span>
                  <span>Plan</span>
                  <span>Miembros</span>
                  <span>Estado</span>
                  <span />
                </div>
                {organizaciones.map((org) => (
                  <div
                    className="grid grid-cols-[1.5fr_0.9fr_0.7fr_0.7fr_auto] items-center border-t border-border px-4 py-4 text-sm"
                    key={org.id}
                  >
                    <span className="font-medium text-foreground">{org.nombre}</span>
                    <span className="text-muted">{org.plan}</span>
                    <span className="text-muted">{org.miembros}</span>
                    <StatusBadge status={org.estado === "active" ? "success" : "warning"}>
                      {org.estado === "active"
                        ? "Activa"
                        : org.estado === "trialing"
                          ? "Prueba"
                          : "Inactiva"}
                    </StatusBadge>
                    <Link
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      href={`/org/${org.slug}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Entrar
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {auditLogs.length > 0 ? (
            <AuditTimeline
              events={auditLogs.map((l) => ({
                title: l.titulo,
                description: l.descripcion,
                time: l.tiempo,
              }))}
            />
          ) : (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Auditoría reciente</h2>
              <p className="mt-2 text-sm text-muted">Aún no hay eventos registrados.</p>
            </div>
          )}
        </div>

        {organizaciones.length === 0 && (
          <EmptyState
            action="Crear organización"
            description="La base de datos y autenticación están listas. Crea tu primera organización para comenzar a gestionar usuarios, roles y espacios de trabajo."
            title="Crea tu primera organización"
          />
        )}
      </section>
    </AppShell>
  );
}
