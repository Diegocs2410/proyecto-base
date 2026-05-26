import { createAdminClient } from "@/lib/supabase/admin";

export interface Departamento {
  id: number;
  code: string;
  name: string;
}

export interface Ciudad {
  id: number;
  departmentId: number;
  name: string;
  isCapital: boolean;
}

export interface DatosGeoCO {
  departamentos: Departamento[];
  ciudades: Ciudad[];
}

let cache: DatosGeoCO | null = null;

/**
 * Carga todos los departamentos y ciudades. Cacheado en memoria del proceso
 * (los datos cambian raras veces; refresca con redeploy o invalidando manualmente).
 */
export async function getDatosGeoCO(): Promise<DatosGeoCO> {
  if (cache) return cache;

  const admin = createAdminClient();
  const [deptos, ciudades] = await Promise.all([
    admin.from("departments").select("id, code, name").order("name"),
    admin.from("cities").select("id, department_id, name, is_capital").order("name"),
  ]);

  cache = {
    departamentos: (deptos.data ?? []).map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
    })),
    ciudades: (ciudades.data ?? []).map((c) => ({
      id: c.id,
      departmentId: c.department_id,
      name: c.name,
      isCapital: c.is_capital,
    })),
  };

  return cache;
}

export function invalidarCacheGeo(): void {
  cache = null;
}
