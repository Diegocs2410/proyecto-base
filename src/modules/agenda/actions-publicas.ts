"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificarRecaptcha } from "@/lib/security/recaptcha";
import { telefonoCOSchema } from "@/lib/i18n/validators";
import { logAudit } from "@/lib/audit/log";
import { programarRecordatorios } from "@/lib/notificaciones/recordatorios";
import { logger } from "@/lib/log";

const log = logger("reservas-publicas");

const reservaSchema = z.object({
  slug: z.string().min(1),
  servicioId: z.string().uuid(),
  recursoId: z.string().uuid(),
  iniciaEn: z.string().datetime({ offset: true }),
  clienteNombre: z.string().trim().min(2, "Tu nombre es muy corto.").max(120),
  clienteEmail: z.string().trim().email("Email inválido."),
  clienteTelefono: telefonoCOSchema,
  notas: z.string().trim().max(500).optional().or(z.literal("")),
  recaptchaToken: z.string().min(1, "Falta el token de seguridad."),
});

export async function crearReservaPublica(
  datos: z.input<typeof reservaSchema>,
): Promise<{ error?: string; ok?: true; reservaId?: string }> {
  const parsed = reservaSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const captcha = await verificarRecaptcha(parsed.data.recaptchaToken, "reservar");
  if (!captcha.ok) {
    log.warn({ error: captcha.error, slug: parsed.data.slug }, "Reserva rechazada por reCAPTCHA");
    return { error: "No pudimos verificar que seas humano. Recarga e intenta de nuevo." };
  }

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (!tenant) return { error: "Negocio no disponible." };

  const { data: feature } = await admin
    .from("tenant_features")
    .select("enabled")
    .eq("tenant_id", tenant.id)
    .eq("feature_key", "agenda")
    .maybeSingle();
  if (!feature?.enabled) return { error: "Reservas no disponibles en este momento." };

  const { data: servicio } = await admin
    .from("servicios")
    .select("duracion_min, activo, tenant_id")
    .eq("id", parsed.data.servicioId)
    .maybeSingle();
  if (!servicio || servicio.tenant_id !== tenant.id || !servicio.activo) {
    return { error: "Servicio no disponible." };
  }

  const { data: recurso } = await admin
    .from("recursos")
    .select("tenant_id, activo")
    .eq("id", parsed.data.recursoId)
    .maybeSingle();
  if (!recurso || recurso.tenant_id !== tenant.id || !recurso.activo) {
    return { error: "Recurso no disponible." };
  }

  const inicia = new Date(parsed.data.iniciaEn);
  if (inicia.getTime() < Date.now() + 60 * 60_000) {
    return { error: "Solo se aceptan reservas con al menos 1 hora de anticipación." };
  }

  const termina = new Date(inicia.getTime() + servicio.duracion_min * 60_000);

  const { data: conflicto } = await admin
    .from("citas")
    .select("id")
    .eq("recurso_id", parsed.data.recursoId)
    .in("estado", ["confirmada", "completada"])
    .lt("inicia_en", termina.toISOString())
    .gt("termina_en", inicia.toISOString())
    .limit(1)
    .maybeSingle();
  if (conflicto) return { error: "Ese horario ya no está disponible." };

  const { data: cita, error } = await admin
    .from("citas")
    .insert({
      tenant_id: tenant.id,
      servicio_id: parsed.data.servicioId,
      recurso_id: parsed.data.recursoId,
      cliente_nombre: parsed.data.clienteNombre,
      cliente_email: parsed.data.clienteEmail,
      cliente_telefono: parsed.data.clienteTelefono,
      inicia_en: inicia.toISOString(),
      termina_en: termina.toISOString(),
      estado: "confirmada",
      origen: "publico",
      notas: parsed.data.notas?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !cita) {
    log.error({ err: error?.message, slug: parsed.data.slug }, "Error creando reserva pública");
    return { error: "No se pudo crear la reserva. Intenta de nuevo." };
  }

  await programarRecordatorios(cita.id, inicia, admin);

  // El actor en el audit log es el sistema (no hay user_id); usamos un UUID nulo
  // mediante metadata para indicar el origen.
  await logAudit(
    {
      tenantId: tenant.id,
      actorUserId: "00000000-0000-0000-0000-000000000000",
      action: "cita.publica.create",
      entityType: "cita",
      entityId: cita.id,
      metadata: { origen: "reserva_publica", score: captcha.score },
    },
    admin,
  );

  return { ok: true, reservaId: cita.id };
}
