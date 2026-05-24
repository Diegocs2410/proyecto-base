import { ChevronDown } from "lucide-react";

export function TenantSwitcher() {
  return (
    <button className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-left shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
        PF
      </div>
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-foreground">Plataforma</p>
        <p className="text-xs text-muted">Administrador global</p>
      </div>
      <ChevronDown className="h-4 w-4 text-muted" />
    </button>
  );
}
