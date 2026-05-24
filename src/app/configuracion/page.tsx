import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Bell, Globe, ShieldCheck } from "lucide-react";

export default async function ConfiguracionPage() {
  const secciones = [
    {
      icono: Globe,
      titulo: "General",
      descripcion: "Nombre de la plataforma, zona horaria e idioma predeterminado.",
    },
    {
      icono: ShieldCheck,
      titulo: "Seguridad",
      descripcion: "Política de contraseñas y autenticación de dos pasos.",
    },
    {
      icono: Bell,
      titulo: "Notificaciones",
      descripcion: "Correos automáticos y alertas del sistema.",
    },
  ];

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Configuración</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Ajusta las opciones generales de tu plataforma.</p>
        </div>

        <div className="grid gap-4">
          {secciones.map(({ icono: Icono, titulo, descripcion }) => (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm" key={titulo}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/30">
                    <Icono className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{titulo}</h2>
                    <p className="mt-1 text-sm text-muted">{descripcion}</p>
                  </div>
                </div>
                <Button variant="secondary">Editar</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
