import { requireModuleEnabled } from "@/lib/modules/guard";
import { RecursosPage } from "@/modules/agenda/pages/recursos-page";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org } = await requireModuleEnabled(slug, "agenda");
  return <RecursosPage org={org} slug={slug} />;
}
