"use client";
import { useSearchParams } from "next/navigation";
import { StudioDiscovery } from "@/components/studio-cta/StudioDiscovery";
import { StudioForm } from "../[studioId]/edit/StudioForm";

export default function CreateStudioPage() {
  const params = useSearchParams();
  if (params.get("step") === "manual" || params.has("draft"))
    return <StudioForm routeId="create" initialName={params.get("name") ?? ""} />;
  return (
    <div className="mx-auto max-w-2xl p-6">
      <StudioDiscovery />
    </div>
  );
}
