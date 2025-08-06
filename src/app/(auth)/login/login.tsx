"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const passwordSchema = z.object({
  password: z.string().min(2, { message: "Password must be at least 2 characters." }),
});

export function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { storeToken } = useAuth();

  // Extend step type to include "forgot"
  const [step, setStep] = useState<"email" | "login" | "signup" | "forgot">("email");
  const [emailValue, setEmailValue] = useState("");

  // Form for email only (used in email step)
  const { register: registerEmail, handleSubmit: handleEmailSubmit } = useForm({
    resolver: zodResolver(emailSchema),
  });

  // Form for password (used in login and signup steps)
  const { register: registerPassword, handleSubmit: handlePasswordSubmit } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  // New form for forgot password (using emailSchema)
  const { register: registerForgot, handleSubmit: handleForgotSubmit } = useForm({
    resolver: zodResolver(emailSchema),
  });

  async function onSubmitEmail(data: { email: string }) {
    setEmailValue(data.email);
    try {
      const response = await axiosInstance.post("/check-email", { email: data.email });
      const exists = response.data.exists;
      if (exists) {
        setStep("login");
      } else {
        setStep("signup");
      }
    } catch (error) {
      toast({
        description: "Error checking email. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function onSubmitPasswordLogin(data: { password: string }) {
    try {
      const formData = new URLSearchParams();
      formData.append("username", emailValue);
      formData.append("password", data.password);

      const response = await axiosInstance.post("/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const token = response.data.access_token;
      storeToken(token);
      toast({ description: "Login successful." });
      router.push("/dashboard");
    } catch (error) {
      toast({
        description: "Login failed. Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  }

  async function onSubmitPasswordSignup(data: { password: string }) {
    try {
      const response = await axiosInstance.post("/register", {
        email: emailValue,
        password: data.password,
      });
      toast({ description: "Registration successful. Check your email for verification." });
      console.log("Registration successful:", response.data);
      setStep("login");
    } catch (error) {
      toast({
        description: "Registration failed. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function onSubmitForgot(data: { email: string }) {
    try {
      await axiosInstance.post("/forgot-password", { email: data.email });
      toast({
        description: "If this email is registered and verified, a reset link has been sent.",
      });
      setStep("login");
    } catch (error) {
      toast({
        description: "Failed to send reset link. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100svh] px-4">
      {step === "email" && (
        <form onSubmit={handleEmailSubmit(onSubmitEmail)} className="space-y-4 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center">Enter your email</h1>
          <Input placeholder="Your email" {...registerEmail("email")} type="email" />
          <Button type="submit" className="w-full">
            Continue
          </Button>
          {/* TODO: Add prod-ready links */}
          <Link
            href={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/auth/google/login`}
            className="block mt-2"
          >
            <Button className="w-full" variant="outline" type="button">
              Continue with Google
            </Button>
          </Link>
          {/* TODO: Add prod-ready links */}
          <Link
            href={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/auth/facebook/login`}
            className="block mt-2"
          >
            <Button className="w-full" variant="outline" type="button">
              Continue with Facebook
            </Button>
          </Link>
        </form>
      )}

      {step === "login" && (
        <>
          <form
            onSubmit={handlePasswordSubmit(onSubmitPasswordLogin)}
            className="space-y-4 max-w-md w-full"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStep("email")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {/* Back */}
            </Button>
            <h1 className="text-2xl font-bold text-center">Welcome back</h1>
            <Input
              placeholder="Your email"
              defaultValue={emailValue}
              readOnly
              autoComplete="username"
            />
            <Input type="password" placeholder="Your password" {...registerPassword("password")} />
            <Button type="submit" className="w-full">
              Log in
            </Button>
            <div className="flex flex-col items-center mt-4">
              <p className="text-center text-sm mt-2">
                <span
                  className="text-blue-500 hover:underline cursor-pointer"
                  onClick={() => setStep("forgot")}
                >
                  Forgot password?
                </span>
              </p>
            </div>
          </form>
        </>
      )}

      {step === "signup" && (
        <form
          onSubmit={handlePasswordSubmit(onSubmitPasswordSignup)}
          className="space-y-4 max-w-md w-full"
        >
          <h1 className="text-2xl font-bold text-center">Sign up</h1>
          <Input
            placeholder="Your email"
            defaultValue={emailValue}
            {...registerEmail("email")}
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Create a password"
            {...registerPassword("password")}
          />
          <Button type="submit" className="w-full">
            Sign up
          </Button>
          <p className="text-center text-sm mt-4">
            Use another account{" "}
            <span
              className="text-blue-500 hover:underline cursor-pointer"
              onClick={() => setStep("email")}
            >
              here
            </span>
          </p>
        </form>
      )}

      {step === "forgot" && (
        <form onSubmit={handleForgotSubmit(onSubmitForgot)} className="space-y-4 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center">Reset password</h1>
          <Input
            placeholder="Your email"
            defaultValue={emailValue}
            {...registerForgot("email")}
            autoComplete="username"
          />
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
          <p className="text-center text-sm mt-4">
            <span
              className="text-blue-500 hover:underline cursor-pointer"
              onClick={() => setStep("login")}
            >
              Back to login
            </span>
          </p>
        </form>
      )}
    </div>
  );
}
