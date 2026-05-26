import type { LucideIcon } from "lucide-react";

/**
 * Cada módulo activable en la plataforma se describe con un Manifest.
 * El Manifest se registra en src/modules/registry.ts y la UI de
 * /configuracion/modulos lo lee para mostrar tarjetas de activación.
 */
export interface ModuleManifest {
  /** Clave única persistida en tenant_features.feature_key. */
  key: string;
  /** Nombre visible en sidebar y UI de activación. */
  name: string;
  /** Descripción corta para tarjeta de activación. */
  description: string;
  /** Ícono lucide-react usado en sidebar y UI. */
  icon: LucideIcon;
  /** Items que se renderizan en el sidebar cuando el módulo está activo. */
  navItems: ModuleNavItem[];
  /** Plan mínimo (code) requerido para activar. "starter" = gratis. */
  minPlanCode: string;
  /** Categoría opcional para agrupar en UI ("Ventas", "Operaciones", etc.). */
  category?: string;
}

export interface ModuleNavItem {
  label: string;
  /** Path relativo al root del módulo (sin slash inicial). "" = home del módulo. */
  href: string;
  icon?: LucideIcon;
}

/** Orden de planes de menor a mayor. */
export const ORDEN_PLANES = ["starter", "team", "business", "enterprise"] as const;

/**
 * Devuelve true si planActual es igual o superior al planRequerido.
 */
export function planAlcanza(planActual: string, planRequerido: string): boolean {
  const idxActual = ORDEN_PLANES.indexOf(planActual as (typeof ORDEN_PLANES)[number]);
  const idxRequerido = ORDEN_PLANES.indexOf(
    planRequerido as (typeof ORDEN_PLANES)[number],
  );
  if (idxActual < 0 || idxRequerido < 0) return false;
  return idxActual >= idxRequerido;
}
