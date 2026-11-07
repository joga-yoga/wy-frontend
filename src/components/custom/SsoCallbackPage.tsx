"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { resolveAuthDestination } from "@/lib/auth/destination";
import { hasCurrentInvitation } from "@/lib/auth/invitations";
import { getRecordedMode } from "@/lib/partnerMode";

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
      router.push("/account/login");
      return;
    }

    void (async () => {
      const user = await storeToken(token);
      window.location.href = await resolveAuthDestination(
        { next: searchParams.get("next"), user, mode: getRecordedMode() },
        hasCurrentInvitation,
      );
    })();
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
