"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

function CallbackContent() {
  const router = useRouter();
  const { storeToken } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    if (!token) {
      toast({ description: "Missing token from callback", variant: "destructive" });
      router.push("/profile/login");
      return;
    }

    const next = searchParams.get("next") || "/profile";
    storeToken(token);
    window.location.href = next;
  }, [router, storeToken, token, toast, searchParams]);

  return null;
}

export function SsoCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
