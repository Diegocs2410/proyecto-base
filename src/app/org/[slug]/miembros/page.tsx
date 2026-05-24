import { OrgShell } from "@/components/org/org-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrgMiembros, getOrgPorSlug } from "@/lib/data/org";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function OrgMiembrosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const org = await getOrgPorSlug(slug);
  if (!org) notFound();

  const miembros = await getOrgMiembros(org.id);

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Equipo</h1>
            <p className="mt-1 text-sm text-muted">
              Todas las personas con acceso a {org.nombre}.
            </p>
          </div>
          <a
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
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
            <div className="grid grid-cols-[1fr_1.2fr_1fr_0.8fr] bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              <span>Nombre</span>
              <span>Correo</span>
              <span>Rol</span>
              <span>Desde</span>
            </div>
            {miembros.map((m) => (
              <div
                className="grid grid-cols-[1fr_1.2fr_1fr_0.8fr] items-center border-t border-border px-6 py-4 text-sm"
                key={m.id}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                    {m.nombre[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">{m.nombre}</span>
                </div>
                <span className="text-muted">{m.email}</span>
                <span className="text-muted">{m.rol}</span>
                <StatusBadge status={m.estado === "active" ? "success" : "warning"}>
                  {m.estado === "active" ? "Activo" : "Inactivo"}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </section>
    </OrgShell>
  );
}
