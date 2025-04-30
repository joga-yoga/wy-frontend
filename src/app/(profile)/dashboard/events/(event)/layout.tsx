"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { EventSidebar } from "@/components/layout/EventSidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function EventLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex min-h-screen bg-background">
      <EventSidebar />
      <div className="flex-1 flex flex-col">
        {/* <ProfileHeader /> */}
        <main className="flex-1 p-6">
          {" "}
          {/* Added padding to main content */}
          {children}
        </main>
      </div>
    </div>
  );
}
