import type { ModuleManifest } from "@/modules/types";
import { Calendar, CalendarDays, Scissors, Users } from "lucide-react";

/**
 * Módulo Agenda / citas.
 * Calendario interno + reservas públicas + recordatorios programables.
 */
export const agendaManifest: ModuleManifest = {
  key: "agenda",
  name: "Agenda",
  description:
    "Calendario de citas con reservas públicas y recordatorios. Ideal para peluquerías, consultorios, talleres y servicios con cita previa.",
  icon: CalendarDays,
  navItems: [
    { label: "Calendario", href: "", icon: Calendar },
    { label: "Servicios", href: "/servicios", icon: Scissors },
    { label: "Recursos", href: "/recursos", icon: Users },
  ],
  minPlanCode: "team",
  category: "Operaciones",
};
