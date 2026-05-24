import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMiembrosGlobales } from "@/lib/data/dashboard";
import { UserPlus, Users } from "lucide-react";
import Link from "next/link";

export default async function MiembrosPage() {
  const miembros = await getMiembrosGlobales();

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
          <a
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            href="/organizaciones"
          >
            <UserPlus className="h-4 w-4" />
            Invitar desde org
          </a>
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
            <div className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_0.7fr] bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              <span>Nombre</span>
              <span>Correo</span>
              <span>Organización</span>
              <span>Rol</span>
              <span>Estado</span>
            </div>
            {miembros.map((m) => (
              <div
                className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_0.7fr] items-center border-t border-border px-6 py-4 text-sm transition hover:bg-slate-50/50"
                key={m.id}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                    {m.nombre[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground truncate">{m.nombre}</span>
                </div>
                <span className="text-muted truncate">{m.email}</span>
                {m.slugOrg ? (
                  <Link
                    className="text-primary hover:underline truncate"
                    href={`/org/${m.slugOrg}`}
                  >
                    {m.organizacion}
                  </Link>
                ) : (
                  <span className="text-muted">{m.organizacion}</span>
                )}
                <span className="text-muted">{m.rol}</span>
                <StatusBadge status={m.estado === "active" ? "success" : "warning"}>
                  {m.estado === "active" ? "Activo" : "Inactivo"}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
