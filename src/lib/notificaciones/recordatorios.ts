import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { formatFechaHoraCO } from "@/lib/i18n/co";
import { enviarEmail } from "@/lib/email/send";
import { RecordatorioCitaEmail } from "@/lib/email/templates/recordatorio-cita";
import { logger } from "@/lib/log";

const log = logger("recordatorios");

/**
 * Capa abstracta de recordatorios.
 *
 * Diseño: la cita programa dos recordatorios (24h y 1h antes). Un job
 * recorre `cita_recordatorios` con estado='pendiente' y `programado_para <= now()`
 * y dispara la acción configurada (email, WhatsApp, log).
 *
 * Por ahora el canal por defecto es 'log' o 'email' (si la cita tiene email).
 * Cuando se elija proveedor de WhatsApp (Twilio, Wapi, 360dialog, etc.) se
 * agrega un branch en `dispararRecordatorio()` sin tocar el resto del módulo.
 */

type Canal = "log" | "email" | "whatsapp";

const VENTANAS = [
  { tipo: "24h" as const, offsetMin: 24 * 60 },
  { tipo: "1h" as const, offsetMin: 60 },
];

/**
 * Crea los registros de recordatorio para una cita recién creada.
 * Idempotente: el unique (cita_id, tipo) impide duplicados.
 * Recordatorios cuyo programado_para ya pasó se omiten (cita muy próxima).
 */
export async function programarRecordatorios(
  citaId: string,
  iniciaEn: Date,
  admin: SupabaseClient<Database>,
): Promise<void> {
  const ahora = Date.now();
  const filas = VENTANAS.flatMap((v) => {
    const programadoMs = iniciaEn.getTime() - v.offsetMin * 60_000;
    if (programadoMs <= ahora) return [];
    return [
      {
        cita_id: citaId,
        tipo: v.tipo,
        canal: "log" as Canal,
        programado_para: new Date(programadoMs).toISOString(),
        estado: "pendiente" as const,
      },
    ];
  });

  if (filas.length === 0) return;

  const { error } = await admin
    .from("cita_recordatorios")
    .upsert(filas, { onConflict: "cita_id,tipo", ignoreDuplicates: true });

  if (error) {
    log.error({ err: error.message, citaId }, "No se pudieron programar recordatorios");
  }
}

interface ContextoRecordatorio {
  citaId: string;
  tipo: "24h" | "1h";
  clienteNombre: string;
  clienteEmail: string | null;
  clienteTelefono: string | null;
  negocioNombre: string;
  servicioNombre: string;
  recursoNombre: string;
  iniciaEn: string;
}

/**
 * Dispara un recordatorio individual. Devuelve `ok=true` si se entregó.
 * El job que llama a esta función actualiza el estado en la tabla.
 *
 * MVP: si la cita tiene email se manda email; si no, solo se loggea.
 * Futuro: aquí se enchufa el branch de WhatsApp (Twilio/Wapi/etc.).
 */
export async function dispararRecordatorio(
  ctx: ContextoRecordatorio,
): Promise<{ ok: boolean; canal: Canal; error?: string }> {
  if (ctx.clienteEmail) {
    const res = await enviarEmail({
      to: ctx.clienteEmail,
      subject:
        ctx.tipo === "24h"
          ? `Recordatorio: tu cita en ${ctx.negocioNombre} es mañana`
          : `Tu cita en ${ctx.negocioNombre} es en una hora`,
      react: RecordatorioCitaEmail({
        clienteNombre: ctx.clienteNombre,
        negocioNombre: ctx.negocioNombre,
        servicioNombre: ctx.servicioNombre,
        recursoNombre: ctx.recursoNombre,
        fechaTexto: formatFechaHoraCO(ctx.iniciaEn),
        ventana: ctx.tipo,
      }),
      tags: [
        { name: "tipo", value: "recordatorio-cita" },
        { name: "ventana", value: ctx.tipo },
      ],
    });
    if (!res.ok) return { ok: false, canal: "email", error: res.error };
    return { ok: true, canal: "email" };
  }

  // Sin email y sin proveedor de WhatsApp configurado: solo log.
  log.info(
    {
      citaId: ctx.citaId,
      tipo: ctx.tipo,
      cliente: ctx.clienteNombre,
      telefono: ctx.clienteTelefono,
      inicia: ctx.iniciaEn,
    },
    "Recordatorio (log) — configurar proveedor WhatsApp para envío real",
  );
  return { ok: true, canal: "log" };
}

/**
 * Procesa recordatorios pendientes cuyo programado_para ya venció.
 * Pensado para ser invocado por un cron (Vercel cron, GitHub Action, pg_cron).
 * Devuelve cuántos se procesaron.
 */
export async function procesarRecordatoriosPendientes(
  admin: SupabaseClient<Database>,
): Promise<{ procesados: number; fallidos: number }> {
  const { data: pendientes } = await admin
    .from("cita_recordatorios")
    .select(`
      id, tipo, cita_id,
      cita:citas!cita_id(
        cliente_nombre, cliente_email, cliente_telefono, inicia_en, estado,
        servicio:servicios!servicio_id(nombre),
        recurso:recursos!recurso_id(nombre),
        tenant:tenants!tenant_id(name)
      )
    `)
    .eq("estado", "pendiente")
    .lte("programado_para", new Date().toISOString())
    .limit(50);

  if (!pendientes || pendientes.length === 0) {
    return { procesados: 0, fallidos: 0 };
  }

  let procesados = 0;
  let fallidos = 0;

  for (const r of pendientes) {
    const cita = r.cita as {
      cliente_nombre: string;
      cliente_email: string | null;
      cliente_telefono: string | null;
      inicia_en: string;
      estado: string;
      servicio: { nombre: string } | null;
      recurso: { nombre: string } | null;
      tenant: { name: string } | null;
    } | null;

    if (!cita) {
      await admin
        .from("cita_recordatorios")
        .update({ estado: "fallido", error: "cita no encontrada", enviado_en: new Date().toISOString() })
        .eq("id", r.id);
      fallidos++;
      continue;
    }

    // Saltar citas canceladas o no_asistio.
    if (cita.estado === "cancelada" || cita.estado === "no_asistio") {
      await admin
        .from("cita_recordatorios")
        .update({ estado: "fallido", error: `cita ${cita.estado}`, enviado_en: new Date().toISOString() })
        .eq("id", r.id);
      continue;
    }

    const res = await dispararRecordatorio({
      citaId: r.cita_id,
      tipo: r.tipo as "24h" | "1h",
      clienteNombre: cita.cliente_nombre,
      clienteEmail: cita.cliente_email,
      clienteTelefono: cita.cliente_telefono,
      negocioNombre: cita.tenant?.name ?? "el negocio",
      servicioNombre: cita.servicio?.nombre ?? "tu cita",
      recursoNombre: cita.recurso?.nombre ?? "—",
      iniciaEn: cita.inicia_en,
    });

    if (res.ok) {
      await admin
        .from("cita_recordatorios")
        .update({ estado: "enviado", canal: res.canal, enviado_en: new Date().toISOString() })
        .eq("id", r.id);
      procesados++;
    } else {
      await admin
        .from("cita_recordatorios")
        .update({ estado: "fallido", canal: res.canal, error: res.error, enviado_en: new Date().toISOString() })
        .eq("id", r.id);
      fallidos++;
    }
  }

  return { procesados, fallidos };
}
