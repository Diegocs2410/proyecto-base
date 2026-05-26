"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { activarModulo, desactivarModulo } from "./actions";

interface Props {
  tenantId: string;
  slug: string;
  moduleKey: string;
  enabled: boolean;
  deshabilitado?: boolean;
  razonDeshabilitado?: string;
}

export function ToggleModulo({
  tenantId,
  slug,
  moduleKey,
  enabled,
  deshabilitado,
  razonDeshabilitado,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    if (deshabilitado) {
      toast.info(razonDeshabilitado ?? "No puedes activar este módulo.");
      return;
    }
    startTransition(async () => {
      const fn = enabled ? desactivarModulo : activarModulo;
      const resultado = await fn(tenantId, slug, moduleKey);
      if (resultado.error) {
        toast.error(resultado.error);
        return;
      }
      toast.success(enabled ? "Módulo desactivado." : "Módulo activado.");
      router.refresh();
    });
  };

  const claseBase =
    "rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-60";
  const clase = enabled
    ? `${claseBase} border border-slate-200 text-slate-700 hover:bg-slate-50`
    : deshabilitado
      ? `${claseBase} border border-slate-200 text-slate-400 cursor-not-allowed`
      : `${claseBase} bg-slate-900 text-white hover:bg-slate-800`;

  return (
    <button className={clase} disabled={pending} onClick={onClick} type="button">
      {pending
        ? "Procesando..."
        : enabled
          ? "Desactivar"
          : deshabilitado
            ? "No disponible"
            : "Activar"}
    </button>
  );
}
