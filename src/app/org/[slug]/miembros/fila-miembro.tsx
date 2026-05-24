"use client";

import type { OrgMiembro } from "@/lib/data/org";
import { Check, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cambiarRol, removerMiembro } from "./actions";

const ROLES_OPCIONES = [
  { value: "tenant_admin", label: "Administrador" },
  { value: "member", label: "Miembro" },
  { value: "viewer", label: "Solo lectura" },
];

const ROLES_INTOCABLES = ["platform_admin", "tenant_owner"];

interface Props {
  miembro: OrgMiembro;
  tenantId: string;
  currentUserId: string;
  canManage: boolean;
}

export function FilaMiembro({ miembro, tenantId, currentUserId, canManage }: Props) {
  const router = useRouter();
  const [rolLocal, setRolLocal] = useState(miembro.rolCode);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const esSelf = miembro.userId === currentUserId;
  const esIntocable = ROLES_INTOCABLES.includes(miembro.rolCode);
  const puedeEditar = canManage && !esSelf && !esIntocable;
  const rolCambio = rolLocal !== miembro.rolCode;

  const handleGuardarRol = async () => {
    setGuardando(true);
    const res = await cambiarRol(miembro.id, tenantId, rolLocal);
    setGuardando(false);
    if (res.error) {
      toast.error(res.error);
      setRolLocal(miembro.rolCode);
    } else {
      toast.success("Rol actualizado.");
      router.refresh();
    }
  };

  const handleEliminar = async () => {
    setEliminando(true);
    const res = await removerMiembro(miembro.id, tenantId);
    setEliminando(false);
    if (res.error) {
      toast.error(res.error);
      setConfirmando(false);
    } else {
      toast.success(`${miembro.nombre} fue removido del equipo.`);
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-[1fr_1.2fr_1.2fr_auto] items-center border-t border-border px-6 py-3.5 text-sm transition hover:bg-slate-50/50">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
          {miembro.nombre[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {miembro.nombre}
            {esSelf && <span className="ml-1.5 text-xs text-muted">(tú)</span>}
          </p>
          <p className="truncate text-xs text-muted">{miembro.email}</p>
        </div>
      </div>

      <span className="text-muted">{miembro.desde}</span>

      <div className="flex items-center gap-2">
        {puedeEditar ? (
          <>
            <select
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              onChange={(e) => setRolLocal(e.target.value)}
              value={rolLocal}
            >
              {ROLES_OPCIONES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {rolCambio && (
              <div className="flex items-center gap-1">
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                  disabled={guardando}
                  onClick={handleGuardarRol}
                  title="Guardar"
                  type="button"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-slate-100"
                  onClick={() => setRolLocal(miembro.rolCode)}
                  title="Cancelar"
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <span className="text-sm text-muted">{miembro.rol}</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pl-4">
        {puedeEditar && (
          <>
            {confirmando ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted">¿Eliminar?</span>
                <button
                  className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                  disabled={eliminando}
                  onClick={handleEliminar}
                  type="button"
                >
                  {eliminando ? "..." : "Sí"}
                </button>
                <button
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition hover:bg-slate-100"
                  onClick={() => setConfirmando(false)}
                  type="button"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600"
                onClick={() => setConfirmando(true)}
                title="Eliminar miembro"
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
