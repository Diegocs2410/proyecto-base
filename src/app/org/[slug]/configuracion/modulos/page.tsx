import { OrgShell } from "@/components/org/org-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrgPorSlug, getMembresiaUsuario } from "@/lib/data/org";
import { getSubscription } from "@/lib/data/billing";
import { getEstadoModulos } from "@/lib/modules/loader";
import { can } from "@/lib/security/permissions";
import { createClient } from "@/lib/supabase/server";
import { planAlcanza } from "@/modules/types";
import { notFound, redirect } from "next/navigation";
import { ToggleModulo } from "./toggle-modulo";

export default async function ModulosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ activar?: string }>;
}) {
  const { slug } = await params;
  const { activar } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const org = await getOrgPorSlug(slug);
  if (!org) notFound();

  const membresia = await getMembresiaUsuario(user.id);
  const puedeGestionar = can(
    membresia
      ? { tenantId: membresia.tenantId, tenantName: membresia.nombre, role: membresia.rol }
      : null,
    "modules.manage",
  );

  const [estado, subscription] = await Promise.all([
    getEstadoModulos(org.id),
    getSubscription(org.id),
  ]);

  const planActual = subscription?.planCode ?? "starter";

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Módulos</h1>
          <p className="mt-1 text-sm text-muted">
            Activa los módulos que tu equipo necesita. Algunos requieren un plan superior.
          </p>
        </div>

        {activar && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Activa el módulo <strong>{activar}</strong> para acceder a esa sección.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {estado.map(({ manifest, enabled }) => {
            const Icono = manifest.icon;
            const planOK = planAlcanza(planActual, manifest.minPlanCode);
            return (
              <div
                className={`flex flex-col gap-3 rounded-3xl border p-5 shadow-sm ${
                  enabled ? "border-slate-900 bg-slate-50" : "border-border bg-card"
                }`}
                key={manifest.key}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icono className="h-5 w-5" />
                  </div>
                  {enabled ? (
                    <StatusBadge status="success">Activo</StatusBadge>
                  ) : !planOK ? (
                    <StatusBadge status="warning">Plan superior</StatusBadge>
                  ) : null}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{manifest.name}</p>
                  {manifest.category && (
                    <p className="text-xs uppercase tracking-wide text-muted">
                      {manifest.category}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm text-muted">{manifest.description}</p>
                </div>
                <p className="text-xs text-muted">
                  Plan mínimo: <span className="font-medium">{manifest.minPlanCode}</span>
                </p>
                {puedeGestionar && (
                  <div className="pt-2">
                    <ToggleModulo
                      deshabilitado={!planOK}
                      enabled={enabled}
                      moduleKey={manifest.key}
                      razonDeshabilitado={`Requiere plan ${manifest.minPlanCode} o superior.`}
                      slug={slug}
                      tenantId={org.id}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {estado.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-sm text-muted">
              Todavía no hay módulos disponibles en la plataforma.
            </p>
          </div>
        )}
      </section>
    </OrgShell>
  );
}
