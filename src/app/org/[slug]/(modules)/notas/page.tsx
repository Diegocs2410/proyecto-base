import { requireModuleEnabled } from "@/lib/modules/guard";
import { NotasPage } from "@/modules/notas/pages/notas-page";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org } = await requireModuleEnabled(slug, "notas");
  return <NotasPage org={org} slug={slug} />;
}
