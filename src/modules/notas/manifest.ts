import type { ModuleManifest } from "@/modules/types";
import { StickyNote } from "lucide-react";

/**
 * Módulo demo "Notas internas".
 * Sirve como ejemplo de la convención de módulos: copia esta estructura
 * para crear un módulo nuevo (Agenda, POS, CRM, etc.).
 */
export const notasManifest: ModuleManifest = {
  key: "notas",
  name: "Notas internas",
  description:
    "Espacio compartido para anotaciones del equipo. Disponible en todos los planes.",
  icon: StickyNote,
  navItems: [{ label: "Notas", href: "", icon: StickyNote }],
  minPlanCode: "starter",
  category: "Operaciones",
};
