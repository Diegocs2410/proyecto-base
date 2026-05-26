import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

interface InvitacionProps {
  nombreOrg: string;
  nombreInvitador?: string | null;
  rol: string;
  urlAceptar: string;
  expiraEn: string;
}

const ETIQUETAS_ROL: Record<string, string> = {
  tenant_admin: "Administrador",
  member: "Miembro",
  viewer: "Solo lectura",
};

export function InvitacionEmail({
  nombreOrg,
  nombreInvitador,
  rol,
  urlAceptar,
  expiraEn,
}: InvitacionProps) {
  const etiquetaRol = ETIQUETAS_ROL[rol] ?? rol;
  const quienInvita = nombreInvitador ? `${nombreInvitador} te invita` : "Te invitaron";

  return (
    <EmailLayout preview={`${quienInvita} a ${nombreOrg}`}>
      <Heading className="text-2xl font-semibold text-slate-900">
        Tienes una invitación
      </Heading>
      <Text className="text-base text-slate-600">
        {quienInvita} a unirte a <strong>{nombreOrg}</strong> con el rol de{" "}
        <strong>{etiquetaRol}</strong>.
      </Text>
      <Section className="my-6 text-center">
        <Button
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white"
          href={urlAceptar}
        >
          Aceptar invitación
        </Button>
      </Section>
      <Text className="text-sm text-slate-500">
        Esta invitación expira el {expiraEn}. Si no la usas antes, pídele a la persona que te
        invitó que envíe una nueva.
      </Text>
    </EmailLayout>
  );
}

export default InvitacionEmail;
