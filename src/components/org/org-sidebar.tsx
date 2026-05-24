"use client";

import type { OrgContexto } from "@/lib/data/org";
import { Cog, Home, Mail, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = (slug: string) => [
  { label: "Inicio", icon: Home, href: `/org/${slug}` },
  { label: "Miembros", icon: Users, href: `/org/${slug}/miembros` },
  { label: "Invitar personas", icon: Mail, href: `/org/${slug}/invitar` },
  { label: "Configuración", icon: Cog, href: `/org/${slug}/configuracion` },
];

export function OrgSidebar({ org }: { org: OrgContexto }) {
  const pathname = usePathname();
  const nav = items(org.slug);

  return (
    <aside className="hidden border-r border-slate-800 bg-slate-950 text-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-800 p-6">
          <Link className="flex items-center gap-3" href={`/org/${org.slug}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-sm font-bold">
              {org.nombre.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{org.nombre}</p>
              <p className="text-xs text-slate-400">{org.plan}</p>
            </div>
          </Link>
        </div>

        <nav className="grid gap-1 p-3">
          {nav.map((item) => {
            const activo =
              item.href === `/org/${org.slug}`
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                  activo ? "bg-white/10 text-white font-semibold" : "text-slate-300 hover:bg-slate-900 hover:text-white"
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
            <p className="text-sm font-medium">Plan {org.plan}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {org.totalMiembros} miembro{org.totalMiembros !== 1 ? "s" : ""} activo{org.totalMiembros !== 1 ? "s" : ""} en tu equipo.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
