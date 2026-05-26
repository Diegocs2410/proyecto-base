import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { getEmailFrom, getResendClient } from "./client";

export interface EnviarEmailParams {
  to: string | string[];
  subject: string;
  react: ReactElement;
  tags?: Array<{ name: string; value: string }>;
  replyTo?: string;
}

export type EnviarEmailResult = { ok: true; id: string | null } | { ok: false; error: string };

export async function enviarEmail(params: EnviarEmailParams): Promise<EnviarEmailResult> {
  const client = getResendClient();
  const from = getEmailFrom();

  if (!client) {
    const html = await render(params.react);
    console.log("[email · dry-run]", {
      from,
      to: params.to,
      subject: params.subject,
      tags: params.tags,
      htmlPreview: html.slice(0, 200) + "...",
    });
    return { ok: true, id: null };
  }

  const { data, error } = await client.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    react: params.react,
    tags: params.tags,
    replyTo: params.replyTo,
  });

  if (error) {
    console.error("[email] Error enviando correo:", error.message, { subject: params.subject });
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id ?? null };
}
