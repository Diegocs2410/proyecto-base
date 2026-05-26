import { UserMenu } from "@/components/layout/user-menu";
import { OrgSidebar } from "@/components/org/org-sidebar";
import type { OrgContexto } from "@/lib/data/org";
import { getEnabledModules } from "@/lib/modules/loader";
import { createClient } from "@/lib/supabase/server";

export async function OrgShell({
  org,
  children,
}: {
  org: OrgContexto;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [{ data: { user } }, modulosActivos] = await Promise.all([
    supabase.auth.getUser(),
    getEnabledModules(org.id),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <OrgSidebar modulosActivos={modulosActivos} org={org} />
        <main className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Mi organización</p>
                <h2 className="text-sm font-semibold text-foreground">{org.nombre}</h2>
              </div>
              <UserMenu user={user} />
            </div>
          </header>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
