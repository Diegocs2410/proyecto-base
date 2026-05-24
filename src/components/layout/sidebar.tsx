"use client";

import { Building2, CreditCard, Gauge, LifeBuoy, LockKeyhole, Settings, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Inicio", icon: Gauge, href: "/" },
  { label: "Organizaciones", icon: Building2, href: "/organizaciones" },
  { label: "Miembros", icon: Users, href: "/miembros" },
  { label: "Roles y permisos", icon: LockKeyhole, href: "/roles" },
  { label: "Planes y facturación", icon: CreditCard, href: "/planes" },
  { label: "Auditoría", icon: ShieldCheck, href: "/auditoria" },
  { label: "Configuración", icon: Settings, href: "/configuracion" },
  { label: "Centro de ayuda", icon: LifeBuoy, href: "/ayuda" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-slate-800 bg-slate-950 text-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-800 p-6">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-sm font-bold">
              PX
            </div>
            <div>
              <p className="text-sm font-semibold">Proyecto Base</p>
              <p className="text-xs text-slate-400">Plataforma multitenant</p>
            </div>
          </Link>
        </div>
        <nav className="grid gap-1 p-3">
          {navigation.map((item) => {
            const activo =
              item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                  activo ? "bg-white text-slate-950" : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
                href={item.href}
                key={item.label}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-medium">Arquitectura multitenant</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Plataforma, empresa y espacio de trabajo separados desde el inicio.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
