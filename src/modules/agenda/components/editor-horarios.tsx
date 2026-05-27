"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { eliminarHorario, guardarHorario } from "@/modules/agenda/actions";
import type { HorarioItem } from "@/modules/agenda/queries";
import { Trash2 } from "lucide-react";

export function EditorHorarios({
  tenantId,
  slug,
  recursoId,
  horarios,
  diasNombres,
}: {
  tenantId: string;
  slug: string;
  recursoId: string;
  horarios: HorarioItem[];
  diasNombres: string[];
}) {
  const [diaSemana, setDiaSemana] = useState("1");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("17:00");
  const [pending, startTransition] = useTransition();

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await guardarHorario(tenantId, slug, {
        recursoId,
        diaSemana: Number(diaSemana),
        horaInicio,
        horaFin,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Horario agregado.");
    });
  };

  const onDelete = (horarioId: string) => {
    startTransition(async () => {
      const r = await eliminarHorario(tenantId, slug, horarioId);
      if (r.error) toast.error(r.error);
      else toast.success("Horario eliminado.");
    });
  };

  return (
    <div className="mt-3 grid gap-3">
      <div className="grid gap-2">
        {horarios.length === 0 ? (
          <p className="text-xs text-muted">
            Sin horarios configurados. Agrega bloques semanales para aceptar reservas.
          </p>
        ) : (
          horarios.map((h) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              key={h.id}
            >
              <span>
                <span className="font-medium">{diasNombres[h.diaSemana]}</span>{" "}
                <span className="text-muted">
                  {h.horaInicio.slice(0, 5)} – {h.horaFin.slice(0, 5)}
                </span>
              </span>
              <button
                aria-label="Eliminar horario"
                className="text-muted transition hover:text-red-600 disabled:opacity-50"
                disabled={pending}
                onClick={() => onDelete(h.id)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end" onSubmit={onAdd}>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted">Día</span>
          <select
            className={inputCls}
            onChange={(e) => setDiaSemana(e.target.value)}
            value={diaSemana}
          >
            {diasNombres.map((d, i) => (
              <option key={d} value={String(i)}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted">Desde</span>
          <input
            className={inputCls}
            onChange={(e) => setHoraInicio(e.target.value)}
            required
            type="time"
            value={horaInicio}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted">Hasta</span>
          <input
            className={inputCls}
            onChange={(e) => setHoraFin(e.target.value)}
            required
            type="time"
            value={horaFin}
          />
        </label>
        <button
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-slate-50 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          Agregar
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10";
