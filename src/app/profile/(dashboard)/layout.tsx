"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { Suspense, useEffect } from "react";

import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import { useAuth } from "@/context/AuthContext";

import { NavigationBlockerProvider } from "./components/EventForm/block-navigation/navigation-block";

const MAIN_TAB_PATHS = ["/profile", "/profile/oferta", "/profile/konto"];

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

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/profile/login");
    }
  }, [user, loading, router]);

  // First-login redirect: new users land on Oferta, not Aktywność
  useEffect(() => {
    if (!loading && user && pathname === "/profile") {
      const shown = localStorage.getItem("wy_onboarding_shown");
      if (!shown) {
        localStorage.setItem("wy_onboarding_shown", "true");
        router.replace("/profile/oferta");
      }
    }
  }, [loading, user, pathname, router]);

  const isMainTab = MAIN_TAB_PATHS.includes(pathname);

  if (loading || !user) {
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
      <main className={isMainTab ? "pb-28" : undefined}>{children}</main>
      <BottomTabBar />
    </NavigationBlockerProvider>
  );
}
