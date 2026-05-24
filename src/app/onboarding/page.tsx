"use client";

import { crearOrganizacion } from "@/app/onboarding/actions";
import { Stepper } from "@/components/ui/stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Building2, Check, Rocket, Zap } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const esquema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  slug: z
    .string()
    .min(2, "La URL debe tener al menos 2 caracteres.")
    .max(40, "Máximo 40 caracteres.")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones."),
  planCode: z.string().min(1, "Selecciona un plan."),
});

type FormData = z.infer<typeof esquema>;

const PASOS = [
  { label: "Tu organización", descripcion: "Nombre y URL" },
  { label: "Elige tu plan", descripcion: "Gratis o de pago" },
  { label: "Confirmar", descripcion: "Revisa y crea" },
];

const PLANES = [
  {
    code: "starter",
    nombre: "Starter",
    precio: "Gratis",
    descripcion: "Para empezar",
    usuarios: 5,
    espacios: 1,
    icon: Zap,
    popular: false,
  },
  {
    code: "team",
    nombre: "Team",
    precio: "$29/mes",
    descripcion: "Para equipos en crecimiento",
    usuarios: 25,
    espacios: 5,
    icon: Building2,
    popular: true,
  },
  {
    code: "business",
    nombre: "Business",
    precio: "$99/mes",
    descripcion: "Para empresas establecidas",
    usuarios: 100,
    espacios: 25,
    icon: Rocket,
    popular: false,
  },
];

export default function OnboardingPage() {
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: "", slug: "", planCode: "starter" },
  });

  const nombre = watch("nombre");
  const slug = watch("slug");
  const planCode = watch("planCode");

  const generarSlug = (texto: string) =>
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 40);

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setValue("nombre", valor);
    setValue("slug", generarSlug(valor));
  };

  const siguiente = async () => {
    const camposPorPaso: (keyof FormData)[][] = [
      ["nombre", "slug"],
      ["planCode"],
      [],
    ];
    const valido = await trigger(camposPorPaso[paso]);
    if (valido) setPaso((p) => p + 1);
  };

  const onSubmit = async (data: FormData) => {
    setEnviando(true);
    setError(null);
    const resultado = await crearOrganizacion(data);
    if (resultado?.error) {
      setError(resultado.error);
      setEnviando(false);
    }
  };

  const planSeleccionado = PLANES.find((p) => p.code === planCode);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
            PX
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Configura tu organización</h1>
          <p className="mt-1 text-sm text-slate-500">Solo toma 2 minutos. Sin tarjeta de crédito.</p>
        </div>

        <div className="mb-10 px-4">
          <Stepper actual={paso} pasos={PASOS} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
            {paso === 0 && (
              <div className="grid gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">¿Cómo se llama tu organización?</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Este es el nombre que verán tus usuarios. Puedes cambiarlo después.
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="nombre">
                    Nombre de la organización
                  </label>
                  <input
                    {...register("nombre")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                    id="nombre"
                    onChange={handleNombreChange}
                    placeholder="Ej: Mi Empresa S.A.S."
                    type="text"
                  />
                  {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="slug">
                    URL de tu organización
                  </label>
                  <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-slate-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10">
                    <span className="select-none border-r border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500">
                      app.tudominio.com/
                    </span>
                    <input
                      {...register("slug")}
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                      id="slug"
                      placeholder="mi-empresa"
                      type="text"
                    />
                  </div>
                  {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
                  <p className="text-xs text-slate-400">Solo minúsculas, números y guiones.</p>
                </div>
              </div>
            )}

            {paso === 1 && (
              <div className="grid gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Elige un plan</h2>
                  <p className="mt-1 text-sm text-slate-500">Puedes cambiar de plan cuando quieras.</p>
                </div>

                <div className="grid gap-3">
                  {PLANES.map((plan) => {
                    const Icon = plan.icon;
                    const seleccionado = planCode === plan.code;
                    return (
                      <button
                        className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${
                          seleccionado
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                        key={plan.code}
                        onClick={() => setValue("planCode", plan.code)}
                        type="button"
                      >
                        {plan.popular && (
                          <span className="absolute right-4 top-4 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
                            Popular
                          </span>
                        )}
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              seleccionado ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-900">{plan.nombre}</p>
                              <p className="text-sm font-semibold text-slate-900">{plan.precio}</p>
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500">{plan.descripcion}</p>
                            <p className="mt-2 text-xs text-slate-400">
                              {plan.usuarios} usuarios · {plan.espacios} espacio{plan.espacios > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.planCode && <p className="text-xs text-red-500">{errors.planCode.message}</p>}
              </div>
            )}

            {paso === 2 && (
              <div className="grid gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Confirma los datos</h2>
                  <p className="mt-1 text-sm text-slate-500">Revisa que todo esté correcto antes de crear.</p>
                </div>

                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Organización</p>
                    <p className="text-sm font-semibold text-slate-900">{nombre}</p>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">URL</p>
                    <p className="text-sm font-mono text-slate-700">/{slug}</p>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Plan</p>
                    <p className="text-sm font-semibold text-slate-900">{planSeleccionado?.nombre}</p>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Precio</p>
                    <p className="text-sm font-semibold text-slate-900">{planSeleccionado?.precio}</p>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            {paso > 0 ? (
              <button
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => setPaso((p) => p - 1)}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
            ) : (
              <div />
            )}

            {paso < 2 ? (
              <button
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                onClick={siguiente}
                type="button"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                disabled={enviando}
                type="submit"
              >
                {enviando ? (
                  "Creando..."
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Crear organización
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
