import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";

export default async function MiembrosPage() {
  const miembros: never[] = [];

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Miembros</h1>
            <p className="mt-1 text-sm text-muted">
              Usuarios con acceso activo en todas las organizaciones.
            </p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4" />
            Invitar miembro
          </Button>
        </div>

        {miembros.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Users className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">Aún no hay miembros registrados</p>
            <p className="mt-1 text-sm text-muted">Los usuarios aparecerán aquí una vez se unan a una organización.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_0.8fr_0.7fr] bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              <span>Nombre</span>
              <span>Correo</span>
              <span>Organización</span>
              <span>Rol</span>
              <span>Estado</span>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
