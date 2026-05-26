import { procesarWebhook } from "@/lib/payments/wompi/webhook";
import type { WompiWebhookPayload } from "@/lib/payments/wompi/signature";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let payload: WompiWebhookPayload;
  try {
    payload = (await request.json()) as WompiWebhookPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const resultado = await procesarWebhook(payload);

  if (!resultado.ok) {
    console.error("[wompi webhook] error:", resultado.error);
    return NextResponse.json({ error: resultado.error }, { status: resultado.codigoHttp });
  }

  return NextResponse.json({ ok: true, status: resultado.status });
}
