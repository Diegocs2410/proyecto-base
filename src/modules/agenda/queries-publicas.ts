import { createAdminClient } from "@/lib/supabase/admin";

export interface NegocioPublico {
  tenantId: string;
  nombre: string;
  slug: string;
}

export interface ServicioPublico {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionMin: number;
  precioCop: number;
  color: string;
}

export interface RecursoPublico {
  id: string;
  nombre: string;
  color: string;
}

export interface SlotDisponible {
  iniciaEn: string;
  recursoId: string;
  recursoNombre: string;
}

/**
 * Devuelve el negocio si tiene el módulo 'agenda' activo y existe.
 * null si no aplica.
 */
export async function getNegocioPublico(slug: string): Promise<NegocioPublico | null> {
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!tenant) return null;

  const { data: feature } = await admin
    .from("tenant_features")
    .select("enabled")
    .eq("tenant_id", tenant.id)
    .eq("feature_key", "agenda")
    .maybeSingle();
  if (!feature?.enabled) return null;

  return { tenantId: tenant.id, nombre: tenant.name, slug: tenant.slug };
}

export async function listarServiciosPublicos(tenantId: string): Promise<ServicioPublico[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("servicios")
    .select("id, nombre, descripcion, duracion_min, precio_cop, color")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("nombre");

  return (data ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion,
    duracionMin: s.duracion_min,
    precioCop: s.precio_cop,
    color: s.color,
  }));
}

export async function listarRecursosPublicos(tenantId: string): Promise<RecursoPublico[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("recursos")
    .select("id, nombre, color")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("nombre");

  return (data ?? []).map((r) => ({ id: r.id, nombre: r.nombre, color: r.color }));
}

/**
 * Genera slots disponibles para un servicio en una fecha.
 * Cruza los horarios semanales de cada recurso con las citas existentes y la duración del servicio.
 *
 * fechaIso: 'YYYY-MM-DD' (zona Bogotá). Granularidad: 30 minutos.
 */
export async function calcularSlotsDisponibles(
  tenantId: string,
  servicioId: string,
  fechaIso: string,
): Promise<SlotDisponible[]> {
  const admin = createAdminClient();

  const { data: servicio } = await admin
    .from("servicios")
    .select("duracion_min, activo, tenant_id")
    .eq("id", servicioId)
    .maybeSingle();
  if (!servicio || servicio.tenant_id !== tenantId || !servicio.activo) return [];

  const duracionMs = servicio.duracion_min * 60_000;

  // Día de semana: 0 (domingo) a 6 (sábado), basado en zona Bogotá.
  // Construimos el inicio del día en hora local Bogotá → ISO.
  const inicioDiaBogota = new Date(`${fechaIso}T00:00:00-05:00`);
  const finDiaBogota = new Date(`${fechaIso}T23:59:59-05:00`);
  const diaSemana = Number(
    new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Bogota" })
      .format(inicioDiaBogota)
      .replace(/Sun/, "0")
      .replace(/Mon/, "1")
      .replace(/Tue/, "2")
      .replace(/Wed/, "3")
      .replace(/Thu/, "4")
      .replace(/Fri/, "5")
      .replace(/Sat/, "6"),
  );

  const { data: recursos } = await admin
    .from("recursos")
    .select(`
      id, nombre, activo, tenant_id,
      horarios:recurso_horarios!recurso_id(dia_semana, hora_inicio, hora_fin)
    `)
    .eq("tenant_id", tenantId)
    .eq("activo", true);

  if (!recursos || recursos.length === 0) return [];

  const { data: citasDia } = await admin
    .from("citas")
    .select("recurso_id, inicia_en, termina_en")
    .eq("tenant_id", tenantId)
    .in("estado", ["confirmada", "completada"])
    .gte("inicia_en", inicioDiaBogota.toISOString())
    .lte("inicia_en", finDiaBogota.toISOString());

  const ocupadasPorRecurso = new Map<string, Array<{ inicio: number; fin: number }>>();
  for (const c of citasDia ?? []) {
    const lista = ocupadasPorRecurso.get(c.recurso_id) ?? [];
    lista.push({
      inicio: new Date(c.inicia_en).getTime(),
      fin: new Date(c.termina_en).getTime(),
    });
    ocupadasPorRecurso.set(c.recurso_id, lista);
  }

  const slots: SlotDisponible[] = [];
  const GRANULARIDAD_MIN = 30;

  for (const recurso of recursos) {
    type Horario = { dia_semana: number; hora_inicio: string; hora_fin: string };
    const horarios = (recurso.horarios as Horario[] | null) ?? [];
    const horariosDelDia = horarios.filter((h) => h.dia_semana === diaSemana);
    if (horariosDelDia.length === 0) continue;

    const ocupadas = ocupadasPorRecurso.get(recurso.id) ?? [];
    const ahora = Date.now();

    for (const h of horariosDelDia) {
      const inicio = new Date(`${fechaIso}T${h.hora_inicio}-05:00`).getTime();
      const fin = new Date(`${fechaIso}T${h.hora_fin}-05:00`).getTime();

      for (let t = inicio; t + duracionMs <= fin; t += GRANULARIDAD_MIN * 60_000) {
        // Saltar slots en el pasado o muy cercanos (menos de 1h de anticipación).
        if (t < ahora + 60 * 60_000) continue;

        const slotFin = t + duracionMs;
        const choca = ocupadas.some((c) => t < c.fin && slotFin > c.inicio);
        if (choca) continue;

        slots.push({
          iniciaEn: new Date(t).toISOString(),
          recursoId: recurso.id,
          recursoNombre: recurso.nombre,
        });
      }
    }
  }

  // Ordenar por hora y limitar para no explotar UI.
  slots.sort((a, b) => a.iniciaEn.localeCompare(b.iniciaEn));
  return slots.slice(0, 100);
}
