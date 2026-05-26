import { z } from "zod";

/**
 * Validadores específicos para Colombia.
 * NIT: usa algoritmo DIAN para dígito de verificación.
 * Cédula: 6-10 dígitos.
 * Teléfono móvil CO: 10 dígitos comenzando en 3 (con o sin +57).
 */

const PESOS_NIT = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/**
 * Calcula el dígito de verificación de un NIT según la DIAN.
 * @param numeroSinDV NIT sin el dígito de verificación (solo dígitos).
 */
export function calcularDvNit(numeroSinDV: string): number {
  let suma = 0;
  const digitos = numeroSinDV.split("").reverse();
  for (let i = 0; i < digitos.length; i++) {
    suma += Number(digitos[i]) * PESOS_NIT[i];
  }
  const resto = suma % 11;
  return resto >= 2 ? 11 - resto : resto;
}

/**
 * Acepta "900123456-7", "9001234567", "900.123.456-7".
 * Si viene sin DV, retorna inválido (mejor exigir formato claro).
 */
export const nitSchema = z
  .string()
  .min(1, "El NIT es obligatorio.")
  .transform((s) => s.replace(/[\.\s]/g, ""))
  .refine((s) => /^\d{6,10}-\d$/.test(s), {
    message: "Formato esperado: 900123456-7",
  })
  .refine(
    (s) => {
      const [numero, dv] = s.split("-");
      return calcularDvNit(numero) === Number(dv);
    },
    { message: "El dígito de verificación no coincide." },
  );

/**
 * Cédula: solo dígitos, 6-10 caracteres.
 */
export const cedulaSchema = z
  .string()
  .min(1, "La cédula es obligatoria.")
  .transform((s) => s.replace(/[\.\s]/g, ""))
  .refine((s) => /^\d{6,10}$/.test(s), {
    message: "La cédula debe tener entre 6 y 10 dígitos.",
  });

/**
 * Teléfono móvil colombiano (10 dígitos comenzando en 3).
 * Acepta "+57 312 555 1234", "3125551234", "+573125551234", etc.
 */
export const telefonoCOSchema = z
  .string()
  .min(1, "El teléfono es obligatorio.")
  .transform((s) => s.replace(/[\s\-\(\)]/g, "").replace(/^\+?57/, ""))
  .refine((s) => /^3\d{9}$/.test(s), {
    message: "Debe ser un número móvil colombiano (10 dígitos, comienza con 3).",
  });

/**
 * Identificación genérica: NIT o cédula, según tipo.
 */
export const tipoDocumentoSchema = z.enum(["CC", "CE", "NIT", "PA"]);

export type TipoDocumento = z.infer<typeof tipoDocumentoSchema>;

export const ETIQUETAS_DOCUMENTO: Record<TipoDocumento, string> = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  NIT: "NIT",
  PA: "Pasaporte",
};
