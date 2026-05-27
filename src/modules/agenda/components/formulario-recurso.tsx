"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { archivarRecurso, guardarRecurso } from "@/modules/agenda/actions";

const COLORES = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

export function FormularioRecurso({ tenantId, slug }: { tenantId: string; slug: string }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"persona" | "espacio" | "equipo">("persona");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState(COLORES[0]);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await guardarRecurso(tenantId, slug, { nombre, tipo, email, color });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Recurso creado.");
      setNombre("");
      setEmail("");
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
          placeholder="Ej. Juan Pérez / Sala 1"
          required
          value={nombre}
        />
      </Campo>

      <Campo label="Tipo">
        <select
          className={inputCls}
          onChange={(e) => setTipo(e.target.value as "persona" | "espacio" | "equipo")}
          value={tipo}
        >
          <option value="persona">Persona</option>
          <option value="espacio">Espacio</option>
          <option value="equipo">Equipo</option>
        </select>
      </Campo>

      <Campo label="Email (opcional)">
        <input
          className={inputCls}
          maxLength={200}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="persona@ejemplo.com"
          type="email"
          value={email}
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

      <div className="md:col-span-2 flex justify-end">
        <button
          className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={pending || nombre.trim().length === 0}
          type="submit"
        >
          {pending ? "Guardando..." : "Crear recurso"}
        </button>
      </div>
    </form>
  );
}

export function BotonArchivarRecurso({
  tenantId,
  slug,
  recursoId,
  nombre,
}: {
  tenantId: string;
  slug: string;
  recursoId: string;
  nombre: string;
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!window.confirm(`¿Archivar el recurso "${nombre}"? Las citas existentes se conservan.`)) {
      return;
    }
    startTransition(async () => {
      const r = await archivarRecurso(tenantId, slug, recursoId);
      if (r.error) toast.error(r.error);
      else toast.success("Recurso archivado.");
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
