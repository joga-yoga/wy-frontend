"use client";

import { jwtDecode } from "jwt-decode";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

export function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");

  // Assume the token is passed as a query parameter e.g., /reset-password?token=xyz
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      try {
        const decoded: { email?: string } = jwtDecode(token);
        console.log("🚀 ~ useEffect ~ decoded:", decoded);
        if (decoded.email) {
          setEmail(decoded.email);
        }
      } catch (err) {
        console.error("Failed to decode token", err);
      }
    }
  }, [token]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast({
        description: "Reset token is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axiosInstance.post("/reset-password", {
        token: token,
        new_password: newPassword,
      });
      toast({
        description: "Password reset successful.",
      });
      router.push("/login");
    } catch (error) {
      toast({
        description: "Password reset failed. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-[100svh]">
      <form onSubmit={handleResetPassword} className="space-y-4 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        {email && (
          <p className="text-sm text-muted-foreground text-center">
            Resetting password for <span className="font-medium">{email}</span>
          </p>
        )}
        <Input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          Reset Password
        </Button>
      </form>
    </div>
  );
}
