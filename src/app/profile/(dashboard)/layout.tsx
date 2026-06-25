"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";

import { NavigationBlockerProvider } from "./components/EventForm/block-navigation/navigation-block";

const MAIN_TAB_PATHS = ["/profile", "/profile/oferta", "/profile/konto"];
const BECOME_PARTNER_PATH = "/profile/become-partner";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProfileLayoutContent>{children}</ProfileLayoutContent>
    </Suspense>
  );
}

function ProfileLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isBecomePartner = pathname === BECOME_PARTNER_PATH;

  // null = partner status not yet resolved for the current session
  const [hasPartner, setHasPartner] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/profile/login");
    }
  }, [user, loading, router]);

  // Partner-profile guard: a logged-in user without a partner profile has nothing
  // to do in the dashboard and must complete onboarding on become-partner first.
  useEffect(() => {
    if (loading || !user) {
      return;
    }

    let cancelled = false;
    setHasPartner(null);

    axiosInstance
      .get("/partner/me")
      .then(() => {
        if (!cancelled) setHasPartner(true);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setHasPartner(false);
          if (!isBecomePartner) {
            const query = searchParams.toString();
            const currentPath = query ? `${pathname}?${query}` : pathname;
            router.replace(`${BECOME_PARTNER_PATH}?next=${encodeURIComponent(currentPath)}`);
          }
        } else {
          // Don't lock the user out of the dashboard on transient/unexpected errors.
          setHasPartner(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user, isBecomePartner, pathname, router, searchParams]);

  // First-login redirect: new partners land on Oferta, not Aktywność
  useEffect(() => {
    if (!loading && user && hasPartner === true && pathname === "/profile") {
      const shown = localStorage.getItem("wy_onboarding_shown");
      if (!shown) {
        localStorage.setItem("wy_onboarding_shown", "true");
        router.replace("/profile/oferta");
      }
    }
  }, [loading, user, hasPartner, pathname, router]);

  const isMainTab = MAIN_TAB_PATHS.includes(pathname);

  // Wait for auth, and (outside become-partner) for the partner check, before
  // rendering dashboard content — otherwise it flashes before a redirect.
  if (loading || !user || (!isBecomePartner && hasPartner !== true)) {
    return (
      <div className="flex flex-col bg-background">
        <main className="flex-1 flex justify-center items-center min-h-[100dvh] w-full">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="sr-only">Loading...</span>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <NavigationBlockerProvider>
      <DashboardTopBar />
      <div className="md:flex">
        <BottomTabBar />
        <main className={isMainTab ? "pb-28 md:pb-0 flex-1 min-w-0" : "flex-1 min-w-0"}>
          {children}
        </main>
      </div>
    </NavigationBlockerProvider>
  );
}
