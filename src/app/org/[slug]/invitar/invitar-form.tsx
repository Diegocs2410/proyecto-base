"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { enviarInvitacion } from "./actions";

const esquema = z.object({
  email: z.string().min(1, "El correo es obligatorio.").email("Ingresa un correo válido."),
  rol: z.enum(["member", "tenant_admin", "viewer"]),
});

type FormData = z.infer<typeof esquema>;

export function InvitarForm({ orgId, slug }: { orgId: string; slug: string }) {
  const [linkInvitacion, setLinkInvitacion] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(esquema),
    defaultValues: { rol: "member" },
  });

  const copiarEnlace = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const onSubmit = async (data: FormData) => {
    setErrorServidor(null);
    setLinkInvitacion(null);
    const resultado = await enviarInvitacion(orgId, data.email, data.rol);
    if (resultado?.error) {
      setErrorServidor(resultado.error);
    } else if (resultado?.token) {
      const link = `${window.location.origin}/unirme/${resultado.token}`;
      setLinkInvitacion(link);
      reset();
      router.refresh();
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Nueva invitación</h2>
      <p className="mt-0.5 text-sm text-muted">La persona recibirá un correo para unirse.</p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Correo electrónico
          </label>
          <input
            {...register("email")}
            className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${
              errors.email ? "border-red-300" : "border-slate-200 focus:border-slate-900"
            }`}
            id="email"
            placeholder="colega@empresa.com"
            type="email"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="rol">
            Rol
          </label>
          <select
            {...register("rol")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
            id="rol"
          >
            <option value="member">Miembro</option>
            <option value="tenant_admin">Administrador</option>
            <option value="viewer">Solo lectura</option>
          </select>
        </div>

        {linkInvitacion && (
          <div className="rounded-xl bg-green-50 p-4">
            <p className="mb-2 text-sm font-medium text-green-800">¡Invitación creada! Comparte este enlace:</p>
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-white px-3 py-2">
              <p className="flex-1 truncate font-mono text-xs text-slate-700">{linkInvitacion}</p>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-800"
                onClick={() => copiarEnlace(linkInvitacion)}
                type="button"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiado ? "¡Copiado!" : "Copiar enlace"}
              </button>
              <a
                className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                href={`https://wa.me/?text=${encodeURIComponent(`Te invité a unirte. Acepta aquí: ${linkInvitacion}`)}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>
          </div>
        )}
        {errorServidor && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{errorServidor}</p>
        )}

        <button
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Enviando..." : "Enviar invitación"}
        </button>
      </form>
    </div>
  );
}
