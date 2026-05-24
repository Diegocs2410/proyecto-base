"use client";

import { crearOrganizacionAdmin } from "@/app/organizaciones/actions";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const esquema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres."),
  slug: z
    .string()
    .min(2, "Mínimo 2 caracteres.")
    .max(40, "Máximo 40 caracteres.")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones."),
  tipo: z.enum(["small_business", "mid_market", "enterprise", "partner", "internal_demo"]),
  planCode: z.enum(["starter", "team", "business", "enterprise"]),
});

type FormData = z.infer<typeof esquema>;

const TIPOS = [
  { value: "small_business", label: "Pequeña empresa" },
  { value: "mid_market", label: "Empresa mediana" },
  { value: "enterprise", label: "Corporativo" },
  { value: "partner", label: "Partner / Aliado" },
  { value: "internal_demo", label: "Demo interno" },
];

const PLANES = [
  { code: "starter", label: "Starter", precio: "Gratis" },
  { code: "team", label: "Team", precio: "$29/mes" },
  { code: "business", label: "Business", precio: "$99/mes" },
  { code: "enterprise", label: "Enterprise", precio: "A la medida" },
];

const generarSlug = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);

export function NuevaOrgModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: "", slug: "", tipo: "small_business", planCode: "starter" },
  });

  const slug = watch("slug");

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("nombre", e.target.value);
    setValue("slug", generarSlug(e.target.value), { shouldValidate: true });
  };

  const cerrar = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    const resultado = await crearOrganizacionAdmin(data);
    if (resultado.error) {
      toast.error(resultado.error);
      return;
    }
    toast.success(`Organización "${data.nombre}" creada exitosamente.`);
    cerrar();
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nueva organización
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={cerrar}
          />

          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <Building2 className="h-4 w-4 text-slate-600" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Nueva organización</h2>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-foreground"
                onClick={cerrar}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="grid gap-5 p-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  {...register("nombre")}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  id="nombre"
                  onChange={handleNombreChange}
                  placeholder="Ej: Mi Empresa S.A.S."
                />
                {errors.nombre && (
                  <p className="text-xs text-red-500">{errors.nombre.message}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="slug">
                  URL de acceso
                </label>
                <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                  <span className="select-none border-r border-border bg-slate-50 px-3 py-2.5 text-sm text-muted">
                    /org/
                  </span>
                  <input
                    {...register("slug")}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none"
                    id="slug"
                    placeholder="mi-empresa"
                  />
                </div>
                {errors.slug ? (
                  <p className="text-xs text-red-500">{errors.slug.message}</p>
                ) : (
                  slug && (
                    <p className="text-xs text-muted">
                      Acceso en <span className="font-mono">/org/{slug}</span>
                    </p>
                  )
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="tipo">
                    Tipo
                  </label>
                  <select
                    {...register("tipo")}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    id="tipo"
                  >
                    {TIPOS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="planCode">
                    Plan
                  </label>
                  <select
                    {...register("planCode")}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    id="planCode"
                  >
                    {PLANES.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.label} — {p.precio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <Button onClick={cerrar} type="button" variant="secondary">
                  Cancelar
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Creando..." : "Crear organización"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
