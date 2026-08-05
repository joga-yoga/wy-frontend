"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { PhoneVerificationForm } from "@/components/partner/PhoneVerificationForm";

/**
 * Formerly a two-step "become a partner" form gating B2B entry behind name +
 * description + image + phone/SMS. Partner creation is now instant (spec-b2b §2
 * decision 3, wired in `partner/layout.tsx`), so this route no longer gates entry —
 * it's repurposed as the deferred phone-verification step, reachable wherever an
 * action needs a contactable owner (currently only `studio/create`, which opens
 * `PhoneVerificationDialog` inline instead; this page exists for a direct link/next
 * redirect target).
 */
export default function BecomePartnerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account/partner";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-bold">Zweryfikuj numer telefonu</h1>
          <p className="text-sm text-muted-foreground">
            Potwierdź numer telefonu kodem z SMS-a, aby kontynuować.
          </p>
        </div>
        <PhoneVerificationForm onVerified={() => router.replace(next)} />
      </div>
    </div>
  );
}
