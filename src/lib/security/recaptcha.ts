import { logger } from "@/lib/log";

const log = logger("recaptcha");

/**
 * Verifica un token reCAPTCHA v3 contra Google.
 * Si RECAPTCHA_SECRET_KEY no está configurado, devuelve true en dev (con warning)
 * para no bloquear flujos durante setup. En producción, configurar la clave es obligatorio
 * para que la verificación rechace bots.
 *
 * Para obtener claves: https://www.google.com/recaptcha/admin/create
 * - Site Key (pública) → NEXT_PUBLIC_RECAPTCHA_SITE_KEY
 * - Secret Key → RECAPTCHA_SECRET_KEY
 */
export async function verificarRecaptcha(
  token: string,
  accionEsperada: string,
  umbralScore = 0.5,
): Promise<{ ok: boolean; score?: number; error?: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    log.warn("RECAPTCHA_SECRET_KEY no está configurado — permitiendo solicitud sin verificar");
    return { ok: true, score: undefined };
  }

  if (!token || token.length < 10) {
    return { ok: false, error: "Token reCAPTCHA inválido." };
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = (await res.json()) as {
      success: boolean;
      score?: number;
      action?: string;
      "error-codes"?: string[];
    };

    if (!data.success) {
      return { ok: false, error: data["error-codes"]?.join(",") ?? "reCAPTCHA rechazado" };
    }
    if (data.action && data.action !== accionEsperada) {
      return { ok: false, error: "acción no coincide" };
    }
    const score = data.score ?? 0;
    if (score < umbralScore) {
      return { ok: false, score, error: `score bajo (${score})` };
    }
    return { ok: true, score };
  } catch (err) {
    log.error({ err: err instanceof Error ? err.message : String(err) }, "Error verificando reCAPTCHA");
    return { ok: false, error: "no se pudo verificar reCAPTCHA" };
  }
}
