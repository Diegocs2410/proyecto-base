import { requireModuleEnabled } from "@/lib/modules/guard";
import { ServiciosPage } from "@/modules/agenda/pages/servicios-page";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org } = await requireModuleEnabled(slug, "agenda");
  return <ServiciosPage org={org} slug={slug} />;
}
