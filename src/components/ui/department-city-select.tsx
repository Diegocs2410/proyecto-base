"use client";

import type { Ciudad, Departamento } from "@/lib/data/geo";
import { useMemo, useState } from "react";

interface Props {
  departamentos: Departamento[];
  ciudades: Ciudad[];
  /** ID de departamento inicial (number como string, ej. "11") */
  departamentoInicial?: string;
  /** ID de ciudad inicial */
  ciudadInicial?: string;
  /** name del input departamento (para form-data) */
  nombreDepartamento?: string;
  /** name del input ciudad */
  nombreCiudad?: string;
  /** Callback opcional cuando cambia la selección */
  onChange?: (departamentoId: number | null, ciudadId: number | null) => void;
  /** Mostrar la etiqueta arriba */
  conEtiqueta?: boolean;
  /** Required HTML */
  requerido?: boolean;
}

const claseSelect =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60";

export function DepartmentCitySelect({
  departamentos,
  ciudades,
  departamentoInicial,
  ciudadInicial,
  nombreDepartamento = "departamento_id",
  nombreCiudad = "ciudad_id",
  onChange,
  conEtiqueta = true,
  requerido = false,
}: Props) {
  const [depId, setDepId] = useState<string>(departamentoInicial ?? "");
  const [ciudadId, setCiudadId] = useState<string>(ciudadInicial ?? "");

  const ciudadesFiltradas = useMemo(() => {
    if (!depId) return [];
    const num = Number(depId);
    return ciudades.filter((c) => c.departmentId === num);
  }, [depId, ciudades]);

  const onDepChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDepId(value);
    setCiudadId("");
    onChange?.(value ? Number(value) : null, null);
  };

  const onCiudadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCiudadId(value);
    onChange?.(depId ? Number(depId) : null, value ? Number(value) : null);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        {conEtiqueta && (
          <label className="text-sm font-medium text-slate-700" htmlFor={nombreDepartamento}>
            Departamento
          </label>
        )}
        <select
          className={claseSelect}
          id={nombreDepartamento}
          name={nombreDepartamento}
          onChange={onDepChange}
          required={requerido}
          value={depId}
        >
          <option value="">Selecciona…</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        {conEtiqueta && (
          <label className="text-sm font-medium text-slate-700" htmlFor={nombreCiudad}>
            Ciudad
          </label>
        )}
        <select
          className={claseSelect}
          disabled={!depId}
          id={nombreCiudad}
          name={nombreCiudad}
          onChange={onCiudadChange}
          required={requerido}
          value={ciudadId}
        >
          <option value="">{depId ? "Selecciona…" : "Primero el departamento"}</option>
          {ciudadesFiltradas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
