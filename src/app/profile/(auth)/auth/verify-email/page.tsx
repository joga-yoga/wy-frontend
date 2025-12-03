"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { storeToken } = useAuth();
  const { toast } = useToast();

  // Use a ref to ensure we only try verification once in Strict Mode
  const hasVerified = useRef(false);
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const response = await axiosInstance.post("/verify-email", { token });
        const { access_token } = response.data;

        if (access_token) {
          storeToken(access_token);
          setStatus("success");
          toast({
            description: "Email zweryfikowany pomyślnie! Logowanie...",
            duration: 3000,
          });

          // Redirect after a short delay
          setTimeout(() => {
            router.push(`${process.env.NEXT_PUBLIC_PROFILE_HOST}`);
          }, 1500);
        } else {
          throw new Error("No access token received");
        }
      } catch (error: any) {
        console.error("Verification failed:", error);
        setStatus("error");
        toast({
          description:
            error.response?.data?.detail ||
            "Weryfikacja nie powiodła się. Link może być nieprawidłowy lub wygasł.",
          variant: "destructive",
        });
      }
    };

    verify();
  }, [token, router, storeToken, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {status === "verifying" && (
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <h1 className="text-2xl font-semibold">Weryfikacja adresu email...</h1>
          <p className="text-gray-500">Proszę czekać, trwa potwierdzanie Twojego konta.</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>
          <h1 className="text-2xl font-semibold">Email zweryfikowany!</h1>
          <p className="text-gray-500">
            Zostałeś pomyślnie zalogowany. Za chwilę nastąpi przekierowanie.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✕
          </div>
          <h1 className="text-2xl font-semibold">Błąd weryfikacji</h1>
          <p className="text-gray-500">Link weryfikacyjny jest nieprawidłowy lub wygasł.</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors mt-4"
          >
            Wróć do logowania
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="text-gray-500 mt-4">Ładowanie...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
