import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

interface RecordatorioCitaProps {
  clienteNombre: string;
  negocioNombre: string;
  servicioNombre: string;
  recursoNombre: string;
  fechaTexto: string;
  ventana: "24h" | "1h";
}

export function RecordatorioCitaEmail({
  clienteNombre,
  negocioNombre,
  servicioNombre,
  recursoNombre,
  fechaTexto,
  ventana,
}: RecordatorioCitaProps) {
  const titulo =
    ventana === "24h"
      ? "Recuerda tu cita de mañana"
      : "Tu cita comienza en una hora";

  return (
    <EmailLayout preview={titulo}>
      <Heading className="text-xl font-semibold text-slate-900">{titulo}</Heading>
      <Section className="mt-4">
        <Text className="text-sm text-slate-700">Hola {clienteNombre},</Text>
        <Text className="text-sm text-slate-700">
          Te recordamos tu cita en <strong>{negocioNombre}</strong>:
        </Text>
        <Text className="text-sm text-slate-700">
          <strong>Servicio:</strong> {servicioNombre}
          <br />
          <strong>Con:</strong> {recursoNombre}
          <br />
          <strong>Fecha:</strong> {fechaTexto}
        </Text>
        <Text className="text-sm text-slate-700">
          Si no puedes asistir, por favor avisa con anticipación.
        </Text>
      </Section>
    </EmailLayout>
  );
}
