"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { ProfileHeader } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <Sidebar /> */}
      <div className="flex-1 flex flex-col">
        <ProfileHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
