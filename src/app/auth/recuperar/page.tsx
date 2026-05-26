"use client";

import { solicitarReset } from "@/app/auth/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const esquema = z.object({
  email: z.string().min(1, "El correo es obligatorio.").email("Ingresa un correo válido."),
});

type FormData = z.infer<typeof esquema>;

export default function RecuperarPage() {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(esquema) });

  const onSubmit = async (data: FormData) => {
    setErrorServidor(null);
    const resultado = await solicitarReset(data.email);
    if (resultado?.error) setErrorServidor(resultado.error);
    if (resultado?.success) setMensajeExito(resultado.success);
  };

  if (mensajeExito) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Revisa tu correo</h2>
        <p className="mt-2 text-sm text-slate-500">{mensajeExito}</p>
        <Link
          className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/auth/login"
        >
          Volver a entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
          PX
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Escribe tu correo y te enviaremos un enlace para crear una nueva.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Correo electrónico
          </label>
          <input
            {...register("email")}
            autoComplete="email"
            className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${
              errors.email ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-900"
            }`}
            id="email"
            placeholder="tu@empresa.com"
            type="email"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {errorServidor && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{errorServidor}</p>
        )}

        <button
          className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Enviando..." : "Enviar enlace de recuperación"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link className="font-medium text-slate-900 underline-offset-4 hover:underline" href="/auth/login">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
