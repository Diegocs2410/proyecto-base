import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/ui/plan-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { CreditCard, LayoutGrid, Plus, Users } from "lucide-react";

const planes = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    nombre: "Starter",
    precio: "Gratis",
    descripcion: "Ideal para equipos pequeños que están empezando.",
    usuarios: "5",
    espacios: "1",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    nombre: "Team",
    precio: "$29/mes",
    descripcion: "Para equipos en crecimiento con más colaboración.",
    usuarios: "25",
    espacios: "5",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    nombre: "Business",
    precio: "$99/mes",
    descripcion: "Potencia avanzada para empresas en expansión.",
    usuarios: "100",
    espacios: "20",
  },
  {
    id: "d4e5f6a7-b8c9-0123-def0-234567890123",
    nombre: "Enterprise",
    precio: "A la medida",
    descripcion: "Solución personalizada para grandes organizaciones.",
    usuarios: "Ilimitado",
    espacios: "Ilimitados",
  },
];

export default async function PlanesPage() {
  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Planes y facturación</h1>
            <p className="mt-1 text-sm text-muted">
              Gestiona los planes de suscripción disponibles en la plataforma.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo plan
          </Button>
        </div>

        {planes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <CreditCard className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No hay planes configurados todavía</p>
            <p className="mt-1 text-sm text-muted">
              Crea el primer plan para empezar a gestionar las suscripciones.
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
                  <PlanBadge label={plan.nombre} />
                  <StatusBadge status="success">Activo</StatusBadge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{plan.precio}</p>
                  <p className="mt-1 text-sm text-muted">{plan.descripcion}</p>
                </div>
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Users className="h-4 w-4" />
                    <span>{plan.usuarios} usuarios</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <LayoutGrid className="h-4 w-4" />
                    <span>{plan.espacios} espacios</span>
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
