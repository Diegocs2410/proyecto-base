import { requireModuleEnabled } from "@/lib/modules/guard";
import { CalendarioPage } from "@/modules/agenda/pages/calendario-page";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org } = await requireModuleEnabled(slug, "agenda");
  return <CalendarioPage org={org} slug={slug} />;
}
