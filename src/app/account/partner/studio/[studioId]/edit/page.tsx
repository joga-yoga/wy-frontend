import { StudioForm } from "./StudioForm";

interface PageProps {
  params: Promise<{ studioId: string }>;
}

export default async function EditStudioPage({ params }: PageProps) {
  const { studioId } = await params;
  return <StudioForm routeId={studioId} />;
}
