"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { getStoredCookieConsent } from "@/lib/cookieConsent";

import { initMixpanel, syncMixpanelAnalyticsConsent, trackPageview } from "../lib/mixpanelClient";

export const NavigationEvents = () => {
  // Temporary disabled, as we testing autocapture

  // const pathname = usePathname();
  // const searchParams = useSearchParams();
  // const currentUrl = useRef("");

  // useEffect(() => {
  //   const url = `${pathname}?${searchParams}`;
  //   if (currentUrl.current !== url) {
  //     currentUrl.current = url;
  //     // Mixpanel rounting events
  //     //Send track event when new pages is loaded
  //     trackPageview();
  //   }
  // }, [pathname, searchParams]);

  return null;
};

export function Providers({ children }: React.PropsWithChildren) {
  useEffect(() => {
    initMixpanel();

    const storedConsent = getStoredCookieConsent();
    syncMixpanelAnalyticsConsent(storedConsent?.analytics ?? false);
  }, []);

  return (
    <>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
      <Suspense>
        <NavigationEvents />
      </Suspense>
    </>
  );
}
