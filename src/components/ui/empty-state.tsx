import { Button } from "@/components/ui/button";
import { PlugZap } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action: string;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <PlugZap className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      <Button className="mt-5" variant="secondary">
        {action}
      </Button>
    </div>
  );
}
