import { Resend } from "resend";

let cachedClient: Resend | null = null;
let advertenciaMostrada = false;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (!advertenciaMostrada) {
      console.warn(
        "[email] RESEND_API_KEY no está configurada. Los correos se registrarán en consola pero no se enviarán.",
      );
      advertenciaMostrada = true;
    }
    return null;
  }

  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }

  return cachedClient;
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "Proyecto Base <onboarding@resend.dev>";
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
