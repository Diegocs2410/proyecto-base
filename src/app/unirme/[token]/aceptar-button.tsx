"use client";

import { useState } from "react";
import { aceptarInvitacion } from "./actions";

export function AceptarButton({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleAceptar = async () => {
    setCargando(true);
    setError(null);
    const resultado = await aceptarInvitacion(token);
    if (resultado?.error) {
      setError(resultado.error);
      setCargando(false);
    }
  };

  return (
    <div className="grid gap-2">
      {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">{error}</p>}
      <button
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        disabled={cargando}
        onClick={handleAceptar}
        type="button"
      >
        {cargando ? "Uniéndote..." : "✓ Aceptar y unirme"}
      </button>
    </div>
  );
}
