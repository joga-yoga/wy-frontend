"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { ProfileHeader } from "@/components/layout/ProfileHeader";
import { useAuth } from "@/context/AuthContext";
import useIsMobile from "@/hooks/useIsMobile";

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
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1">Loading...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <Sidebar /> */}
      <div className="flex-1 flex flex-col">
        <ProfileHeader isSticky={isSticky} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
