"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";
import type { DirectoryStudioDetail } from "@/types/studio";
export function ClaimStudioForm({ listing }: { listing: DirectoryStudioDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function open() {
    setBusy(true);
    try {
      const { data } = await axiosInstance.post<{ public_token: string }>("/studio-setup/drafts", {
        kind: "directory",
        id: listing.external_id,
      });
      router.push(`/account/partner/studio/create?draft=${encodeURIComponent(data.public_token)}`);
    } catch {
      setError("Nie udało się przygotować szkicu. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl">{listing.name}</h1>
      <p>{listing.address}</p>
      <p>Sprawdź i popraw dane studia przed zapisaniem.</p>
      {error && <p role="alert">{error}</p>}
      <Button disabled={busy} onClick={() => void open()}>
        To moje studio
      </Button>
    </section>
  );
}
