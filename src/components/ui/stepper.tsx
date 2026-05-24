import { Check } from "lucide-react";

interface Step {
  label: string;
  descripcion: string;
}

interface StepperProps {
  pasos: Step[];
  actual: number;
}

export function Stepper({ pasos, actual }: StepperProps) {
  return (
    <ol className="flex w-full items-start gap-0">
      {pasos.map((paso, index) => {
        const completado = index < actual;
        const enCurso = index === actual;

        return (
          <li className="flex flex-1 flex-col items-center" key={paso.label}>
            <div className="flex w-full items-center">
              {index > 0 && (
                <div className={`h-0.5 flex-1 transition-colors ${completado ? "bg-slate-900" : "bg-slate-200"}`} />
              )}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                  completado
                    ? "border-slate-900 bg-slate-900 text-white"
                    : enCurso
                      ? "border-slate-900 bg-white text-slate-900"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {completado ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < pasos.length - 1 && (
                <div className={`h-0.5 flex-1 transition-colors ${completado ? "bg-slate-900" : "bg-slate-200"}`} />
              )}
            </div>
            <div className="mt-3 hidden text-center sm:block">
              <p className={`text-xs font-semibold ${enCurso ? "text-slate-900" : completado ? "text-slate-600" : "text-slate-400"}`}>
                {paso.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{paso.descripcion}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
