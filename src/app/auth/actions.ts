"use server";

import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/email/client";
import { redirect } from "next/navigation";

export type AuthState = { error?: string; success?: string } | undefined;

export async function iniciarSesion(
  email: string,
  password: string,
  redirectTo?: string,
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: traducirError(error.message) };

  redirect(redirectTo ?? "/");
}

export async function registrarse(
  nombre: string,
  email: string,
  password: string,
  redirectTo?: string,
): Promise<AuthState> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre_completo: nombre } },
  });

  if (error) return { error: traducirError(error.message) };

  if (data.session) {
    redirect(redirectTo ?? "/onboarding");
  }

  return {
    success:
      "Te enviamos un correo de confirmaci\u00f3n. Entra a tu bandeja y haz clic en el enlace para activar tu cuenta.",
  };
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function solicitarReset(email: string): Promise<AuthState> {
  const supabase = await createClient();
  const redirectTo = `${getAppUrl()}/auth/confirm?next=/auth/nueva-clave`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) return { error: traducirError(error.message) };

  return {
    success:
      "Si la cuenta existe te enviamos un correo con instrucciones. Revisa tu bandeja de entrada.",
  };
}

export async function actualizarClave(password: string): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "El enlace ya no es válido o expiró. Solicita uno nuevo.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: traducirError(error.message) };

  await supabase.auth.signOut();
  redirect("/auth/login?reset=ok");
}

function traducirError(message: string): string {
  const errores: Record<string, string> = {
    "Invalid login credentials": "El correo o la contrase\u00f1a no son correctos. Vuelve a intentarlo.",
    "Email not confirmed": "Todav\u00eda no has confirmado tu correo. Revisa tu bandeja de entrada.",
    "User already registered": "Ya existe una cuenta con ese correo. \u00bfQuieres entrar?",
    "Password should be at least 6 characters": "La contrase\u00f1a debe tener m\u00ednimo 6 caracteres.",
    "Unable to validate email address: invalid format": "Ese correo no parece v\u00e1lido. Veri\u00edfica y vuelve a intentar.",
    "Signup is disabled": "El registro no est\u00e1 disponible en este momento.",
    "Email rate limit exceeded": "Demasiados intentos. Espera unos minutos e int\u00e9ntalo de nuevo.",
    "over_email_send_rate_limit": "L\u00edmite de correos alcanzado. Int\u00e9ntalo en unos minutos.",
    "For security purposes, you can only request this after": "Demasiados intentos seguidos. Espera un momento.",
    "Anonymous sign-ins are disabled": "El registro no est\u00e1 habilitado en este momento.",
    "User already exists": "Ya existe una cuenta con ese correo. \u00bfQuieres entrar?",
  };
  const encontrado = Object.entries(errores).find(([key]) => message.includes(key));
  return encontrado ? encontrado[1] : `Error al registrarse: ${message}`;
}
