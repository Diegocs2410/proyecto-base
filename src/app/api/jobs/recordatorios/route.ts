import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { procesarRecordatoriosPendientes } from "@/lib/notificaciones/recordatorios";
import { logger } from "@/lib/log";

const log = logger("cron-recordatorios");

/**
 * Cron job: procesa recordatorios de citas pendientes.
 * Configurar en Vercel Cron, GitHub Actions, o cualquier scheduler externo.
 * Requiere header `Authorization: Bearer <CRON_SECRET>` para evitar disparos
 * desde el exterior.
 *
 * Para Vercel: agregar en `vercel.json`:
 *   { "crons": [{ "path": "/api/jobs/recordatorios", "schedule": "* /15 * * * *" }] }
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "no autorizado" }, { status: 401 });
    }
  }

  try {
    const admin = createAdminClient();
    const resultado = await procesarRecordatoriosPendientes(admin);
    log.info(resultado, "Recordatorios procesados");
    return NextResponse.json(resultado);
  } catch (err) {
    log.error({ err: err instanceof Error ? err.message : String(err) }, "Error procesando recordatorios");
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }
}

// Permitir GET para health-check manual (no procesa nada).
export async function GET() {
  return NextResponse.json({ ok: true, descripcion: "Usar POST con bearer token para procesar." });
}
