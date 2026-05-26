import { OrgShell } from "@/components/org/org-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrgPorSlug, getMembresiaUsuario } from "@/lib/data/org";
import {
  getHistorialPagos,
  getPlanesActivos,
  getSubscription,
} from "@/lib/data/billing";
import { formatCOP, formatFechaCO, formatFechaHoraCO } from "@/lib/i18n/co";
import { can } from "@/lib/security/permissions";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { BotonCancelar, BotonUpgrade } from "./acciones-billing";

const ETIQUETAS_ESTADO: Record<string, string> = {
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
};

const COLORES_ESTADO: Record<string, "success" | "warning" | "danger" | "info"> = {
  trialing: "info",
  active: "success",
  past_due: "warning",
  canceled: "danger",
};

const ESTADOS_TX: Record<string, string> = {
  APPROVED: "Aprobada",
  DECLINED: "Rechazada",
  VOIDED: "Anulada",
  ERROR: "Error",
  PENDING: "Pendiente",
};

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pago?: string }>;
}) {
  const { slug } = await params;
  const { pago } = await searchParams;

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
    "billing.manage",
  );

  const [subscription, planes, historial] = await Promise.all([
    getSubscription(org.id),
    getPlanesActivos(),
    getHistorialPagos(org.id),
  ]);

  return (
    <OrgShell org={org}>
      <section className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Facturación</h1>
          <p className="mt-1 text-sm text-muted">
            Plan, próximos cobros e historial de pagos de {org.nombre}.
          </p>
        </div>

        {pago === "procesando" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Tu pago se está procesando. Cuando Wompi confirme la transacción verás el plan actualizado aquí (puede tomar unos segundos).
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Plan actual</p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">
                {subscription?.planName ?? "Sin suscripción"}
              </h2>
              {subscription && (
                <p className="mt-1 text-sm text-muted">
                  {subscription.priceCop > 0
                    ? `${formatCOP(subscription.priceCop)} / mes`
                    : "Gratis"}
                </p>
              )}
            </div>
            {subscription && (
              <StatusBadge status={COLORES_ESTADO[subscription.status]}>
                {ETIQUETAS_ESTADO[subscription.status] ?? subscription.status}
              </StatusBadge>
            )}
          </div>

          {subscription && (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {subscription.status === "trialing" && subscription.trialEndsAt && (
                <Dato
                  etiqueta="Prueba hasta"
                  valor={formatFechaCO(subscription.trialEndsAt)}
                />
              )}
              {subscription.currentPeriodEnd && subscription.status === "active" && (
                <Dato
                  etiqueta={subscription.cancelAtPeriodEnd ? "Acceso hasta" : "Próximo cobro"}
                  valor={formatFechaCO(subscription.currentPeriodEnd)}
                />
              )}
              {subscription.cancelAtPeriodEnd && (
                <Dato etiqueta="Estado" valor="Cancelación programada" />
              )}
            </div>
          )}

          {subscription && puedeGestionar && subscription.status !== "canceled" && subscription.status !== "trialing" && (
            <div className="mt-5 border-t border-border pt-5">
              <BotonCancelar tenantId={org.id} cancelado={subscription.cancelAtPeriodEnd} />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground">Planes disponibles</h3>
          <p className="mt-0.5 text-sm text-muted">
            {puedeGestionar
              ? "Elige el plan que mejor se ajuste a tu equipo."
              : "Solo el dueño de la organización puede cambiar de plan."}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {planes.map((plan) => {
              const esActual = subscription?.planId === plan.id;
              const esGratis = plan.priceCop <= 0;
              return (
                <div
                  className={`flex flex-col rounded-3xl border p-5 shadow-sm ${
                    esActual ? "border-slate-900 bg-slate-50" : "border-border bg-card"
                  }`}
                  key={plan.id}
                >
                  <p className="text-sm font-medium text-muted">{plan.name}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {esGratis ? "Gratis" : formatCOP(plan.priceCop)}
                  </p>
                  {!esGratis && <p className="text-xs text-muted">por mes</p>}
                  <ul className="mt-4 grid gap-1.5 text-sm text-muted">
                    <li>Hasta {plan.maxUsers} usuarios</li>
                    <li>Hasta {plan.maxWorkspaces} espacios de trabajo</li>
                  </ul>
                  <div className="mt-auto pt-5">
                    {esActual ? (
                      <p className="rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white">
                        Plan actual
                      </p>
                    ) : puedeGestionar ? (
                      <BotonUpgrade
                        tenantId={org.id}
                        slug={slug}
                        planId={plan.id}
                        etiqueta={esGratis ? "Contactar ventas" : "Contratar"}
                        destacado={!esGratis}
                        deshabilitado={esGratis}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Historial de pagos</h3>
          <p className="mt-0.5 text-sm text-muted">Últimas transacciones reportadas por Wompi.</p>
          {historial.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-8 text-center">
              <p className="text-sm text-muted">Todavía no hay pagos registrados.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Monto</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historial.map((evento) => (
                    <tr key={evento.id}>
                      <td className="py-3">{formatFechaHoraCO(evento.fecha)}</td>
                      <td className="py-3 text-muted">{evento.tipo}</td>
                      <td className="py-3 font-medium">
                        {evento.monto > 0 ? formatCOP(evento.monto) : "—"}
                      </td>
                      <td className="py-3">{ESTADOS_TX[evento.estado] ?? evento.estado}</td>
                      <td className="py-3 font-mono text-xs text-muted">
                        {evento.transactionId ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </OrgShell>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{etiqueta}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{valor}</p>
    </div>
  );
}
