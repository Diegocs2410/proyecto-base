import { ShieldCheck } from "lucide-react";

interface AuditEvent {
  title: string;
  description: string;
  time: string;
}

interface AuditTimelineProps {
  events: AuditEvent[];
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Auditoría reciente</h2>
          <p className="text-sm text-muted">Eventos sensibles y cambios de seguridad.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {events.map((event) => (
          <div className="grid grid-cols-[auto_1fr_auto] gap-3" key={`${event.title}-${event.time}`}>
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted">{event.description}</p>
            </div>
            <span className="text-xs text-muted">{event.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
