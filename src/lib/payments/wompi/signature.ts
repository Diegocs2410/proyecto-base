import { createHash } from "node:crypto";

/**
 * Firma de integridad para Web Checkout.
 * SHA256(reference + amountInCents + currency + integritySecret)
 */
export function calcularFirmaIntegridad(params: {
  reference: string;
  amountInCents: number;
  currency: string;
  integritySecret: string;
}): string {
  const concatenado = `${params.reference}${params.amountInCents}${params.currency}${params.integritySecret}`;
  return createHash("sha256").update(concatenado).digest("hex");
}

export interface WompiWebhookPayload {
  event: string;
  data: {
    transaction?: {
      id: string;
      status: string;
      amount_in_cents: number;
      reference: string;
      customer_email?: string;
      payment_method_type?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  signature: {
    properties: string[];
    checksum: string;
  };
  timestamp: number;
  sent_at: string;
  environment: "test" | "prod";
}

/**
 * Verifica el checksum del webhook según docs Wompi:
 * SHA256(valor1 + valor2 + ... + timestamp + eventsSecret)
 * donde valorN se obtiene leyendo properties[N] del payload (notación dot).
 */
export function verificarFirmaWebhook(
  payload: WompiWebhookPayload,
  eventsSecret: string,
): boolean {
  if (!payload?.signature?.checksum || !Array.isArray(payload.signature.properties)) {
    return false;
  }

  const valoresConcatenados = payload.signature.properties
    .map((prop) => leerPropiedad(payload, prop))
    .join("");

  const concatenado = `${valoresConcatenados}${payload.timestamp}${eventsSecret}`;
  const calculado = createHash("sha256").update(concatenado).digest("hex");

  return timingSafeEqual(calculado, payload.signature.checksum);
}

function leerPropiedad(payload: WompiWebhookPayload, path: string): string {
  const partes = path.split(".");
  let actual: unknown = payload.data;
  for (const parte of partes) {
    if (actual && typeof actual === "object" && parte in actual) {
      actual = (actual as Record<string, unknown>)[parte];
    } else {
      return "";
    }
  }
  return actual == null ? "" : String(actual);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let resultado = 0;
  for (let i = 0; i < a.length; i++) {
    resultado |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return resultado === 0;
}
