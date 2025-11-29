"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

function AuthCallback() {
  const router = useRouter();
  const { storeToken } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      storeToken(token);
      router.push(`${process.env.NEXT_PUBLIC_PROFILE_HOST}`);
    } else {
      toast({
        description: "Missing token from callback",
        variant: "destructive",
      });
      router.push(`${process.env.NEXT_PUBLIC_PROFILE_HOST}/login`);
    }
  }, [token]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    // Wrap the component that uses useSearchParams in Suspense
    <Suspense>
      <AuthCallback />
    </Suspense>
  );
}
