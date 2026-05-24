import { AppShell } from "@/components/layout/app-shell";
import { getAuditReciente } from "@/lib/data/dashboard";
import { ClipboardList } from "lucide-react";

export default async function AuditoriaPage() {
  const logs = await getAuditReciente();

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Auditoría</h1>
          <p className="mt-1 text-sm text-muted">
            Registro de todas las acciones importantes realizadas en la plataforma.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">Nada por aquí todavía</p>
            <p className="mt-1 text-sm text-muted">
              Las acciones importantes se registrarán automáticamente aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="grid grid-cols-[1.5fr_1.5fr_0.5fr] bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              <span>Acción</span>
              <span>Detalles</span>
              <span>Hace</span>
            </div>
            {logs.map((log) => (
              <div
                className="grid grid-cols-[1.5fr_1.5fr_0.5fr] items-center border-t border-border px-6 py-4 text-sm transition hover:bg-slate-50/50"
                key={log.id}
              >
                <span className="font-medium text-foreground">{log.titulo}</span>
                <span className="text-muted">{log.descripcion}</span>
                <span className="text-muted">{log.tiempo}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
