"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import LogoFacebook from "@/components/icons/logos/LogoFacebook";
import LogoGoogle from "@/components/icons/logos/LogoGoogle";
import LogoTransparentSmall from "@/components/icons/LogoTransparentSmall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const emailSchema = z.object({
  email: z.string().email({ message: "Proszę podać poprawny adres email." }),
});

const passwordSchema = z.object({
  password: z.string().min(2, { message: "Hasło musi mieć co najmniej 2 znaki." }),
});

export function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { storeToken } = useAuth();

  // Extend step type to include "forgot", "verify-signup", "verify-forgot"
  const [step, setStep] = useState<
    "email" | "login" | "signup" | "forgot" | "verify-signup" | "verify-forgot"
  >("email");
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
        description: "Błąd podczas sprawdzania emaila. Proszę spróbować ponownie.",
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
      router.push(`${process.env.NEXT_PUBLIC_PROFILE_HOST}`);
    } catch (error: any) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data?.detail?.includes("Email not verified")
      ) {
        setStep("verify-signup");
        return;
      }
      toast({
        description: "Logowanie nieudane. Sprawdź dane i spróbuj ponownie.",
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
      // toast({ description: "Registration successful. Check your email for verification." });
      console.log("Registration successful:", response.data);
      setStep("verify-signup");
    } catch (error) {
      toast({
        description: "Rejestracja nieudana. Proszę spróbować ponownie.",
        variant: "destructive",
      });
    }
  }

  async function onSubmitForgot(data: { email: string }) {
    try {
      await axiosInstance.post("/forgot-password", { email: data.email });
      // toast({
      //   description: "If this email is registered and verified, a reset link has been sent.",
      // });
      setStep("verify-forgot");
    } catch (error) {
      toast({
        description: "Failed to send reset link. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-[100svh] px-4">
      <div className="py-10">
        <Link href="/">
          <div className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-full shadow-[1px_1px_16px_10px_rgba(255,252,238,0.5)] text-xl md:text-h-middle bg-gray-600">
            <LogoTransparentSmall className={`w-10 h-10 md:w-16 md:h-16 text-white`} />
          </div>
        </Link>
      </div>
      {step === "email" && (
        <form onSubmit={handleEmailSubmit(onSubmitEmail)} className="space-y-4 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center pb-2">Zaloguj się lub zarejestruj</h1>
          <Input
            placeholder="Wprowadź e-mail"
            {...registerEmail("email")}
            className="h-10"
            type="email"
          />
          <Button type="submit" className="w-full h-10 hover:bg-gray-800">
            Dalej
          </Button>
          <Link
            href={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/auth/google/login`}
            className="block"
          >
            <Button className="w-full relative h-10" variant="outline" type="button">
              <LogoGoogle className="h-6 w-6 size-6 absolute left-4" />
              <span>Kontynuuj z Google</span>
            </Button>
          </Link>
          <Link
            href={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/auth/facebook/login`}
            className="block"
          >
            <Button className="w-full relative h-10" variant="outline" type="button">
              <LogoFacebook className="h-6 w-6 size-6 absolute left-4" />
              <span>Kontynuuj z Facebook</span>
            </Button>
          </Link>
        </form>
      )}

      {step === "login" && (
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
            {/* Wstecz */}
          </Button>
          <h1 className="text-2xl font-bold text-center">Witamy ponownie</h1>
          <Input
            placeholder="Twój e-mail"
            defaultValue={emailValue}
            readOnly
            autoComplete="username"
          />
          <Input type="password" placeholder="Twoje hasło" {...registerPassword("password")} />
          <Button type="submit" className="w-full">
            Zaloguj się
          </Button>
          <div className="flex flex-col items-center mt-4">
            <p className="text-center text-sm mt-2">
              <span
                className="text-gray-700 hover:underline cursor-pointer"
                onClick={() => setStep("forgot")}
              >
                Zapomniałeś hasła?
              </span>
            </p>
          </div>
        </form>
      )}

      {step === "signup" && (
        <form
          onSubmit={handlePasswordSubmit(onSubmitPasswordSignup)}
          className="space-y-4 max-w-md w-full"
        >
          <h1 className="text-2xl font-bold text-center">Zarejestruj się</h1>
          <Input
            placeholder="Twój e-mail"
            defaultValue={emailValue}
            {...registerEmail("email")}
            autoComplete="username"
          />
          <Input type="password" placeholder="Stwórz hasło" {...registerPassword("password")} />
          <Button type="submit" className="w-full">
            Zarejestruj się
          </Button>
          <p
            className="text-center text-sm mt-4 text-gray-700 hover:underline cursor-pointer"
            onClick={() => setStep("email")}
          >
            Użyj innego konta
          </p>
        </form>
      )}

      {step === "forgot" && (
        <form onSubmit={handleForgotSubmit(onSubmitForgot)} className="space-y-4 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center">Zresetuj hasło</h1>
          <Input
            placeholder="Twój e-mail"
            defaultValue={emailValue}
            {...registerForgot("email")}
            autoComplete="username"
          />
          <Button type="submit" className="w-full">
            Wyślij link resetowania
          </Button>
          <p className="text-center text-sm mt-4">
            <span
              className="text-gray-700 hover:underline cursor-pointer"
              onClick={() => setStep("login")}
            >
              Powrót do logowania
            </span>
          </p>
        </form>
      )}

      {step === "verify-signup" && (
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <Mail className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Sprawdź swoją skrzynkę</h1>
            <p className="text-gray-600">
              Wysłaliśmy link weryfikacyjny na adres{" "}
              <span className="font-semibold">{emailValue}</span>. Kliknij w niego, aby aktywować
              konto.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setStep("login")}>
            Powrót do logowania
          </Button>
        </div>
      )}

      {step === "verify-forgot" && (
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-4 rounded-full">
              <Mail className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Link wysłany</h1>
            <p className="text-gray-600">
              Jeśli adres <span className="font-semibold">{emailValue}</span> znajduje się w naszej
              bazie, wysłaliśmy na niego instrukcję resetowania hasła.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setStep("login")}>
            Powrót do logowania
          </Button>
        </div>
      )}
      <div className="w-full h-[120px] md:h-[144px]" />
    </div>
  );
}
