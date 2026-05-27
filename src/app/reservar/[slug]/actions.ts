"use server";

import {
  calcularSlotsDisponibles,
  getNegocioPublico,
  type SlotDisponible,
} from "@/modules/agenda/queries-publicas";

/**
 * Server action ligera para obtener slots desde el cliente sin exponer el tenantId.
 */
export async function obtenerSlots(
  slug: string,
  servicioId: string,
  fechaIso: string,
): Promise<SlotDisponible[]> {
  const negocio = await getNegocioPublico(slug);
  if (!negocio) return [];
  return calcularSlotsDisponibles(negocio.tenantId, servicioId, fechaIso);
}
