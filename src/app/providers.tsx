"use client";
import { LucideProvider } from "lucide-react";
import NextTopLoader from "nextjs-toploader";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { getStoredCookieConsent } from "@/lib/cookieConsent";

import { initMixpanel, syncMixpanelAnalyticsConsent } from "../lib/mixpanelClient";

export function Providers({ children }: React.PropsWithChildren) {
  useEffect(() => {
    initMixpanel();

    const storedConsent = getStoredCookieConsent();
    if (storedConsent?.decided) {
      syncMixpanelAnalyticsConsent(storedConsent.analytics);
    }
  }, []);

  return (
    <>
      <NextTopLoader color="var(--brand-green-700)" height={3} showSpinner={false} shadow={false} />
      <AuthProvider>
        <LucideProvider strokeWidth={1.75}>
          {children}
          <Toaster />
        </LucideProvider>
      </AuthProvider>
    </>
  );
}
