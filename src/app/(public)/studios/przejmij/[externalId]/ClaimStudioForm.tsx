"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";
import type { DirectoryStudioDetail } from "@/types/studio";

/**
 * The claim step, reusing the existing chain: sign in, create a partner profile, claim,
 * then the editor.
 *
 * The only thing this adds over the draft-token flow is the absence of a draft token — the
 * listing itself is the subject, and the backend mints the studio from it. Everything
 * downstream (partner onboarding, phone verification, the editor URL) is unchanged, which
 * is deliberate: a second claim path would be a second place for "who owns this studio" to
 * be answered differently.
 */
export function ClaimStudioForm({ listing }: { listing: DirectoryStudioDetail }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const claimPath = `/studia/przejmij/${listing.external_id}`;

  async function claim() {
    setPending(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post(`/directory/listings/${listing.external_id}/claim`);
      router.push(data.edit_url);
    } catch (caught) {
      const response = (caught as { response?: { status?: number; data?: { detail?: unknown } } })
        .response;
      const detail = response?.data?.detail;
      const code =
        typeof detail === "object" && detail !== null
          ? (detail as { code?: string }).code
          : undefined;

      if (response?.status === 401) {
        // Back here after signing in, so the claim is one tap rather than a re-navigation.
        // ⚠ The param is `next` — `login.tsx` reads `searchParams.get("next")` and ignores
        // anything else, so a `returnTo` would have silently dropped the reader on /account.
        router.push(`/account/login?next=${encodeURIComponent(claimPath)}`);
        return;
      }
      if (code === "partner_required") {
        router.push(`/account/partner/become-partner?next=${encodeURIComponent(claimPath)}`);
        return;
      }
      setError(
        typeof detail === "object" && detail !== null && "message" in detail
          ? String((detail as { message: unknown }).message)
          : "Nie udało się przejąć profilu. Spróbuj ponownie.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4 pb-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-h-middle text-gray-900">Przejmij profil studia</h1>
        <p className="text-m-descript text-gray-700">{listing.name}</p>
        {listing.address && (
          <p className="text-m-sunscript-font text-gray-500">{listing.address}</p>
        )}
      </header>

      <p className="text-m-descript text-gray-700">
        Po przejęciu profilu zarządzasz opisem, grafikiem i cennikiem samodzielnie. Strona studia
        działa dalej bez przerwy — nic z niej nie znika.
      </p>

      {error && <p className="text-m-descript text-red-600">{error}</p>}

      <Button onClick={claim} disabled={pending} className="w-full">
        {pending ? "Przejmuję…" : "To moje studio"}
      </Button>
    </div>
  );
}
