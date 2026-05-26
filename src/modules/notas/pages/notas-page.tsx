import { OrgShell } from "@/components/org/org-shell";
import { createClient } from "@/lib/supabase/server";
import type { OrgContexto } from "@/lib/data/org";
import { listarNotas } from "@/modules/notas/queries";
import { BotonEliminarNota, FormularioNota } from "@/modules/notas/formulario-nota";

export async function NotasPage({ org, slug }: { org: OrgContexto; slug: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const notas = await listarNotas(org.id);

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notas internas</h1>
          <p className="mt-1 text-sm text-muted">
            Espacio compartido para anotaciones rápidas de tu equipo.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <FormularioNota tenantId={org.id} slug={slug} />
        </div>

        <div className="grid gap-3">
          {notas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <p className="text-sm text-muted">
                Todavía no hay notas. Sé el primero en agregar una.
              </p>
            </div>
          ) : (
            notas.map((nota) => (
              <article
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                key={nota.id}
              >
                <p className="whitespace-pre-wrap text-sm text-foreground">{nota.cuerpo}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                  <span>
                    {nota.autor} · {nota.fecha}
                  </span>
                  {nota.autorId === user?.id && (
                    <BotonEliminarNota notaId={nota.id} slug={slug} tenantId={org.id} />
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </OrgShell>
  );
}
