"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cambiarEstadoCita, crearCitaInterna } from "@/modules/agenda/actions";

interface OpcionServicio {
  id: string;
  nombre: string;
  duracionMin: number;
}

interface OpcionRecurso {
  id: string;
  nombre: string;
}

export function FormularioCita({
  tenantId,
  slug,
  servicios,
  recursos,
}: {
  tenantId: string;
  slug: string;
  servicios: OpcionServicio[];
  recursos: OpcionRecurso[];
}) {
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? "");
  const [recursoId, setRecursoId] = useState(recursos[0]?.id ?? "");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [iniciaEn, setIniciaEn] = useState("");
  const [notas, setNotas] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iniciaEn) {
      toast.error("Selecciona fecha y hora.");
      return;
    }

    const iso = new Date(iniciaEn).toISOString();

    startTransition(async () => {
      const r = await crearCitaInterna(tenantId, slug, {
        servicioId,
        recursoId,
        clienteNombre,
        clienteTelefono,
        clienteEmail,
        iniciaEn: iso,
        notas,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Cita creada.");
      setClienteNombre("");
      setClienteTelefono("");
      setClienteEmail("");
      setIniciaEn("");
      setNotas("");
    });
  };

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
      <Campo label="Cliente">
        <input
          className={inputCls}
          maxLength={120}
          onChange={(e) => setClienteNombre(e.target.value)}
          placeholder="Nombre del cliente"
          required
          value={clienteNombre}
        />
      </Campo>

      <Campo label="Inicio">
        <input
          className={inputCls}
          onChange={(e) => setIniciaEn(e.target.value)}
          required
          type="datetime-local"
          value={iniciaEn}
        />
      </Campo>

      <Campo label="Servicio">
        <select
          className={inputCls}
          onChange={(e) => setServicioId(e.target.value)}
          required
          value={servicioId}
        >
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} ({s.duracionMin} min)
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Recurso">
        <select
          className={inputCls}
          onChange={(e) => setRecursoId(e.target.value)}
          required
          value={recursoId}
        >
          {recursos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Teléfono (opcional)">
        <input
          className={inputCls}
          maxLength={30}
          onChange={(e) => setClienteTelefono(e.target.value)}
          placeholder="3xx xxx xxxx"
          value={clienteTelefono}
        />
      </Campo>

      <Campo label="Email (opcional)">
        <input
          className={inputCls}
          maxLength={200}
          onChange={(e) => setClienteEmail(e.target.value)}
          placeholder="cliente@ejemplo.com"
          type="email"
          value={clienteEmail}
        />
      </Campo>

      <div className="md:col-span-2">
        <Campo label="Notas (opcional)">
          <textarea
            className={`${inputCls} min-h-[80px]`}
            maxLength={2000}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Comentarios internos"
            value={notas}
          />
        </Campo>
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button
          className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Guardando..." : "Crear cita"}
        </button>
      </div>
    </form>
  );
}

export function AccionesCita({
  tenantId,
  slug,
  citaId,
  estado,
}: {
  tenantId: string;
  slug: string;
  citaId: string;
  estado: "confirmada" | "completada" | "no_asistio" | "cancelada";
}) {
  const [pending, startTransition] = useTransition();

  const cambiar = (nuevo: "completada" | "no_asistio" | "cancelada") => {
    startTransition(async () => {
      const r = await cambiarEstadoCita(tenantId, slug, citaId, nuevo);
      if (r.error) toast.error(r.error);
      else toast.success("Estado actualizado.");
    });
  };

  if (estado !== "confirmada") return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      <button
        className="rounded-md bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 transition hover:bg-green-200 disabled:opacity-50"
        disabled={pending}
        onClick={() => cambiar("completada")}
        type="button"
      >
        Asistió
      </button>
      <button
        className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 transition hover:bg-amber-200 disabled:opacity-50"
        disabled={pending}
        onClick={() => cambiar("no_asistio")}
        type="button"
      >
        No vino
      </button>
      <button
        className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 transition hover:bg-red-200 disabled:opacity-50"
        disabled={pending}
        onClick={() => cambiar("cancelada")}
        type="button"
      >
        Cancelar
      </button>
    </div>
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
