"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { jwtDecode } from "jwt-decode";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

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

      const { access_token } = response.data;

      if (access_token) {
        storeToken(access_token);
        toast({
          description: "Hasło zostało zmienione pomyślnie. Logowanie...",
        });
        router.push(`${process.env.NEXT_PUBLIC_PROFILE_HOST}`);
      } else {
        // Fallback if no token returned (should not happen with updated backend)
        toast({
          description: "Hasło zostało zmienione pomyślnie.",
        });
        router.push("/profile/login");
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
    <div className="flex flex-col items-center justify-center h-[100svh] px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md w-full">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Zresetuj hasło</h1>
          {email && (
            <p className="text-sm text-muted-foreground">
              Resetowanie hasła dla konta{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Nowe hasło"
            {...register("newPassword")}
            required
            className="h-10"
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Zmień hasło"}
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
