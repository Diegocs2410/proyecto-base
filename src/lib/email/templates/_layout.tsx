import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface LayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: LayoutProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <Section className="mb-6">
              <Text className="text-sm font-bold tracking-tight text-slate-900">Proyecto Base</Text>
            </Section>
            {children}
            <Hr className="my-8 border-slate-200" />
            <Text className="text-xs text-slate-400">
              Si no esperabas este correo puedes ignorarlo. Este mensaje fue enviado automáticamente.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
