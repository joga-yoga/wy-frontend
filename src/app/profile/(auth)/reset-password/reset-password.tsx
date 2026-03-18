"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import LogoTransparentSmall from "@/components/icons/LogoTransparentSmall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getLoginLogoHref, saveReturnContext } from "@/lib/auth/returnContext";
import { axiosInstance } from "@/lib/axiosInstance";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { storeToken } = useAuth();
  const [email, setEmail] = useState("");
  const [logoHref, setLogoHref] = useState("/");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const token = searchParams.get("token");
  const returnTo = searchParams.get("return_to");
  const spokeNext = searchParams.get("spoke_next");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    saveReturnContext(returnTo, spokeNext);
    setLogoHref(getLoginLogoHref());
  }, [returnTo, spokeNext]);

  useEffect(() => {
    if (token) {
      try {
        const decoded: { email?: string } = jwtDecode(token);
        if (decoded.email) {
          setEmail(decoded.email);
        }
      } catch (err) {
        toast({
          title: "Nieprawidłowy token",
          description: "Token resetowania hasła jest nieprawidłowy lub wygasł.",
          variant: "destructive",
        });
        router.push("/profile/login");
      }
    } else {
      toast({
        title: "Brak tokena",
        description: "Brak tokena resetowania hasła w adresie URL.",
        variant: "destructive",
      });
      router.push("/profile/login");
    }
  }, [token, router, toast]);

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) return;

    try {
      const response = await axiosInstance.post("/reset-password", {
        token: token,
        new_password: data.newPassword,
      });

      const accessToken = response.data?.access_token;
      if (accessToken) {
        storeToken(accessToken);
      }

      if (response.status >= 200 && response.status < 300) {
        toast({
          description: "Hasło zostało zmienione pomyślnie. Logowanie...",
        });
        router.push(`${process.env.NEXT_PUBLIC_PROFILE_HOST}`);
      }
    } catch (error: any) {
      toast({
        description:
          error?.response?.data?.detail || "Zmiana hasła nie powiodła się. Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[100svh] px-4">
      <div className="py-10 pb-[100px]">
        <Link href={logoHref}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-600 text-xl shadow-[1px_1px_16px_10px_rgba(255,252,238,0.5)] md:h-16 md:w-16 md:text-h-middle">
            <LogoTransparentSmall className="h-10 w-10 text-white md:h-16 md:w-16" />
          </div>
        </Link>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center">Zaktualizuj hasło</h1>
        {email && (
          <p className="text-sm text-muted-foreground">
            Resetowanie hasła dla konta <span className="font-medium text-foreground">{email}</span>
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="reset-password">Nowe hasło</Label>
          <div className="relative">
            <Input
              id="reset-password"
              type={isPasswordVisible ? "text" : "password"}
              placeholder="Nowe hasło"
              {...register("newPassword")}
              required
              className="h-10 pr-20"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((value) => !value)}
              className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground hover:text-foreground"
              aria-label={isPasswordVisible ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {isPasswordVisible ? (
                <>
                  <EyeOff className="mr-1 h-4 w-4" />
                  Ukryj
                </>
              ) : (
                <>
                  <Eye className="mr-1 h-4 w-4" />
                  Pokaż
                </>
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full h-10 hover:bg-gray-800" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Zaktualizuj"}
        </Button>
      </form>
    </div>
  );
}

export function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin" size={48} />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
