"use server";

import { esFalla, requirePermission } from "@/lib/security/require";
import { logAudit } from "@/lib/audit/log";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { programarRecordatorios } from "@/lib/notificaciones/recordatorios";

const servicioSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre obligatorio.").max(120),
  descripcion: z.string().trim().max(1000).optional().or(z.literal("")),
  duracionMin: z.coerce
    .number()
    .int()
    .min(5, "Duración mínima 5 minutos.")
    .max(600, "Duración máxima 10 horas."),
  precioCop: z.coerce.number().int().min(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido."),
});

const recursoSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre obligatorio.").max(120),
  tipo: z.enum(["persona", "espacio", "equipo"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido."),
  email: z.string().trim().email("Email inválido.").optional().or(z.literal("")),
});

const horarioSchema = z.object({
  recursoId: z.string().uuid(),
  diaSemana: z.coerce.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida."),
  horaFin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida."),
});

const citaSchema = z.object({
  servicioId: z.string().uuid(),
  recursoId: z.string().uuid(),
  clienteNombre: z.string().trim().min(1).max(120),
  clienteTelefono: z.string().trim().max(30).optional().or(z.literal("")),
  clienteEmail: z.string().trim().email().optional().or(z.literal("")),
  iniciaEn: z.string().datetime({ offset: true }),
  notas: z.string().trim().max(2000).optional().or(z.literal("")),
});

type Resultado = { error?: string; ok?: true; id?: string };

// ─── Servicios ──────────────────────────────────────────────────────

export async function guardarServicio(
  tenantId: string,
  slug: string,
  datos: {
    id?: string;
    nombre: string;
    descripcion: string;
    duracionMin: number | string;
    precioCop: number | string;
    color: string;
    activo?: boolean;
  },
): Promise<Resultado> {
  const parsed = servicioSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const r = await requirePermission(tenantId, "tenant.manage");
  if (esFalla(r)) return r;
  const { user, admin } = r;

  const payload = {
    tenant_id: tenantId,
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion?.trim() || null,
    duracion_min: parsed.data.duracionMin,
    precio_cop: parsed.data.precioCop,
    color: parsed.data.color,
    activo: datos.activo ?? true,
  };

  let registroId = datos.id;
  if (datos.id) {
    const { error } = await admin
      .from("servicios")
      .update(payload)
      .eq("id", datos.id)
      .eq("tenant_id", tenantId);
    if (error) return { error: "No se pudo actualizar el servicio." };
  } else {
    const { data, error } = await admin
      .from("servicios")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) return { error: "No se pudo crear el servicio." };
    registroId = data.id;
  }

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: datos.id ? "update" : "create",
      entityType: "servicio",
      entityId: registroId,
    },
    admin,
  );

  revalidatePath(`/org/${slug}/agenda/servicios`);
  return { ok: true, id: registroId };
}

export async function archivarServicio(
  tenantId: string,
  slug: string,
  servicioId: string,
): Promise<Resultado> {
  const r = await requirePermission(tenantId, "tenant.manage");
  if (esFalla(r)) return r;
  const { user, admin } = r;

  const { error } = await admin
    .from("servicios")
    .update({ activo: false })
    .eq("id", servicioId)
    .eq("tenant_id", tenantId);

  if (error) return { error: "No se pudo archivar el servicio." };

  await logAudit(
    { tenantId, actorUserId: user.id, action: "archive", entityType: "servicio", entityId: servicioId },
    admin,
  );

  revalidatePath(`/org/${slug}/agenda/servicios`);
  return { ok: true };
}

// ─── Recursos ───────────────────────────────────────────────────────

export async function guardarRecurso(
  tenantId: string,
  slug: string,
  datos: {
    id?: string;
    nombre: string;
    tipo: string;
    color: string;
    email: string;
    activo?: boolean;
  },
): Promise<Resultado> {
  const parsed = recursoSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const r = await requirePermission(tenantId, "tenant.manage");
  if (esFalla(r)) return r;
  const { user, admin } = r;

  const payload = {
    tenant_id: tenantId,
    nombre: parsed.data.nombre,
    tipo: parsed.data.tipo,
    color: parsed.data.color,
    email: parsed.data.email?.trim() || null,
    activo: datos.activo ?? true,
  };

  let registroId = datos.id;
  if (datos.id) {
    const { error } = await admin
      .from("recursos")
      .update(payload)
      .eq("id", datos.id)
      .eq("tenant_id", tenantId);
    if (error) return { error: "No se pudo actualizar el recurso." };
  } else {
    const { data, error } = await admin
      .from("recursos")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) return { error: "No se pudo crear el recurso." };
    registroId = data.id;
  }

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: datos.id ? "update" : "create",
      entityType: "recurso",
      entityId: registroId,
    },
    admin,
  );

  revalidatePath(`/org/${slug}/agenda/recursos`);
  return { ok: true, id: registroId };
}

export async function archivarRecurso(
  tenantId: string,
  slug: string,
  recursoId: string,
): Promise<Resultado> {
  const r = await requirePermission(tenantId, "tenant.manage");
  if (esFalla(r)) return r;
  const { user, admin } = r;

  const { error } = await admin
    .from("recursos")
    .update({ activo: false })
    .eq("id", recursoId)
    .eq("tenant_id", tenantId);

  if (error) return { error: "No se pudo archivar el recurso." };

  await logAudit(
    { tenantId, actorUserId: user.id, action: "archive", entityType: "recurso", entityId: recursoId },
    admin,
  );

  revalidatePath(`/org/${slug}/agenda/recursos`);
  return { ok: true };
}

// ─── Horarios ───────────────────────────────────────────────────────

export async function guardarHorario(
  tenantId: string,
  slug: string,
  datos: { id?: string; recursoId: string; diaSemana: number | string; horaInicio: string; horaFin: string },
): Promise<Resultado> {
  const parsed = horarioSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  if (parsed.data.horaFin <= parsed.data.horaInicio) {
    return { error: "La hora fin debe ser mayor que la hora inicio." };
  }

  const r = await requirePermission(tenantId, "tenant.manage");
  if (esFalla(r)) return r;
  const { user, admin } = r;

  // Verificar que el recurso pertenece al tenant.
  const { data: recurso } = await admin
    .from("recursos")
    .select("tenant_id")
    .eq("id", parsed.data.recursoId)
    .maybeSingle();
  if (!recurso || recurso.tenant_id !== tenantId) {
    return { error: "Recurso no encontrado en esta organización." };
  }

  const payload = {
    recurso_id: parsed.data.recursoId,
    dia_semana: parsed.data.diaSemana,
    hora_inicio: parsed.data.horaInicio,
    hora_fin: parsed.data.horaFin,
  };

  let registroId = datos.id;
  if (datos.id) {
    const { error } = await admin
      .from("recurso_horarios")
      .update(payload)
      .eq("id", datos.id);
    if (error) return { error: "No se pudo actualizar el horario." };
  } else {
    const { data, error } = await admin
      .from("recurso_horarios")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) return { error: "Ya existe un horario en ese día y hora." };
    registroId = data.id;
  }

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: datos.id ? "update" : "create",
      entityType: "horario",
      entityId: registroId,
    },
    admin,
  );

  revalidatePath(`/org/${slug}/agenda/recursos`);
  return { ok: true, id: registroId };
}

export async function eliminarHorario(
  tenantId: string,
  slug: string,
  horarioId: string,
): Promise<Resultado> {
  const r = await requirePermission(tenantId, "tenant.manage");
  if (esFalla(r)) return r;
  const { user, admin } = r;

  // Verificar que el horario pertenece a un recurso del tenant.
  const { data: horario } = await admin
    .from("recurso_horarios")
    .select("recurso_id, recursos!recurso_id(tenant_id)")
    .eq("id", horarioId)
    .maybeSingle();
  const tenantHorario = (horario?.recursos as { tenant_id: string } | null)?.tenant_id;
  if (!horario || tenantHorario !== tenantId) {
    return { error: "Horario no encontrado en esta organización." };
  }

  const { error } = await admin.from("recurso_horarios").delete().eq("id", horarioId);
  if (error) return { error: "No se pudo eliminar el horario." };

  await logAudit(
    { tenantId, actorUserId: user.id, action: "delete", entityType: "horario", entityId: horarioId },
    admin,
  );

  revalidatePath(`/org/${slug}/agenda/recursos`);
  return { ok: true };
}

// ─── Citas ──────────────────────────────────────────────────────────

export async function crearCitaInterna(
  tenantId: string,
  slug: string,
  datos: {
    servicioId: string;
    recursoId: string;
    clienteNombre: string;
    clienteTelefono: string;
    clienteEmail: string;
    iniciaEn: string;
    notas: string;
  },
): Promise<Resultado> {
  const parsed = citaSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const r = await requirePermission(tenantId, "tenant.read");
  if (esFalla(r)) return r;
  const { user, admin } = r;

  // Validar servicio del tenant + obtener duración.
  const { data: servicio } = await admin
    .from("servicios")
    .select("duracion_min, tenant_id, activo")
    .eq("id", parsed.data.servicioId)
    .maybeSingle();
  if (!servicio || servicio.tenant_id !== tenantId) {
    return { error: "Servicio no válido." };
  }
  if (!servicio.activo) return { error: "El servicio no está activo." };

  // Validar recurso del tenant.
  const { data: recurso } = await admin
    .from("recursos")
    .select("tenant_id, activo")
    .eq("id", parsed.data.recursoId)
    .maybeSingle();
  if (!recurso || recurso.tenant_id !== tenantId) {
    return { error: "Recurso no válido." };
  }
  if (!recurso.activo) return { error: "El recurso no está activo." };

  const inicia = new Date(parsed.data.iniciaEn);
  const termina = new Date(inicia.getTime() + servicio.duracion_min * 60_000);

  // Verificar solapamiento con citas activas del recurso.
  const { data: conflicto } = await admin
    .from("citas")
    .select("id")
    .eq("recurso_id", parsed.data.recursoId)
    .in("estado", ["confirmada", "completada"])
    .lt("inicia_en", termina.toISOString())
    .gt("termina_en", inicia.toISOString())
    .limit(1)
    .maybeSingle();
  if (conflicto) return { error: "Ese horario ya está ocupado." };

  const { data: cita, error } = await admin
    .from("citas")
    .insert({
      tenant_id: tenantId,
      servicio_id: parsed.data.servicioId,
      recurso_id: parsed.data.recursoId,
      cliente_nombre: parsed.data.clienteNombre,
      cliente_telefono: parsed.data.clienteTelefono?.trim() || null,
      cliente_email: parsed.data.clienteEmail?.trim() || null,
      inicia_en: inicia.toISOString(),
      termina_en: termina.toISOString(),
      estado: "confirmada",
      origen: "interno",
      notas: parsed.data.notas?.trim() || null,
      creada_por: user.id,
    })
    .select("id")
    .single();

  if (error || !cita) return { error: "No se pudo crear la cita." };

  await programarRecordatorios(cita.id, inicia, admin);

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: "create",
      entityType: "cita",
      entityId: cita.id,
    },
    admin,
  );

  revalidatePath(`/org/${slug}/agenda`);
  return { ok: true, id: cita.id };
}

export async function cambiarEstadoCita(
  tenantId: string,
  slug: string,
  citaId: string,
  estado: "confirmada" | "completada" | "no_asistio" | "cancelada",
): Promise<Resultado> {
  const r = await requirePermission(tenantId, "tenant.read");
  if (esFalla(r)) return r;
  const { user, admin } = r;

  const { error } = await admin
    .from("citas")
    .update({ estado })
    .eq("id", citaId)
    .eq("tenant_id", tenantId);

  if (error) return { error: "No se pudo actualizar la cita." };

  await logAudit(
    {
      tenantId,
      actorUserId: user.id,
      action: `cita.${estado}`,
      entityType: "cita",
      entityId: citaId,
    },
    admin,
  );

  revalidatePath(`/org/${slug}/agenda`);
  return { ok: true };
}
