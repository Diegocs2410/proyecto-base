"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { crearReservaPublica } from "@/modules/agenda/actions-publicas";
import type { ServicioPublico, SlotDisponible } from "@/modules/agenda/queries-publicas";
import { obtenerSlots } from "./actions";
import { formatCOP } from "@/lib/i18n/co";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

interface FormularioReservaProps {
  slug: string;
  negocioNombre: string;
  servicios: ServicioPublico[];
  recaptchaSiteKey: string;
}

export function FormularioReserva({
  slug,
  negocioNombre,
  servicios,
  recaptchaSiteKey,
}: FormularioReservaProps) {
  const [paso, setPaso] = useState<1 | 2 | 3 | "exito">(1);
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? "");
  const [fechaIso, setFechaIso] = useState(fechaHoyBogota());
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);
  const [cargandoSlots, startSlotsTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [pending, startTransition] = useTransition();

  // Cargar reCAPTCHA v3 si hay site key.
  useEffect(() => {
    if (!recaptchaSiteKey) return;
    if (document.querySelector(`script[data-recaptcha]`)) return;
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
    script.async = true;
    script.dataset.recaptcha = "true";
    document.head.appendChild(script);
  }, [recaptchaSiteKey]);

  const recargarSlots = useCallback(
    (svc: string, fecha: string) => {
      if (!svc || !fecha) return;
      startSlotsTransition(async () => {
        const r = await obtenerSlots(slug, svc, fecha);
        setSlots(r ?? []);
      });
    },
    [slug],
  );

  // Disparar la primera carga al entrar al paso 2.
  useEffect(() => {
    if (paso === 2) recargarSlots(servicioId, fechaIso);
    // Solo dependemos del paso: los cambios de servicio/fecha disparan recargarSlots
    // directamente desde los handlers del input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  const servicioActual = servicios.find((s) => s.id === servicioId);

  const enviarReserva = async () => {
    if (!slotSeleccionado || !servicioActual) {
      toast.error("Selecciona un horario.");
      return;
    }

    let token = "";
    if (recaptchaSiteKey && window.grecaptcha) {
      try {
        token = await new Promise<string>((resolve, reject) => {
          window.grecaptcha!.ready(() => {
            window
              .grecaptcha!.execute(recaptchaSiteKey, { action: "reservar" })
              .then(resolve)
              .catch(reject);
          });
        });
      } catch {
        toast.error("No se pudo cargar la verificación de seguridad. Recarga.");
        return;
      }
    } else if (recaptchaSiteKey) {
      toast.error("Verificación cargando, intenta en un segundo.");
      return;
    } else {
      token = "skip"; // sólo dev sin site key
    }

    startTransition(async () => {
      const r = await crearReservaPublica({
        slug,
        servicioId,
        recursoId: slotSeleccionado.recursoId,
        iniciaEn: slotSeleccionado.iniciaEn,
        clienteNombre: nombre,
        clienteEmail: email,
        clienteTelefono: telefono,
        notas,
        recaptchaToken: token,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("¡Reserva confirmada!");
      setPaso("exito");
    });
  };

  if (paso === "exito") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Reserva confirmada</h2>
        <p className="mt-2 text-sm text-slate-600">
          Te enviamos los detalles a {email}. {negocioNombre} te espera.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Pasos pasoActual={paso} />

      {paso === 1 && (
        <div className="grid gap-4">
          <p className="text-sm font-medium text-slate-700">¿Qué servicio necesitas?</p>
          <div className="grid gap-2">
            {servicios.map((s) => (
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                  servicioId === s.id
                    ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                key={s.id}
              >
                <input
                  checked={servicioId === s.id}
                  className="sr-only"
                  name="servicio"
                  onChange={() => setServicioId(s.id)}
                  type="radio"
                  value={s.id}
                />
                <span
                  aria-hidden
                  className="h-8 w-8 rounded-lg"
                  style={{ backgroundColor: s.color }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{s.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {s.duracionMin} min · {formatCOP(s.precioCop)}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <button
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            disabled={!servicioId}
            onClick={() => setPaso(2)}
            type="button"
          >
            Continuar
          </button>
        </div>
      )}

      {paso === 2 && (
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700">¿Qué día?</p>
            <input
              className={inputCls}
              min={fechaHoyBogota()}
              onChange={(e) => {
                setFechaIso(e.target.value);
                setSlotSeleccionado(null);
                recargarSlots(servicioId, e.target.value);
              }}
              type="date"
              value={fechaIso}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Horarios disponibles</p>
            {cargandoSlots ? (
              <p className="mt-2 text-sm text-slate-500">Cargando…</p>
            ) : slots.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No hay horarios disponibles en esta fecha. Prueba otra.
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot, i) => {
                  const sel =
                    slotSeleccionado?.iniciaEn === slot.iniciaEn &&
                    slotSeleccionado?.recursoId === slot.recursoId;
                  return (
                    <button
                      className={`rounded-xl border px-3 py-2 text-xs transition ${
                        sel
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-700 hover:border-slate-400"
                      }`}
                      key={`${slot.iniciaEn}-${slot.recursoId}-${i}`}
                      onClick={() => setSlotSeleccionado(slot)}
                      type="button"
                    >
                      <div className="font-medium">{formatearHora(slot.iniciaEn)}</div>
                      <div className="text-[10px] opacity-80">{slot.recursoNombre}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-2">
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => setPaso(1)}
              type="button"
            >
              Atrás
            </button>
            <button
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              disabled={!slotSeleccionado}
              onClick={() => setPaso(3)}
              type="button"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            enviarReserva();
          }}
        >
          <Campo label="Nombre completo">
            <input
              className={inputCls}
              maxLength={120}
              onChange={(e) => setNombre(e.target.value)}
              required
              value={nombre}
            />
          </Campo>
          <Campo label="Email">
            <input
              className={inputCls}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </Campo>
          <Campo label="Teléfono móvil">
            <input
              className={inputCls}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3xx xxx xxxx"
              required
              value={telefono}
            />
          </Campo>
          <Campo label="Notas (opcional)">
            <textarea
              className={`${inputCls} min-h-[80px]`}
              maxLength={500}
              onChange={(e) => setNotas(e.target.value)}
              value={notas}
            />
          </Campo>

          <div className="flex justify-between gap-2 pt-2">
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => setPaso(2)}
              type="button"
            >
              Atrás
            </button>
            <button
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Confirmando..." : "Confirmar reserva"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Pasos({ pasoActual }: { pasoActual: 1 | 2 | 3 | "exito" }) {
  const pasos = [
    { num: 1, label: "Servicio" },
    { num: 2, label: "Horario" },
    { num: 3, label: "Datos" },
  ];
  return (
    <ol className="flex justify-between gap-2 text-xs">
      {pasos.map((p) => {
        const activo = pasoActual === p.num;
        const completo = typeof pasoActual === "number" && pasoActual > p.num;
        return (
          <li
            className={`flex flex-1 items-center gap-2 rounded-full px-3 py-1 ${
              activo ? "bg-slate-900 text-white" : completo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
            }`}
            key={p.num}
          >
            <span className="font-semibold">{p.num}.</span>
            <span>{p.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function fechaHoyBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
