"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearNota, eliminarNota } from "./actions";

export function FormularioNota({ tenantId, slug }: { tenantId: string; slug: string }) {
  const [cuerpo, setCuerpo] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const resultado = await crearNota(tenantId, slug, cuerpo);
      if (resultado.error) {
        toast.error(resultado.error);
        return;
      }
      setCuerpo("");
      toast.success("Nota guardada.");
    });
  };

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <textarea
        className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
        disabled={pending}
        maxLength={4000}
        onChange={(e) => setCuerpo(e.target.value)}
        placeholder="Escribe una nota para tu equipo…"
        value={cuerpo}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{cuerpo.length} / 4000</p>
        <button
          className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={pending || cuerpo.trim().length === 0}
          type="submit"
        >
          {pending ? "Guardando..." : "Guardar nota"}
        </button>
      </div>
    </form>
  );
}

export function BotonEliminarNota({
  tenantId,
  slug,
  notaId,
}: {
  tenantId: string;
  slug: string;
  notaId: string;
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!window.confirm("¿Eliminar esta nota? No se puede deshacer.")) return;
    startTransition(async () => {
      const resultado = await eliminarNota(tenantId, slug, notaId);
      if (resultado.error) toast.error(resultado.error);
      else toast.success("Nota eliminada.");
    });
  };

  return (
    <button
      className="text-xs text-red-600 underline-offset-4 hover:underline disabled:opacity-60"
      disabled={pending}
      onClick={onClick}
      type="button"
    >
      {pending ? "..." : "Eliminar"}
    </button>
  );
}
