"use client";

import { cerrarSesion } from "@/app/auth/actions";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function getIniciales(user: User | null): string {
  const nombre = user?.user_metadata?.nombre_completo as string | undefined;
  if (nombre) {
    return nombre
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return user?.email?.[0]?.toUpperCase() ?? "U";
}

export function UserMenu({ user }: { user: User | null }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  const nombre = (user?.user_metadata?.nombre_completo as string) || user?.email || "Usuario";
  const iniciales = getIniciales(user);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2 text-left shadow-sm transition hover:bg-slate-50"
        onClick={() => setAbierto((v) => !v)}
        type="button"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
          {iniciales}
        </div>
        <div className="hidden sm:block">
          <p className="max-w-[130px] truncate text-sm font-medium text-foreground">{nombre}</p>
          <p className="max-w-[130px] truncate text-xs text-muted">{user?.email}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{nombre}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>

          <div className="p-1.5">
            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
              type="button"
            >
              <UserCircle className="h-4 w-4" />
              Mi perfil
            </button>

            <div className="my-1 h-px bg-slate-100" />

            <form action={cerrarSesion}>
              <button
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
