"use client";

import { isAxiosError } from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

import { BottomTabBar, TAB_PATHS } from "@/components/layout/BottomTabBar";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import { Button } from "@/components/ui/button";
import { type Partner, useAuth } from "@/context/AuthContext";
import { OfferCreateMenuProvider } from "@/context/OfferCreateMenuContext";
import { PageHeaderProvider } from "@/context/PageHeaderContext";
import { PartnerCapabilitiesProvider } from "@/context/PartnerCapabilitiesContext";
import { clearAuthStorage } from "@/lib/auth/logoutChain";
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
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // null = partner status not yet resolved for the current session
  const [resolution, setResolution] = useState<{
    userId: string;
    status: "ready" | "error";
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const hasPartner =
    Boolean(user?.partner) || (resolution?.userId === user?.id && resolution?.status === "ready");

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/account/login?next=${encodeURIComponent(`${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`)}`,
      );
    }
  }, [user, loading, router, pathname, searchParams]);

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

    if (user.partner || (resolution?.userId === user.id && resolution.status === "ready")) return;
    let cancelled = false;
    const acceptPartner = (partner: Partner) => {
      if (cancelled) return;
      setUser({ ...user, partner });
      setResolution({ userId: user.id, status: "ready" });
    };
    const resolve = async () => {
      try {
        try {
          const { data } = await axiosInstance.get<Partner>("/partner/me");
          acceptPartner(data);
          return;
        } catch (error) {
          if (cancelled) return;
          if (!isAxiosError(error) || error.response?.status !== 404) throw error;
        }
        try {
          const { data } = await axiosInstance.post<Partner>("/partner/instant");
          acceptPartner(data);
        } catch (error) {
          if (cancelled) return;
          if (isAxiosError(error) && error.response?.status === 401) throw error;
          const { data } = await axiosInstance.get<Partner>("/partner/me");
          acceptPartner(data);
        }
      } catch (error) {
        if (cancelled) return;
        if (isAxiosError(error) && error.response?.status === 401) {
          clearAuthStorage();
          setUser(null);
          return;
        }
        setResolution({ userId: user.id, status: "error" });
      }
    };
    void resolve();
    return () => {
      cancelled = true;
    };
    // Resolution is the result, not a trigger. Same-account refresh keeps mounted content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, setUser, attempt]);

  const isMainTab = (TAB_PATHS as readonly string[]).includes(pathname);

  // Wait for auth and the partner check before rendering dashboard content —
  // otherwise it flashes before the instant-create round trip settles.
  if (
    !loading &&
    user &&
    !hasPartner &&
    resolution?.userId === user.id &&
    resolution.status === "error"
  ) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p role="alert">Nie udało się otworzyć konta partnera. Spróbuj ponownie.</p>
        <Button
          onClick={() => {
            setResolution(null);
            setAttempt((value) => value + 1);
          }}
        >
          Spróbuj ponownie
        </Button>
      </main>
    );
  }
  if (loading || !user || !hasPartner) {
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
