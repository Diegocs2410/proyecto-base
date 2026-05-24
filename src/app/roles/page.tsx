import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck } from "lucide-react";

interface Rol {
  id: string;
  nombre: string;
  alcance: string;
  permisos: number;
  organizaciones: number;
}

export default async function RolesPage() {
  const roles: Rol[] = [];

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Roles y permisos</h1>
            <p className="mt-1 text-sm text-muted">
              Define qué puede hacer cada tipo de usuario dentro de la plataforma.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4" />
            Crear rol
          </Button>
        </div>

        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No hay roles configurados</p>
            <p className="mt-1 text-sm text-muted">
              Crea roles para controlar el acceso de los usuarios a cada función.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr] bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              <span>Nombre del rol</span>
              <span>Alcance</span>
              <span>Permisos</span>
              <span>Organizaciones</span>
            </div>
            {roles.map((rol) => (
              <div
                className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr] items-center border-t border-border px-6 py-4 text-sm transition hover:bg-slate-50/50"
                key={rol.id}
              >
                <span className="font-medium text-foreground">{rol.nombre}</span>
                <span className="text-muted">{rol.alcance}</span>
                <span className="text-muted">{rol.permisos}</span>
                <span className="text-muted">{rol.organizaciones}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
