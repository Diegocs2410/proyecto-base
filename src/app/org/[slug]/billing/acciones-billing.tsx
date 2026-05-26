"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  cancelarSuscripcion,
  iniciarUpgrade,
  reactivarSuscripcion,
} from "./actions";

interface BotonUpgradeProps {
  tenantId: string;
  slug: string;
  planId: string;
  etiqueta: string;
  destacado?: boolean;
  deshabilitado?: boolean;
}

export function BotonUpgrade({
  tenantId,
  slug,
  planId,
  etiqueta,
  destacado,
  deshabilitado,
}: BotonUpgradeProps) {
  const [cargando, setCargando] = useState(false);

  const onClick = async () => {
    setCargando(true);
    const resultado = await iniciarUpgrade({ tenantId, slug, planId });
    if ("error" in resultado) {
      toast.error(resultado.error);
      setCargando(false);
      return;
    }
    window.location.href = resultado.url;
  };

  const claseBase =
    "w-full rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-60";
  const clase = destacado
    ? `${claseBase} bg-slate-900 text-white hover:bg-slate-800`
    : `${claseBase} border border-slate-200 text-slate-700 hover:bg-slate-50`;

  return (
    <button className={clase} disabled={cargando || deshabilitado} onClick={onClick} type="button">
      {cargando ? "Redirigiendo a Wompi..." : etiqueta}
    </button>
  );
}

interface BotonCancelarProps {
  tenantId: string;
  cancelado: boolean;
}

export function BotonCancelar({ tenantId, cancelado }: BotonCancelarProps) {
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    if (!cancelado) {
      const confirmar = window.confirm(
        "¿Cancelar al final del período? Mantendrás acceso hasta la fecha de vencimiento.",
      );
      if (!confirmar) return;
    }

    setCargando(true);
    const fn = cancelado ? reactivarSuscripcion : cancelarSuscripcion;
    const resultado = await fn(tenantId);
    setCargando(false);

    if (resultado.error) {
      toast.error(resultado.error);
      return;
    }

    toast.success(cancelado ? "Suscripción reactivada." : "Suscripción cancelada al final del período.");
    router.refresh();
  };

  return (
    <button
      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      disabled={cargando}
      onClick={onClick}
      type="button"
    >
      {cargando
        ? "Procesando..."
        : cancelado
          ? "Reactivar suscripción"
          : "Cancelar al fin del período"}
    </button>
  );
}
