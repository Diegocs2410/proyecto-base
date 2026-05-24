import { UserMenu } from "@/components/layout/user-menu";
import type { User } from "@supabase/supabase-js";

export function Topbar({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Plataforma</p>
          <h2 className="text-sm font-semibold text-foreground">Panel de control</h2>
        </div>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
