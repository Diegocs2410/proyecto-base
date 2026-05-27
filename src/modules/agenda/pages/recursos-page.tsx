import { OrgShell } from "@/components/org/org-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import type { OrgContexto } from "@/lib/data/org";
import { listarHorariosPorRecurso, listarRecursos } from "@/modules/agenda/queries";
import {
  FormularioRecurso,
  BotonArchivarRecurso,
} from "@/modules/agenda/components/formulario-recurso";
import { EditorHorarios } from "@/modules/agenda/components/editor-horarios";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export async function RecursosPage({ org, slug }: { org: OrgContexto; slug: string }) {
  const recursos = await listarRecursos(org.id, false);

  const horariosPorRecurso = await Promise.all(
    recursos.map(async (r) => ({
      recursoId: r.id,
      horarios: await listarHorariosPorRecurso(r.id),
    })),
  );

  const mapaHorarios = new Map(horariosPorRecurso.map((h) => [h.recursoId, h.horarios]));

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recursos</h1>
          <p className="mt-1 text-sm text-muted">
            Personas, espacios o equipos que prestan los servicios. Cada recurso tiene
            sus propios horarios de atención.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Nuevo recurso</h2>
          <div className="mt-4">
            <FormularioRecurso slug={slug} tenantId={org.id} />
          </div>
        </div>

        <div className="grid gap-4">
          {recursos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <p className="text-sm text-muted">Todavía no hay recursos registrados.</p>
            </div>
          ) : (
            recursos.map((r) => {
              const horarios = mapaHorarios.get(r.id) ?? [];
              return (
                <article
                  className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                  key={r.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-1 h-10 w-10 rounded-xl"
                        style={{ backgroundColor: r.color }}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{r.nombre}</p>
                          {!r.activo && <StatusBadge status="warning">Archivado</StatusBadge>}
                        </div>
                        <p className="text-xs text-muted">
                          {r.tipo === "persona"
                            ? "Persona"
                            : r.tipo === "espacio"
                              ? "Espacio"
                              : "Equipo"}
                          {r.email && ` · ${r.email}`}
                        </p>
                      </div>
                    </div>
                    {r.activo && (
                      <BotonArchivarRecurso
                        nombre={r.nombre}
                        recursoId={r.id}
                        slug={slug}
                        tenantId={org.id}
                      />
                    )}
                  </div>

                  {r.activo && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        Horarios semanales
                      </p>
                      <EditorHorarios
                        diasNombres={DIAS}
                        horarios={horarios}
                        recursoId={r.id}
                        slug={slug}
                        tenantId={org.id}
                      />
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </OrgShell>
  );
}
