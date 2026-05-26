import { getWompiConfig } from "./client";
import { calcularFirmaIntegridad } from "./signature";

export interface ParamsCheckout {
  tenantId: string;
  planId: string;
  planCode: string;
  priceCop: number;
  emailCliente: string;
  nombreCliente?: string;
  redirectUrl: string;
}

export interface ResultadoCheckout {
  url: string;
  reference: string;
}

/**
 * Genera la URL de Wompi Web Checkout para upgrade/renovación.
 * Wompi redirige al usuario tras pagar a `redirectUrl` con query params.
 *
 * Reference structure: `<tenantId>:<planId>:<timestamp>` — único e idempotente.
 * Permite que el webhook reconcilie qué tenant pagó qué plan.
 */
export function construirUrlCheckout(params: ParamsCheckout): ResultadoCheckout {
  const cfg = getWompiConfig();
  const amountInCents = params.priceCop * 100;
  const reference = `${params.tenantId}:${params.planId}:${Date.now()}`;
  const currency = "COP";

  const signature = calcularFirmaIntegridad({
    reference,
    amountInCents,
    currency,
    integritySecret: cfg.integritySecret,
  });

  const queryParams = new URLSearchParams({
    "public-key": cfg.publicKey,
    currency,
    "amount-in-cents": String(amountInCents),
    reference,
    "signature:integrity": signature,
    "redirect-url": params.redirectUrl,
    "customer-data:email": params.emailCliente,
  });

  if (params.nombreCliente) {
    queryParams.set("customer-data:full-name", params.nombreCliente);
  }

  return {
    url: `${cfg.checkoutBaseUrl}?${queryParams.toString()}`,
    reference,
  };
}

/**
 * Parsea la reference para recuperar tenantId y planId del webhook.
 */
export function parsearReference(
  reference: string,
): { tenantId: string; planId: string; timestamp: number } | null {
  const partes = reference.split(":");
  if (partes.length !== 3) return null;
  const [tenantId, planId, ts] = partes;
  const timestamp = Number(ts);
  if (!tenantId || !planId || !Number.isFinite(timestamp)) return null;
  return { tenantId, planId, timestamp };
}
