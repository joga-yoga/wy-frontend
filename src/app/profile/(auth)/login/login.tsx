"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { IoArrowBack, IoEye, IoEyeOff, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { z } from "zod";

import LogoFacebook from "@/components/icons/logos/LogoFacebook";
import LogoGoogle from "@/components/icons/logos/LogoGoogle";
import LogoTransparentSmall from "@/components/icons/LogoTransparentSmall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getLoginLogoHref, saveReturnContext } from "@/lib/auth/returnContext";
import { axiosInstance } from "@/lib/axiosInstance";

const emailSchema = z.object({
  email: z.string().email({ message: "Proszę podać poprawny adres email." }),
});

const passwordSchema = z.object({
  password: z.string().min(2, { message: "Hasło musi mieć co najmniej 2 znaki." }),
});

export function LoginPage() {
  const { toast } = useToast();
  const { storeToken, user, loading } = useAuth();
  const searchParams = useSearchParams();

  // Extend step type to include "forgot", "verify-signup", "verify-forgot"
  const [step, setStep] = useState<
    "email" | "login" | "signup" | "forgot" | "verify-signup" | "verify-forgot"
  >("email");
  const [emailValue, setEmailValue] = useState("");
  const [debugRedirectTo, setDebugRedirectTo] = useState<string | null>(null);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);
  const [logoHref, setLogoHref] = useState("/");
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isSignupPasswordVisible, setIsSignupPasswordVisible] = useState(false);
  const hasAutoRedirected = useRef(false);
  const returnTo = searchParams.get("return_to");
  const stayOnSpoke = searchParams.get("stay_on_spoke");
  const spokeNext = searchParams.get("spoke_next");

  const ssoParams = new URLSearchParams();
  if (returnTo) ssoParams.set("return_to", returnTo);
  if (stayOnSpoke) ssoParams.set("stay_on_spoke", stayOnSpoke);
  if (spokeNext) ssoParams.set("spoke_next", spokeNext);
  const ssoQuery = ssoParams.toString();
  const loginEndpoint = ssoQuery ? `/login?${ssoQuery}` : "/login";
  const googleAuthHref = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/auth/google/login${
    ssoQuery ? `?${ssoQuery}` : ""
  }`;
  const facebookAuthHref = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/auth/facebook/login${
    ssoQuery ? `?${ssoQuery}` : ""
  }`;

  useEffect(() => {
    saveReturnContext(returnTo, spokeNext);
    setLogoHref(getLoginLogoHref());
  }, [returnTo, spokeNext]);

  useEffect(() => {
    if (loading || !user || hasAutoRedirected.current) {
      return;
    }

    hasAutoRedirected.current = true;

    const autoRedirect = async () => {
      setIsAutoRedirecting(true);
      try {
        if (returnTo) {
          const response = await axiosInstance.post("/auth/sso/create-exchange-token", {
            return_to: returnTo,
            stay_on_spoke: stayOnSpoke === "1",
            spoke_next: spokeNext || "/",
          });
          const redirectTo = response.data?.redirect_to;
          if (redirectTo) {
            window.location.href = redirectTo;
            return;
          }
        }
        window.location.href = `${process.env.NEXT_PUBLIC_PROFILE_HOST}`;
      } catch (error) {
        toast({
          description: "Nie udało się wykonać automatycznego przekierowania. Spróbuj ponownie.",
          variant: "destructive",
        });
        setIsAutoRedirecting(false);
        hasAutoRedirected.current = false;
      }
    };

    autoRedirect();
  }, [loading, returnTo, spokeNext, stayOnSpoke, toast, user]);

  // Form for email only (used in email step)
  const { register: registerEmail, handleSubmit: handleEmailSubmit } = useForm({
    resolver: zodResolver(emailSchema),
  });

  // Form for password (used in login and signup steps)
  const { register: registerPassword, handleSubmit: handlePasswordSubmit } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  // New form for forgot password (using emailSchema)
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    reset: resetForgotForm,
  } = useForm({
    resolver: zodResolver(emailSchema),
  });

  useEffect(() => {
    if (step === "forgot") {
      resetForgotForm({ email: "" });
    }
  }, [resetForgotForm, step]);

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
    console.log("🚀 ~ onSubmitPasswordLogin ~ data:", data);

    try {
      const formData = new URLSearchParams();
      formData.append("username", emailValue);
      formData.append("password", data.password);

      const response = await axiosInstance.post(loginEndpoint, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const accessToken = response.data?.access_token;
      console.log("🚀 ~ onSubmitPasswordLogin ~ accessToken:", accessToken);
      const redirectTo = response.data?.redirect_to || process.env.NEXT_PUBLIC_PROFILE_HOST;
      console.log("🚀 ~ onSubmitPasswordLogin ~ redirectTo:", redirectTo);

      if (accessToken) {
        storeToken(accessToken);
      }

      // window.location.href = redirectTo;
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
      setEmailValue(data.email);
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
    <div className="flex flex-col items-center justify-start min-h-[100svh] px-4">
      {isAutoRedirecting && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center">
          <div className="text-sm md:text-base">Przekierowanie...</div>
        </div>
      )}
      <div className="py-10 pb-[100px]">
        <Link href={logoHref}>
          <div className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-full shadow-[1px_1px_16px_10px_rgba(255,252,238,0.5)] text-xl md:text-h-middle bg-gray-600">
            <LogoTransparentSmall className={`w-10 h-10 md:w-16 md:h-16 text-white`} />
          </div>
        </Link>
      </div>
      {step === "email" && (
        <form onSubmit={handleEmailSubmit(onSubmitEmail)} className="space-y-4 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center pb-2">Zaloguj się lub zarejestruj</h1>
          <div className="space-y-2">
            <Label htmlFor="auth-email">Adres e-mail</Label>
            <Input
              id="auth-email"
              placeholder="Adres e-mail"
              {...registerEmail("email")}
              className="h-10"
              type="email"
            />
          </div>
          <Button type="submit" className="w-full h-10 hover:bg-gray-800">
            Dalej
          </Button>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Separator className="flex-1" />
            <span>lub</span>
            <Separator className="flex-1" />
          </div>
          <Link href={googleAuthHref} className="block">
            <Button className="w-full relative h-10" variant="outline" type="button">
              <LogoGoogle className="h-6 w-6 size-6 absolute left-4" />
              <span>Kontynuuj, używając Google</span>
            </Button>
          </Link>
          <Link href={facebookAuthHref} className="block">
            <Button className="w-full relative h-10" variant="outline" type="button">
              <LogoFacebook className="h-6 w-6 size-6 absolute left-4" />
              <span>Kontynuuj, używając Facebooka</span>
            </Button>
          </Link>
        </form>
      )}

      {step === "login" && (
        <form
          onSubmit={handlePasswordSubmit(onSubmitPasswordLogin)}
          className="space-y-4 max-w-md w-full"
        >
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => setStep("email")}
              className="flex items-center gap-2"
            >
              <IoArrowBack className="w-4 h-4" />
              {/* Wstecz */}
            </Button>
            <h1 className="text-2xl font-bold text-center">Witamy ponownie</h1>
            <div aria-hidden="true" className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Hasło</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={isLoginPasswordVisible ? "text" : "password"}
                placeholder="Twoje hasło"
                className="pr-20"
                {...registerPassword("password")}
              />
              <button
                type="button"
                onClick={() => setIsLoginPasswordVisible((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-700 hover:text-foreground"
                aria-label={isLoginPasswordVisible ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {isLoginPasswordVisible ? (
                  <>
                    <IoEyeOffOutline className="mr-1 h-4 w-4" />
                    Ukryj
                  </>
                ) : (
                  <>
                    <IoEyeOutline className="mr-1 h-4 w-4" />
                    Pokaż
                  </>
                )}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full">
            Zaloguj się
          </Button>
          <div className="flex flex-col items-start">
            <p className="text-center text-md font-medium underline mt-2">
              <span
                className="text-gray-800 hover:underline cursor-pointer"
                onClick={() => setStep("forgot")}
              >
                Nie pamiętasz hasła?
              </span>
            </p>
            <p className="text-center text-md font-medium underline mt-4">
              <span
                className="text-gray-800 hover:underline cursor-pointer"
                onClick={() => setStep("email")}
              >
                Inne możliwości logowania
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
          <div className="space-y-2">
            <Label htmlFor="signup-email">Adres e-mail</Label>
            <Input
              id="signup-email"
              placeholder="Twój e-mail"
              defaultValue={emailValue}
              {...registerEmail("email")}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Hasło</Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={isSignupPasswordVisible ? "text" : "password"}
                placeholder="Stwórz hasło"
                className="pr-20"
                {...registerPassword("password")}
              />
              <button
                type="button"
                onClick={() => setIsSignupPasswordVisible((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground hover:text-foreground"
                aria-label={isSignupPasswordVisible ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {isSignupPasswordVisible ? (
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
          </div>
          <Button type="submit" className="w-full">
            Zarejestruj się
          </Button>
          <div className="flex flex-col items-start">
            <p className="text-center text-md font-medium underline mt-2">
              <span
                className="text-gray-800 hover:underline cursor-pointer"
                onClick={() => setStep("email")}
              >
                Użyj innego konta
              </span>
            </p>
          </div>
        </form>
      )}

      {step === "forgot" && (
        <form onSubmit={handleForgotSubmit(onSubmitForgot)} className="space-y-4 max-w-md w-full">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => setStep("login")}
              className="flex items-center gap-2"
            >
              <IoArrowBack className="w-4 h-4" />
              {/* Wstecz */}
            </Button>
            <h1 className="text-2xl font-bold text-center">Zresetuj hasło</h1>
            <div aria-hidden="true" className="h-10 w-10" />
          </div>
          <p className="text-md">
            Podaj adres e-mail powiązany z Twoim kontem, a prześlemy tam link do zmiany hasła.
          </p>
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Adres e-mail</Label>
            <Input
              id="forgot-email"
              placeholder="Twój e-mail"
              {...registerForgot("email")}
              autoComplete="username"
            />
          </div>
          <Button type="submit" className="w-full">
            Wyślij link resetujący
          </Button>
          <div className="flex flex-col items-start">
            <p className="text-center text-md font-medium underline mt-2">
              <span
                className="text-gray-800 hover:underline cursor-pointer"
                onClick={() => setStep("email")}
              >
                Powrót do logowania
              </span>
            </p>
          </div>
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
          <Button variant="outline" className="w-full" onClick={() => setStep("email")}>
            Powrót do logowania
          </Button>
        </div>
      )}
    </div>
  );
}
