import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

interface RecuperarClaveProps {
  urlReset: string;
}

export function RecuperarClaveEmail({ urlReset }: RecuperarClaveProps) {
  return (
    <EmailLayout preview="Restablece tu contraseña">
      <Heading className="text-2xl font-semibold text-slate-900">
        Restablece tu contraseña
      </Heading>
      <Text className="text-base text-slate-600">
        Recibimos una solicitud para cambiar tu contraseña. Haz clic en el botón para crear una
        nueva. El enlace es válido por 1 hora.
      </Text>
      <Section className="my-6 text-center">
        <Button
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white"
          href={urlReset}
        >
          Crear nueva contraseña
        </Button>
      </Section>
      <Text className="text-sm text-slate-500">
        Si tú no pediste cambiar la contraseña ignora este correo y tu cuenta seguirá igual.
      </Text>
    </EmailLayout>
  );
}

export default RecuperarClaveEmail;
