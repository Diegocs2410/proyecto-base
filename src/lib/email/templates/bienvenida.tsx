import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

interface BienvenidaProps {
  nombre: string;
  urlApp: string;
}

export function BienvenidaEmail({ nombre, urlApp }: BienvenidaProps) {
  const primerNombre = nombre.split(" ")[0] || nombre;

  return (
    <EmailLayout preview={`Bienvenido, ${primerNombre}`}>
      <Heading className="text-2xl font-semibold text-slate-900">
        ¡Hola, {primerNombre}! 👋
      </Heading>
      <Text className="text-base text-slate-600">
        Acabas de crear tu cuenta. Desde aquí puedes invitar a tu equipo, configurar tu
        organización y activar los módulos que necesites.
      </Text>
      <Section className="my-6 text-center">
        <Button
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white"
          href={urlApp}
        >
          Entrar a la plataforma
        </Button>
      </Section>
      <Text className="text-sm text-slate-500">
        ¿Tienes dudas? Responde este correo y te ayudamos.
      </Text>
    </EmailLayout>
  );
}

export default BienvenidaEmail;
