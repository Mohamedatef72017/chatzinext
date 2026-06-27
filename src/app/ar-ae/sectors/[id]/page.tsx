import { SectorPage } from "@/components/landing/sector-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SectorPage locale="ar-ae" id={id} />;
}
