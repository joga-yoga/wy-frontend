"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

import { BottomTabBar, TAB_PATHS } from "@/components/layout/BottomTabBar";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import { useAuth } from "@/context/AuthContext";
import { OfferCreateMenuProvider } from "@/context/OfferCreateMenuContext";
import { PageHeaderProvider } from "@/context/PageHeaderContext";
import { PartnerCapabilitiesProvider } from "@/context/PartnerCapabilitiesContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { setLastMode } from "@/lib/partnerMode";

import { NavigationBlockerProvider } from "./components/EventForm/block-navigation/navigation-block";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProfileLayoutContent>{children}</ProfileLayoutContent>
    </Suspense>
  );
}

function ProfileLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // null = partner status not yet resolved for the current session
  const [hasPartner, setHasPartner] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/account/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setLastMode("b2b");
  }, []);

  // Switching to B2B creates the Partner instantly — no form (spec-b2b §2 decision 3).
  // Phone/SMS verification is deferred to the first action that needs a contactable
  // owner (currently: creating a studio, see PhoneVerificationDialog in StudioForm).
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
          axiosInstance
            .post("/partner/instant")
            .then(() => refreshUser())
            .then(() => {
              if (!cancelled) setHasPartner(true);
            })
            .catch(() => {
              // A concurrent tab may have already created it — re-check once rather
              // than stranding the user on a spinner.
              if (!cancelled) setHasPartner(true);
            });
        } else {
          // Don't lock the user out of the dashboard on transient/unexpected errors.
          setHasPartner(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user, refreshUser]);

  const isMainTab = (TAB_PATHS as readonly string[]).includes(pathname);

  // Wait for auth and the partner check before rendering dashboard content —
  // otherwise it flashes before the instant-create round trip settles.
  if (loading || !user || hasPartner !== true) {
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
    <PartnerCapabilitiesProvider>
      <NavigationBlockerProvider>
        <OfferCreateMenuProvider>
          <PageHeaderProvider>
            <DashboardTopBar />
            <div className="md:flex">
              <BottomTabBar />
              <main className={isMainTab ? "pb-28 md:pb-0 flex-1 min-w-0" : "flex-1 min-w-0"}>
                <React.Fragment key={pathname}>{children}</React.Fragment>
              </main>
            </div>
          </PageHeaderProvider>
        </OfferCreateMenuProvider>
      </NavigationBlockerProvider>
    </PartnerCapabilitiesProvider>
  );
}
