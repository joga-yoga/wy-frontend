"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";

/**
 * There is no "Aktywność"/"Dziś" tab in the target shell (spec-b2b §3) — the bare
 * `/konto/partner` root is only a landing redirector now. A partner with any
 * schedule source lands on Grafik; a fresh or events-only partner lands on
 * Rezerwacje, which doubles as the onboarding surface (spec-b2b §5).
 */
export default function PartnerRootPage() {
  const router = useRouter();
  const { capabilities, isLoading } = usePartnerCapabilities();

  useEffect(() => {
    if (isLoading || !capabilities) return;
    router.replace(
      capabilities.landingTab === "grafik" ? "/konto/partner/grafik" : "/konto/partner/rezerwacje",
    );
  }, [isLoading, capabilities, router]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </main>
  );
}
