import { OrgShell } from "@/components/org/org-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import type { OrgContexto } from "@/lib/data/org";
import { formatCOP } from "@/lib/i18n/co";
import { listarServicios } from "@/modules/agenda/queries";
import { FormularioServicio, BotonArchivarServicio } from "@/modules/agenda/components/formulario-servicio";

export async function ServiciosPage({ org, slug }: { org: OrgContexto; slug: string }) {
  const servicios = await listarServicios(org.id, false);

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Servicios</h1>
          <p className="mt-1 text-sm text-muted">
            Define los servicios que ofreces: nombre, duración, precio y color para el calendario.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Nuevo servicio</h2>
          <div className="mt-4">
            <FormularioServicio slug={slug} tenantId={org.id} />
          </div>
        </div>

        <div className="grid gap-3">
          {servicios.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <p className="text-sm text-muted">Todavía no hay servicios registrados.</p>
            </div>
          ) : (
            servicios.map((s) => (
              <article
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
                key={s.id}
              >
                <span
                  aria-hidden
                  className="h-10 w-10 rounded-xl"
                  style={{ backgroundColor: s.color }}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{s.nombre}</p>
                    {!s.activo && <StatusBadge status="warning">Archivado</StatusBadge>}
                  </div>
                  <p className="text-xs text-muted">
                    {s.duracionMin} min · {formatCOP(s.precioCop)}
                  </p>
                  {s.descripcion && (
                    <p className="mt-1 text-xs text-muted">{s.descripcion}</p>
                  )}
                </div>
                {s.activo && (
                  <BotonArchivarServicio
                    nombre={s.nombre}
                    servicioId={s.id}
                    slug={slug}
                    tenantId={org.id}
                  />
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </OrgShell>
  );
}
