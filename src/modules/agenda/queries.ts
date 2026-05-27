import { createAdminClient } from "@/lib/supabase/admin";

export interface ServicioItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionMin: number;
  precioCop: number;
  color: string;
  activo: boolean;
}

export interface RecursoItem {
  id: string;
  nombre: string;
  tipo: "persona" | "espacio" | "equipo";
  color: string;
  email: string | null;
  activo: boolean;
}

export interface HorarioItem {
  id: string;
  recursoId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

export interface CitaItem {
  id: string;
  servicioId: string;
  servicioNombre: string;
  recursoId: string;
  recursoNombre: string;
  color: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  iniciaEn: string;
  terminaEn: string;
  estado: "confirmada" | "completada" | "no_asistio" | "cancelada";
  origen: "interno" | "publico";
  notas: string | null;
}

export async function listarServicios(
  tenantId: string,
  soloActivos = false,
): Promise<ServicioItem[]> {
  const admin = createAdminClient();
  let query = admin
    .from("servicios")
    .select("id, nombre, descripcion, duracion_min, precio_cop, color, activo")
    .eq("tenant_id", tenantId)
    .order("nombre", { ascending: true });

  if (soloActivos) query = query.eq("activo", true);

  const { data } = await query;
  return (data ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion,
    duracionMin: s.duracion_min,
    precioCop: s.precio_cop,
    color: s.color,
    activo: s.activo,
  }));
}

export async function listarRecursos(
  tenantId: string,
  soloActivos = false,
): Promise<RecursoItem[]> {
  const admin = createAdminClient();
  let query = admin
    .from("recursos")
    .select("id, nombre, tipo, color, email, activo")
    .eq("tenant_id", tenantId)
    .order("nombre", { ascending: true });

  if (soloActivos) query = query.eq("activo", true);

  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo as RecursoItem["tipo"],
    color: r.color,
    email: r.email,
    activo: r.activo,
  }));
}

export async function listarHorariosPorRecurso(
  recursoId: string,
): Promise<HorarioItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("recurso_horarios")
    .select("id, recurso_id, dia_semana, hora_inicio, hora_fin")
    .eq("recurso_id", recursoId)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });

  return (data ?? []).map((h) => ({
    id: h.id,
    recursoId: h.recurso_id,
    diaSemana: h.dia_semana,
    horaInicio: h.hora_inicio,
    horaFin: h.hora_fin,
  }));
}

export async function listarCitasEnRango(
  tenantId: string,
  desde: string,
  hasta: string,
): Promise<CitaItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("citas")
    .select(`
      id, servicio_id, recurso_id, cliente_nombre, cliente_telefono, cliente_email,
      inicia_en, termina_en, estado, origen, notas,
      servicio:servicios!servicio_id(nombre, color),
      recurso:recursos!recurso_id(nombre)
    `)
    .eq("tenant_id", tenantId)
    .gte("inicia_en", desde)
    .lt("inicia_en", hasta)
    .order("inicia_en", { ascending: true });

  return (data ?? []).map((c) => {
    const servicio = c.servicio as { nombre: string; color: string } | null;
    const recurso = c.recurso as { nombre: string } | null;
    return {
      id: c.id,
      servicioId: c.servicio_id,
      servicioNombre: servicio?.nombre ?? "—",
      recursoId: c.recurso_id,
      recursoNombre: recurso?.nombre ?? "—",
      color: servicio?.color ?? "#3b82f6",
      clienteNombre: c.cliente_nombre,
      clienteTelefono: c.cliente_telefono,
      clienteEmail: c.cliente_email,
      iniciaEn: c.inicia_en,
      terminaEn: c.termina_en,
      estado: c.estado as CitaItem["estado"],
      origen: c.origen as CitaItem["origen"],
      notas: c.notas,
    };
  });
}

export interface ResumenAgenda {
  citasHoy: number;
  citasSemana: number;
  noAsistioMes: number;
}

export async function getResumenAgenda(tenantId: string): Promise<ResumenAgenda> {
  const admin = createAdminClient();
  const hoyIso = new Date().toISOString().slice(0, 10);
  const inicioHoy = new Date(`${hoyIso}T00:00:00`);
  const finHoy = new Date(inicioHoy);
  finHoy.setDate(finHoy.getDate() + 1);
  const finSemana = new Date(inicioHoy);
  finSemana.setDate(finSemana.getDate() + 7);
  const inicioMes = new Date(inicioHoy);
  inicioMes.setDate(1);

  const [hoy, semana, noShow] = await Promise.all([
    admin
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("inicia_en", inicioHoy.toISOString())
      .lt("inicia_en", finHoy.toISOString())
      .in("estado", ["confirmada", "completada"]),
    admin
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("inicia_en", inicioHoy.toISOString())
      .lt("inicia_en", finSemana.toISOString())
      .in("estado", ["confirmada", "completada"]),
    admin
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("inicia_en", inicioMes.toISOString())
      .eq("estado", "no_asistio"),
  ]);

  return {
    citasHoy: hoy.count ?? 0,
    citasSemana: semana.count ?? 0,
    noAsistioMes: noShow.count ?? 0,
  };
}
