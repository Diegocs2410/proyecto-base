/**
 * Formateadores para Colombia. Fase 3 expandirá con validadores NIT, geo, etc.
 */

const FORMATTER_COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const FORMATTER_FECHA_LARGA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeZone: "America/Bogota",
});

const FORMATTER_FECHA_CORTA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

const FORMATTER_FECHA_HORA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

/**
 * Formatea un valor en pesos colombianos enteros.
 * @param valorCop Valor en pesos (sin centavos). Ej: 49000 → "$ 49.000".
 */
export function formatCOP(valorCop: number): string {
  return FORMATTER_COP.format(valorCop);
}

export function formatFechaCO(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return FORMATTER_FECHA_LARGA.format(d);
}

export function formatFechaCortaCO(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return FORMATTER_FECHA_CORTA.format(d);
}

export function formatFechaHoraCO(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return FORMATTER_FECHA_HORA.format(d);
}
