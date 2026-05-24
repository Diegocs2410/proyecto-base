import { OrgShell } from "@/components/org/org-shell";
import { Button } from "@/components/ui/button";
import { getOrgPorSlug } from "@/lib/data/org";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function OrgConfiguracionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const org = await getOrgPorSlug(slug);
  if (!org) notFound();

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Configuración</h1>
          <p className="mt-1 text-sm text-muted">Ajusta los datos de {org.nombre}.</p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Información general</h2>
                <p className="mt-0.5 text-sm text-muted">Nombre, identificador y datos básicos.</p>
              </div>
              <Button variant="secondary">Editar</Button>
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Nombre</p>
                <p className="text-sm font-medium text-foreground">{org.nombre}</p>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Identificador</p>
                <p className="font-mono text-sm text-slate-700">{org.slug}</p>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Plan</p>
                <p className="text-sm font-medium text-foreground">{org.plan}</p>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Estado</p>
                <p className="text-sm font-medium text-green-600">Activa</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Zona horaria e idioma</h2>
                <p className="mt-0.5 text-sm text-muted">Configuración regional de la organización.</p>
              </div>
              <Button variant="secondary">Editar</Button>
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Zona horaria</p>
                <p className="text-sm font-medium text-foreground">América/Bogotá (UTC-5)</p>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Idioma</p>
                <p className="text-sm font-medium text-foreground">Español (Colombia)</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
            <h2 className="text-base font-semibold text-red-700">Zona de peligro</h2>
            <p className="mt-0.5 text-sm text-red-600">
              Estas acciones son permanentes y no se pueden deshacer.
            </p>
            <div className="mt-4">
              <Button variant="secondary">Eliminar organización</Button>
            </div>
          </div>
        </div>
      </section>
    </OrgShell>
  );
}
