"use client";

import { actualizarClave } from "@/app/auth/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const esquema = z
  .object({
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

export default function NuevaClavePage() {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(esquema) });

  const onSubmit = async (data: FormData) => {
    setErrorServidor(null);
    const resultado = await actualizarClave(data.password);
    if (resultado?.error) setErrorServidor(resultado.error);
  };

  return (
    <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
          PX
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Crea una nueva contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">Elige una clave que no hayas usado antes.</p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Nueva contraseña
          </label>
          <input
            {...register("password")}
            autoComplete="new-password"
            className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${
              errors.password ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-900"
            }`}
            id="password"
            placeholder="Mínimo 8 caracteres"
            type="password"
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="confirmar">
            Confirmar contraseña
          </label>
          <input
            {...register("confirmar")}
            autoComplete="new-password"
            className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${
              errors.confirmar ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-900"
            }`}
            id="confirmar"
            placeholder="Repite la nueva contraseña"
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
          {isSubmitting ? "Guardando..." : "Guardar nueva contraseña"}
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
