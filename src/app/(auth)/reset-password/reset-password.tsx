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
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long."),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
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
          title: "Invalid Token",
          description: "The reset token is invalid or has expired.",
          variant: "destructive",
        });
        router.push("/login");
      }
    } else {
      toast({
        title: "Missing Token",
        description: "The reset token is missing from the URL.",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [token, router, toast]);

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) return;

    try {
      await axiosInstance.post("/reset-password", {
        token: token,
        new_password: data.newPassword,
      });
      toast({
        description: "Password reset successful.",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        description: error?.response?.data?.detail || "Password reset failed. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-[100svh]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        {email && (
          <p className="text-sm text-muted-foreground text-center">
            Resetting password for <span className="font-medium">{email}</span>
          </p>
        )}
        <div>
          <Input type="password" placeholder="New Password" {...register("newPassword")} required />
          {errors.newPassword && (
            <p className="text-sm text-destructive mt-1">{errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Reset Password"}
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
