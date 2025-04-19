"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { storeToken } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      storeToken(token);
      toast({ description: "Login successful." });
      router.push("/dashboard"); // Redirect home or wherever you want
    } else {
      toast({ description: "Missing token from callback", variant: "destructive" });
      router.push("/login");
    }
  }, [token]);

  return null; // Or show a loading spinner
}
