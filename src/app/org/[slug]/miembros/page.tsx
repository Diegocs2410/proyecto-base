import { FilaMiembro } from "@/app/org/[slug]/miembros/fila-miembro";
import { OrgShell } from "@/components/org/org-shell";
import { getOrgMiembros, getOrgPorSlug } from "@/lib/data/org";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

const ROLES_PUEDEN_GESTIONAR = ["platform_admin", "tenant_owner", "tenant_admin"];

export default async function OrgMiembrosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const org = await getOrgPorSlug(slug);
  if (!org) notFound();

  const miembros = await getOrgMiembros(org.id);
  const miActual = miembros.find((m) => m.userId === user.id);
  const canManage = miActual ? ROLES_PUEDEN_GESTIONAR.includes(miActual.rolCode) : false;

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Equipo</h1>
            <p className="mt-1 text-sm text-muted">
              {miembros.length} persona{miembros.length !== 1 ? "s" : ""} con acceso a {org.nombre}.
            </p>
          </div>
          <a
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            href={`/org/${slug}/invitar`}
          >
            Invitar persona
          </a>
        </div>

        {miembros.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aún no hay miembros</p>
            <p className="mt-1 text-sm text-muted">Invita a tu equipo para empezar a colaborar.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="grid grid-cols-[1fr_1.2fr_1.2fr_auto] bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              <span>Miembro</span>
              <span>Desde</span>
              <span>Rol</span>
              <span />
            </div>
            {miembros.map((m) => (
              <FilaMiembro
                canManage={canManage}
                currentUserId={user.id}
                key={m.id}
                miembro={m}
                tenantId={org.id}
              />
            ))}
          </div>
        )}
      </section>
    </OrgShell>
  );
}
