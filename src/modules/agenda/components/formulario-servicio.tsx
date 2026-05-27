"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { archivarServicio, guardarServicio } from "@/modules/agenda/actions";

const COLORES = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

export function FormularioServicio({ tenantId, slug }: { tenantId: string; slug: string }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracionMin, setDuracionMin] = useState("30");
  const [precioCop, setPrecioCop] = useState("0");
  const [color, setColor] = useState(COLORES[0]);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await guardarServicio(tenantId, slug, {
        nombre,
        descripcion,
        duracionMin: Number(duracionMin),
        precioCop: Number(precioCop),
        color,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Servicio creado.");
      setNombre("");
      setDescripcion("");
      setDuracionMin("30");
      setPrecioCop("0");
      setColor(COLORES[0]);
    });
  };

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
      <Campo label="Nombre">
        <input
          className={inputCls}
          maxLength={120}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Corte de cabello"
          required
          value={nombre}
        />
      </Campo>

      <Campo label="Duración (minutos)">
        <input
          className={inputCls}
          max={600}
          min={5}
          onChange={(e) => setDuracionMin(e.target.value)}
          required
          type="number"
          value={duracionMin}
        />
      </Campo>

      <Campo label="Precio COP">
        <input
          className={inputCls}
          min={0}
          onChange={(e) => setPrecioCop(e.target.value)}
          required
          step={1000}
          type="number"
          value={precioCop}
        />
      </Campo>

      <Campo label="Color">
        <div className="flex flex-wrap gap-2 pt-1.5">
          {COLORES.map((c) => (
            <button
              aria-label={`Color ${c}`}
              className={`h-7 w-7 rounded-lg ring-2 transition ${color === c ? "ring-slate-900" : "ring-transparent"}`}
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              type="button"
            />
          ))}
        </div>
      </Campo>

      <div className="md:col-span-2">
        <Campo label="Descripción (opcional)">
          <textarea
            className={`${inputCls} min-h-[60px]`}
            maxLength={1000}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Notas internas sobre el servicio"
            value={descripcion}
          />
        </Campo>
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button
          className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={pending || nombre.trim().length === 0}
          type="submit"
        >
          {pending ? "Guardando..." : "Crear servicio"}
        </button>
      </div>
    </form>
  );
}

export function BotonArchivarServicio({
  tenantId,
  slug,
  servicioId,
  nombre,
}: {
  tenantId: string;
  slug: string;
  servicioId: string;
  nombre: string;
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!window.confirm(`¿Archivar el servicio "${nombre}"? Las citas existentes se conservan.`)) {
      return;
    }
    startTransition(async () => {
      const r = await archivarServicio(tenantId, slug, servicioId);
      if (r.error) toast.error(r.error);
      else toast.success("Servicio archivado.");
    });
  };

  return (
    <button
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-slate-50 disabled:opacity-60"
      disabled={pending}
      onClick={onClick}
      type="button"
    >
      {pending ? "..." : "Archivar"}
    </button>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
