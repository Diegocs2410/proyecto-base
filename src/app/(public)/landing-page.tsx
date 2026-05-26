import { PlanBadge } from "@/components/ui/plan-badge";
import { getPlanesActivos } from "@/lib/data/billing";
import { formatCOP } from "@/lib/i18n/co";
import { moduleRegistry } from "@/modules/registry";
import { ArrowRight, Check, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

const DESCRIPCIONES_PLAN: Record<string, string> = {
  starter: "Ideal para equipos pequeños que están empezando.",
  team: "Para equipos en crecimiento con más colaboración.",
  business: "Potencia avanzada para empresas en expansión.",
  enterprise: "Solución a la medida para grandes organizaciones.",
};

const FAQS = [
  {
    pregunta: "¿Cuánto tiempo dura el periodo de prueba?",
    respuesta:
      "14 días gratis al crear tu organización, sin tarjeta de crédito. Al final eliges si pagas o sigues en el plan gratuito.",
  },
  {
    pregunta: "¿Qué métodos de pago aceptan?",
    respuesta:
      "Pagamos con Wompi (Bancolombia): tarjetas de crédito y débito, PSE y Nequi. Todos los precios están en pesos colombianos.",
  },
  {
    pregunta: "¿Puedo cancelar cuando quiera?",
    respuesta:
      "Sí. Cancelas desde la configuración de tu organización y mantienes el acceso hasta el fin del período pagado. No hay penalizaciones.",
  },
  {
    pregunta: "¿Cómo funcionan los módulos?",
    respuesta:
      "Activas solo los módulos que necesita tu negocio. Cada módulo agrega funciones específicas (agenda, ventas, CRM, etc.). Algunos requieren un plan superior.",
  },
];

export async function LandingPage() {
  const planes = await getPlanesActivos();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />

      <main>
        <Hero />
        <Modulos />
        <Planes planes={planes} />
        <Faq />
        <CtaFinal />
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2.5" href="/">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
            PX
          </div>
          <span className="text-base font-semibold">Proyecto Base</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-block"
            href="#planes"
          >
            Planes
          </Link>
          <Link
            className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-block"
            href="/auth/login"
          >
            Iniciar sesión
          </Link>
          <Link
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href="/auth/registro"
          >
            Crear cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <PlanBadge label="Para negocios colombianos" />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            La base de software de tu negocio,
            <br className="hidden sm:inline" />
            <span className="text-slate-500"> en un solo lugar.</span>
          </h1>
          <p className="mt-6 text-lg leading-7 text-slate-600">
            Gestiona equipo, clientes y operaciones desde una sola plataforma. Activa solo los
            módulos que tu negocio necesita y paga lo justo.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/auth/registro"
            >
              Empezar gratis 14 días
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              href="/auth/login"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Sin tarjeta de crédito · Cancelas cuando quieras
          </p>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
          <BeneficioCard
            icon={Zap}
            title="Listo en minutos"
            description="Crea tu cuenta, invita a tu equipo y empieza a operar el mismo día."
          />
          <BeneficioCard
            icon={ShieldCheck}
            title="Seguro por diseño"
            description="Roles, permisos y auditoría incorporados. Datos aislados por organización."
          />
          <BeneficioCard
            icon={Sparkles}
            title="Crece con tu negocio"
            description="Activa módulos nuevos cuando los necesites. Paga por lo que usas."
          />
        </div>
      </div>
    </section>
  );
}

function BeneficioCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function Modulos() {
  if (moduleRegistry.length === 0) return null;

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Un módulo para cada parte de tu operación
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Activa solo lo que necesitas. Más módulos llegan cada mes.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moduleRegistry.map((m) => {
            const Icon = m.icon;
            return (
              <div
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                key={m.key}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{m.name}</h3>
                {m.category && (
                  <p className="text-xs uppercase tracking-wide text-slate-500">{m.category}</p>
                )}
                <p className="mt-2 text-sm leading-6 text-slate-600">{m.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Planes({
  planes,
}: {
  planes: Awaited<ReturnType<typeof getPlanesActivos>>;
}) {
  return (
    <section className="py-24" id="planes">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Planes en pesos colombianos
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Sin sorpresas. Cambias de plan cuando quieras.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {planes.map((plan) => {
            const esGratis = plan.priceCop <= 0;
            const destacado = plan.code === "team";
            return (
              <div
                className={`flex flex-col rounded-3xl border p-6 shadow-sm ${
                  destacado
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white"
                }`}
                key={plan.id}
              >
                <p
                  className={`text-sm font-medium ${
                    destacado ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {plan.name}
                </p>
                <p
                  className={`mt-3 text-4xl font-bold ${
                    destacado ? "text-white" : "text-slate-900"
                  }`}
                >
                  {esGratis ? "Gratis" : formatCOP(plan.priceCop)}
                </p>
                {!esGratis && (
                  <p className={`text-xs ${destacado ? "text-slate-400" : "text-slate-500"}`}>
                    por mes
                  </p>
                )}
                <p
                  className={`mt-4 text-sm leading-6 ${
                    destacado ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {DESCRIPCIONES_PLAN[plan.code] ?? "Plan personalizado."}
                </p>
                <ul className="mt-6 grid gap-2 text-sm">
                  <li
                    className={`flex items-center gap-2 ${
                      destacado ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    Hasta {plan.maxUsers} usuarios
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      destacado ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    Hasta {plan.maxWorkspaces} espacios
                  </li>
                </ul>
                <Link
                  className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    destacado
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                  href="/auth/registro"
                >
                  {esGratis ? "Empezar gratis" : "Probar 14 días"}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-slate-500">
          Todos los planes incluyen prueba de 14 días sin tarjeta. Los precios incluyen IVA.
        </p>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-12 grid gap-4">
          {FAQS.map((faq) => (
            <details
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={faq.pregunta}
            >
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-slate-900 marker:hidden">
                {faq.pregunta}
                <span className="text-slate-400 transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{faq.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFinal() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 px-8 py-16 text-center text-white sm:px-16">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Empieza con tu prueba gratis hoy
          </h2>
          <p className="mt-4 text-base text-slate-300">
            14 días para conocer la plataforma. Sin tarjeta. Sin compromiso.
          </p>
          <div className="mt-8">
            <Link
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              href="/auth/registro"
            >
              Crear mi cuenta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center text-sm text-slate-500 sm:flex-row sm:justify-between sm:text-left sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Proyecto Base · Hecho en Colombia</p>
        <div className="flex items-center gap-6">
          <Link className="hover:text-slate-900" href="/auth/login">
            Iniciar sesión
          </Link>
          <Link className="hover:text-slate-900" href="/auth/registro">
            Crear cuenta
          </Link>
        </div>
      </div>
    </footer>
  );
}
