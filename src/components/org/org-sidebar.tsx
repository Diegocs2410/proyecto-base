"use client";

import type { OrgContexto } from "@/lib/data/org";
import type { ModuleManifest } from "@/modules/types";
import { Cog, CreditCard, Home, Mail, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const itemsBase = (slug: string): NavItem[] => [
  { label: "Inicio", icon: Home, href: `/org/${slug}` },
  { label: "Miembros", icon: Users, href: `/org/${slug}/miembros` },
  { label: "Invitar personas", icon: Mail, href: `/org/${slug}/invitar` },
  { label: "Facturación", icon: CreditCard, href: `/org/${slug}/billing` },
  { label: "Configuración", icon: Cog, href: `/org/${slug}/configuracion` },
];

function itemsModulos(slug: string, modulos: ModuleManifest[]): NavItem[] {
  return modulos.flatMap((m) =>
    m.navItems.map((nav) => ({
      label: nav.label,
      icon: nav.icon ?? m.icon,
      href: nav.href
        ? `/org/${slug}/${m.key}/${nav.href}`.replace(/\/$/, "")
        : `/org/${slug}/${m.key}`,
    })),
  );
}

interface OrgSidebarProps {
  org: OrgContexto;
  modulosActivos: ModuleManifest[];
}

export function OrgSidebar({ org, modulosActivos }: OrgSidebarProps) {
  const pathname = usePathname();
  const base = itemsBase(org.slug);
  const modulos = itemsModulos(org.slug, modulosActivos);

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
          {base.map((item) => (
            <ItemLink activo={esActivo(pathname, item.href, org.slug)} item={item} key={item.label} />
          ))}

          {modulos.length > 0 && (
            <>
              <p className="mt-4 px-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                Módulos
              </p>
              {modulos.map((item) => (
                <ItemLink
                  activo={esActivo(pathname, item.href, org.slug)}
                  item={item}
                  key={item.href}
                />
              ))}
            </>
          )}
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

function esActivo(pathname: string, href: string, slug: string): boolean {
  if (href === `/org/${slug}`) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function ItemLink({ activo, item }: { activo: boolean; item: NavItem }) {
  const Icono = item.icon;
  return (
    <Link
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
        activo
          ? "bg-white/10 text-white font-semibold"
          : "text-slate-300 hover:bg-slate-900 hover:text-white"
      }`}
      href={item.href}
    >
      <Icono className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
