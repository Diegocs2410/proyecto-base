import { AppShell } from "@/components/layout/app-shell";
import { PlanBadge } from "@/components/ui/plan-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPlanesActivos } from "@/lib/data/billing";
import { formatCOP } from "@/lib/i18n/co";
import { CreditCard, LayoutGrid, Users } from "lucide-react";

const DESCRIPCIONES: Record<string, string> = {
  starter: "Ideal para equipos pequeños que están empezando.",
  team: "Para equipos en crecimiento con más colaboración.",
  business: "Potencia avanzada para empresas en expansión.",
  enterprise: "Solución personalizada para grandes organizaciones.",
};

export default async function PlanesPage() {
  const planes = await getPlanesActivos();

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Planes y facturación</h1>
          <p className="mt-1 text-sm text-muted">
            Catálogo de planes disponibles en la plataforma.
          </p>
        </div>

        {planes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <CreditCard className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No hay planes configurados todavía</p>
            <p className="mt-1 text-sm text-muted">
              Crea el primer plan en Supabase Studio para empezar a gestionar suscripciones.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {planes.map((plan) => (
              <div
                className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
                key={plan.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <PlanBadge label={plan.name} />
                  <StatusBadge status="success">Activo</StatusBadge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {plan.priceCop > 0 ? `${formatCOP(plan.priceCop)} / mes` : "Gratis"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {DESCRIPCIONES[plan.code] ?? "Plan personalizado."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Users className="h-4 w-4" />
                    <span>{plan.maxUsers} usuarios</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <LayoutGrid className="h-4 w-4" />
                    <span>{plan.maxWorkspaces} espacios</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
