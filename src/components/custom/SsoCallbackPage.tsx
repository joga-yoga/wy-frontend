"use client";

import { jwtDecode } from "jwt-decode";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

function CallbackContent() {
  const router = useRouter();
  const { storeToken } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (hasExchanged.current) {
      return;
    }

    const handleCallback = async () => {
      if (!token) {
        toast({
          description: "Missing token from callback",
          variant: "destructive",
        });
        router.push(`${process.env.NEXT_PUBLIC_PROFILE_HOST}/login`);
        return;
      }

      try {
        hasExchanged.current = true;

        let tokenType: string | undefined;
        try {
          const decoded = jwtDecode<{ type?: string }>(token);
          tokenType = decoded.type;
        } catch {
          tokenType = undefined;
        }

        if (tokenType === "sso_exchange") {
          const response = await axiosInstance.post("/auth/sso/exchange", { token });
          const accessToken = response.data?.access_token;
          const redirectTo = response.data?.redirect_to || process.env.NEXT_PUBLIC_PROFILE_HOST;

          if (accessToken) {
            storeToken(accessToken);
          }

          window.location.href = redirectTo;
          return;
        }

        // Hub callback receives regular access token; no exchange needed.
        storeToken(token);
        window.location.href = `${process.env.NEXT_PUBLIC_PROFILE_HOST}`;
      } catch (error) {
        hasExchanged.current = false;
        toast({
          description: "Login callback failed. Please try again.",
          variant: "destructive",
        });
        router.push(`${process.env.NEXT_PUBLIC_PROFILE_HOST}/login`);
      }
    };

    handleCallback();
  }, [router, storeToken, token, toast]);

  return null;
}

export function SsoCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
