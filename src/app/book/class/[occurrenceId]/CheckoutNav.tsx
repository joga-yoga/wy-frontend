"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function CheckoutNav({ studioSlug }: { studioSlug?: string | null }) {
  const router = useRouter();

  return (
    <div className="mb-4 flex items-center">
      <p className="text-lg font-semibold text-gray-900">Rezerwacja</p>
      <button
        type="button"
        aria-label="Zamknij rezerwację"
        onClick={() => router.push(studioSlug ? `/studio/${studioSlug}/schedule` : "/")}
        className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f4f4] text-gray-700"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
