import { OrgShell } from "@/components/org/org-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { OrgContexto } from "@/lib/data/org";
import { formatFechaHoraCO } from "@/lib/i18n/co";
import {
  getResumenAgenda,
  listarCitasEnRango,
  listarRecursos,
  listarServicios,
} from "@/modules/agenda/queries";
import { FormularioCita, AccionesCita } from "@/modules/agenda/components/formulario-cita";
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export async function CalendarioPage({ org, slug }: { org: OrgContexto; slug: string }) {
  // Vista semanal centrada en hoy.
  const ahora = new Date();
  const inicioSemana = new Date(ahora);
  inicioSemana.setHours(0, 0, 0, 0);
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(finSemana.getDate() + 7);

  const [resumen, citas, servicios, recursos] = await Promise.all([
    getResumenAgenda(org.id),
    listarCitasEnRango(org.id, inicioSemana.toISOString(), finSemana.toISOString()),
    listarServicios(org.id, true),
    listarRecursos(org.id, true),
  ]);

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + i);
    return d;
  });

  const citasPorDia = new Map<string, typeof citas>();
  for (const cita of citas) {
    const clave = new Date(cita.iniciaEn).toDateString();
    const lista = citasPorDia.get(clave) ?? [];
    lista.push(cita);
    citasPorDia.set(clave, lista);
  }

  const setupCompleto = servicios.length > 0 && recursos.length > 0;

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
            <p className="mt-1 text-sm text-muted">
              Vista semanal de citas. {citas.length} esta semana.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-slate-50"
              href={`/reservar/${slug}`}
              target="_blank"
            >
              Ver página pública
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard icon={CalendarDays} label="Citas hoy" trend="confirmadas" value={String(resumen.citasHoy)} />
          <MetricCard icon={CheckCircle2} label="Esta semana" trend="próximas 7 días" value={String(resumen.citasSemana)} />
          <MetricCard icon={XCircle} label="No asistió (mes)" trend="seguimiento" value={String(resumen.noAsistioMes)} />
        </div>

        {!setupCompleto ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            <p className="font-semibold">Antes de agendar citas</p>
            <p className="mt-1">
              Configura al menos un{" "}
              <Link className="underline" href={`/org/${slug}/agenda/servicios`}>
                servicio
              </Link>{" "}
              y un{" "}
              <Link className="underline" href={`/org/${slug}/agenda/recursos`}>
                recurso
              </Link>{" "}
              (persona o espacio que atiende).
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Nueva cita</h2>
            <p className="mt-1 text-sm text-muted">Registra una cita interna sin pasar por la página pública.</p>
            <div className="mt-4">
              <FormularioCita
                recursos={recursos.map((r) => ({ id: r.id, nombre: r.nombre }))}
                servicios={servicios.map((s) => ({
                  id: s.id,
                  nombre: s.nombre,
                  duracionMin: s.duracionMin,
                }))}
                slug={slug}
                tenantId={org.id}
              />
            </div>
          </div>
        )}

        <div className="grid gap-3">
          <h2 className="text-base font-semibold text-foreground">Esta semana</h2>
          <div className="grid gap-3 lg:grid-cols-7">
            {diasSemana.map((dia) => {
              const clave = dia.toDateString();
              const citasDia = citasPorDia.get(clave) ?? [];
              const esHoy = dia.toDateString() === new Date().toDateString();
              return (
                <div
                  className={`rounded-2xl border ${esHoy ? "border-foreground/40 bg-card ring-1 ring-foreground/10" : "border-border bg-card"} p-3 shadow-sm`}
                  key={clave}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {dia.toLocaleDateString("es-CO", { weekday: "short", timeZone: "America/Bogota" })}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {dia.toLocaleDateString("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" })}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {citasDia.length === 0 ? (
                      <p className="text-xs text-muted">Sin citas</p>
                    ) : (
                      citasDia.map((cita) => (
                        <article
                          className="rounded-xl border border-border bg-background p-2 text-xs"
                          key={cita.id}
                          style={{ borderLeftColor: cita.color, borderLeftWidth: 3 }}
                        >
                          <p className="font-medium text-foreground">
                            {new Date(cita.iniciaEn).toLocaleTimeString("es-CO", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "America/Bogota",
                            })}
                          </p>
                          <p className="mt-1 truncate text-foreground">{cita.clienteNombre}</p>
                          <p className="truncate text-muted">{cita.servicioNombre}</p>
                          <p className="truncate text-muted">con {cita.recursoNombre}</p>
                          <div className="mt-2 flex items-center justify-between gap-1">
                            <CitaEstadoBadge estado={cita.estado} />
                            {cita.origen === "publico" && (
                              <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                público
                              </span>
                            )}
                          </div>
                          <AccionesCita citaId={cita.id} estado={cita.estado} slug={slug} tenantId={org.id} />
                        </article>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Próximas citas</h2>
          <p className="mt-1 text-sm text-muted">Lista detallada con datos de contacto.</p>
          {citas.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No hay citas registradas esta semana.</p>
          ) : (
            <div className="mt-4 grid gap-2">
              {citas.map((cita) => (
                <div
                  className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-2xl border border-border bg-background p-3 text-sm"
                  key={cita.id}
                >
                  <div>
                    <p className="font-medium text-foreground">{cita.clienteNombre}</p>
                    <p className="text-xs text-muted">
                      {cita.servicioNombre} · con {cita.recursoNombre} ·{" "}
                      {formatFechaHoraCO(cita.iniciaEn)}
                    </p>
                    {(cita.clienteTelefono || cita.clienteEmail) && (
                      <p className="text-xs text-muted">
                        {[cita.clienteTelefono, cita.clienteEmail].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {cita.notas && (
                      <p className="mt-1 text-xs text-muted">{cita.notas}</p>
                    )}
                  </div>
                  <CitaEstadoBadge estado={cita.estado} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </OrgShell>
  );
}

function CitaEstadoBadge({ estado }: { estado: "confirmada" | "completada" | "no_asistio" | "cancelada" }) {
  const map = {
    confirmada: { status: "info" as const, label: "Confirmada" },
    completada: { status: "success" as const, label: "Completada" },
    no_asistio: { status: "warning" as const, label: "No asistió" },
    cancelada: { status: "danger" as const, label: "Cancelada" },
  };
  const cfg = map[estado];
  return <StatusBadge status={cfg.status}>{cfg.label}</StatusBadge>;
}
