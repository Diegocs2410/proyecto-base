import { OrgShell } from "@/components/org/org-shell";
import { getInvitacionesPendientes, getOrgPorSlug } from "@/lib/data/org";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { InvitarForm } from "./invitar-form";

export default async function InvitarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const org = await getOrgPorSlug(slug);
  if (!org) notFound();

  const invitaciones = await getInvitacionesPendientes(org.id);

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invitar personas</h1>
          <p className="mt-1 text-sm text-muted">
            Agrega personas a {org.nombre} por correo electrónico.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <InvitarForm orgId={org.id} slug={slug} />

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Invitaciones pendientes</h2>
            <p className="mt-0.5 text-sm text-muted">Personas que aún no han aceptado.</p>

            {invitaciones.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-8 text-center">
                <p className="text-sm text-muted">No hay invitaciones pendientes.</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {invitaciones.map((inv) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
                    key={inv.id}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.email}</p>
                      <p className="text-xs text-muted">{inv.rol} · Expira {inv.expira}</p>
                    </div>
                    <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                      Pendiente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </OrgShell>
  );
}
