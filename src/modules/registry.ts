import type { ModuleManifest } from "@/modules/types";
import { notasManifest } from "@/modules/notas/manifest";

/**
 * Registro central de todos los módulos disponibles en la plataforma.
 * Para agregar un módulo nuevo:
 *   1. Crear src/modules/<key>/manifest.ts con un ModuleManifest
 *   2. Importarlo aquí y agregarlo al array
 *   3. Crear src/app/org/[slug]/(modules)/<key>/page.tsx (wrapper que llama
 *      requireModuleEnabled y renderiza el componente del módulo)
 *   4. Si requiere tablas: crear migración en supabase/migrations/
 */
export const moduleRegistry: ModuleManifest[] = [notasManifest];

export function getManifestByKey(key: string): ModuleManifest | undefined {
  return moduleRegistry.find((m) => m.key === key);
}
