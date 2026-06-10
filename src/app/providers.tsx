"use client";
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
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </>
  );
}
