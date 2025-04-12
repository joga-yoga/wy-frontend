"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

import { trackPageview } from "../constants/mixpanel";

export const NavigationEvents = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = useRef("");

  useEffect(() => {
    const url = `${pathname}?${searchParams}`;
    if (currentUrl.current !== url) {
      currentUrl.current = url;
      // Mixpanel rounting events
      //Send track event when new pages is loaded
      trackPageview();
    }
  }, [pathname, searchParams]);

  return null;
};

export function Providers({ children }: React.PropsWithChildren) {
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
