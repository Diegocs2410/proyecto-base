import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrganizaciones } from "@/lib/data/dashboard";
import { Building2, ExternalLink } from "lucide-react";
import { NuevaOrgModal } from "@/app/organizaciones/nueva-org-modal";
import Link from "next/link";

export default async function OrganizacionesPage() {
  const organizaciones = await getOrganizaciones();

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Organizaciones</h1>
            <p className="mt-1 text-sm text-muted">
              Todas las empresas registradas en la plataforma.
            </p>
          </div>
          <NuevaOrgModal />
        </div>

        {organizaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Building2 className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No hay organizaciones todavía</p>
            <p className="mt-1 text-sm text-muted">Crea la primera para empezar a gestionar tu plataforma.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.7fr_0.6fr] bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              <span>Organización</span>
              <span>Plan</span>
              <span>Miembros</span>
              <span>Estado</span>
              <span />
            </div>
            {organizaciones.map((org) => (
              <div
                className="grid grid-cols-[1.5fr_1fr_0.8fr_0.7fr_0.6fr] items-center border-t border-border px-6 py-4 text-sm transition hover:bg-slate-50/50"
                key={org.id}
              >
                <span className="font-medium text-foreground">{org.nombre}</span>
                <span className="text-muted">{org.plan}</span>
                <span className="text-muted">{org.miembros}</span>
                <StatusBadge status={org.estado === "active" ? "success" : "warning"}>
                  {org.estado === "active" ? "Activa" : "Inactiva"}
                </StatusBadge>
                <Link
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  href={`/org/${org.slug}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Entrar
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
