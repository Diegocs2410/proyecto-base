"use client";

import { registrarse } from "@/app/auth/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const esquema = z
  .object({
    nombre: z
      .string()
      .min(2, "Tu nombre debe tener al menos 2 caracteres.")
      .max(80, "El nombre es demasiado largo.")
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "El nombre solo puede tener letras y espacios."),
    email: z.string().min(1, "El correo es obligatorio.").email("Ingresa un correo válido."),
    password: z
      .string()
      .min(8, "La contraseña debe tener mínimo 8 caracteres.")
      .regex(/[A-Z]/, "Debe incluir al menos una mayúscula.")
      .regex(/[0-9]/, "Debe incluir al menos un número."),
    confirmar: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmar"],
  });

type FormData = z.infer<typeof esquema>;

function calcularFuerza(pass: string) {
  let f = 0;
  if (pass.length >= 8) f++;
  if (/[A-Z]/.test(pass)) f++;
  if (/[0-9]/.test(pass)) f++;
  if (/[^a-zA-Z0-9]/.test(pass)) f++;
  return f;
}

const NIVELES = ["", "Débil", "Regular", "Buena", "Fuerte"];
const COLORES = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];

function RegistroForm() {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(esquema) });

  const password = watch("password", "");
  const fuerza = password ? calcularFuerza(password) : 0;

  const onSubmit = async (data: FormData) => {
    setErrorServidor(null);
    const resultado = await registrarse(data.nombre, data.email, data.password, next);
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
        <h2 className="text-xl font-semibold text-slate-900">¡Cuenta creada!</h2>
        <p className="mt-2 text-sm text-slate-500">{mensajeExito}</p>
        <Link
          className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/auth/login"
        >
          Entrar ahora
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">Gratis, sin tarjeta de crédito. Cancela cuando quieras.</p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="nombre">
            Tu nombre
          </label>
          <input
            {...register("nombre")}
            className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${
              errors.nombre ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-900"
            }`}
            id="nombre"
            placeholder="Juan Pérez"
            type="text"
          />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Correo electrónico
          </label>
          <input
            {...register("email")}
            className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${
              errors.email ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-900"
            }`}
            id="email"
            placeholder="tu@empresa.com"
            type="email"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Contraseña
          </label>
          <input
            {...register("password")}
            className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${
              errors.password ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-900"
            }`}
            id="password"
            placeholder="Mínimo 8 caracteres"
            type="password"
          />
          {password && (
            <div className="grid gap-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${n <= fuerza ? COLORES[fuerza] : "bg-slate-200"}`}
                    key={n}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Seguridad:{" "}
                <span className={fuerza >= 3 ? "text-green-600" : fuerza >= 2 ? "text-orange-500" : "text-red-500"}>
                  {NIVELES[fuerza] || "Muy débil"}
                </span>
              </p>
            </div>
          )}
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="confirmar">
            Confirmar contraseña
          </label>
          <input
            {...register("confirmar")}
            className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${
              errors.confirmar ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-900"
            }`}
            id="confirmar"
            placeholder="Repite tu contraseña"
            type="password"
          />
          {errors.confirmar && <p className="text-xs text-red-500">{errors.confirmar.message}</p>}
        </div>

        {errorServidor && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{errorServidor}</p>
        )}

        <button
          className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creando tu cuenta..." : "Crear mi cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link className="font-medium text-slate-900 underline-offset-4 hover:underline" href="/auth/login">
          Entra aquí
        </Link>
      </p>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
