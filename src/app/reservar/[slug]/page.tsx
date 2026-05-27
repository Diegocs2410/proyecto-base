import { notFound } from "next/navigation";
import {
  getNegocioPublico,
  listarServiciosPublicos,
} from "@/modules/agenda/queries-publicas";
import { FormularioReserva } from "./formulario-reserva";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const negocio = await getNegocioPublico(slug);
  if (!negocio) notFound();

  const servicios = await listarServiciosPublicos(negocio.tenantId);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Reserva en línea
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {negocio.nombre}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Elige un servicio, fecha y horario disponible.
          </p>
        </header>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {servicios.length === 0 ? (
            <p className="text-sm text-slate-500">
              Este negocio aún no tiene servicios disponibles. Vuelve más tarde.
            </p>
          ) : (
            <FormularioReserva
              negocioNombre={negocio.nombre}
              recaptchaSiteKey={siteKey}
              servicios={servicios}
              slug={slug}
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Protegido por reCAPTCHA. Aplica la{" "}
          <a className="underline" href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">
            política de privacidad
          </a>{" "}
          y los{" "}
          <a className="underline" href="https://policies.google.com/terms" rel="noopener noreferrer" target="_blank">
            términos
          </a>{" "}
          de Google.
        </p>
      </div>
    </main>
  );
}
