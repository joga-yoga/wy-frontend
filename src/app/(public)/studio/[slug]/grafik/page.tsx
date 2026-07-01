import { notFound } from "next/navigation";

import { getStudio } from "@/lib/api/getStudio";

import { StudioSchedulePage } from "./StudioSchedulePage";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) return {};
  return { title: `Grafik · ${studio.name} | joga.yoga` };
}

export default async function GrafikPage({ params }: Props) {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) notFound();
  return <StudioSchedulePage studio={studio} />;
}
