"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { ProfileHeader } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import useIsMobile from "@/hooks/useIsMobile";

import { NavigationBlockerProvider } from "./dashboard/events/(event)/components/EventForm/block-navigation/navigation-block";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const pathname = usePathname();

  const isMobile = useIsMobile();
  const isEventPage = pathname.includes("events");
  const isSticky = !isMobile || !isEventPage;

  if (loading || !user) {
    return (
      <div className="flex flex-col bg-background">
        <main className="flex-1">Loading...</main>
      </div>
    );
  }

  return (
    <>
      <NavigationBlockerProvider>
        <ProfileHeader isSticky={isSticky} />
        {children}
      </NavigationBlockerProvider>
    </>
  );
}
