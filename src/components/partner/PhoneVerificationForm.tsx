"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

type Step = "phone" | "code";

function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { normalized: null, error: "Numer telefonu jest wymagany." };
  }

  let sanitized = trimmed.replace(/[\s\-()]/g, "");
  if (sanitized.startsWith("00")) {
    sanitized = `+${sanitized.slice(2)}`;
  }

  if (sanitized.startsWith("+")) {
    if (!/^\+\d{8,15}$/.test(sanitized)) {
      return { normalized: null, error: "Podaj prawidłowy numer telefonu, np. +48 501 234 567." };
    }
    return { normalized: sanitized, error: null };
  }

  const digitsOnly = sanitized.replace(/\D/g, "");

  if (/^\d{9}$/.test(digitsOnly)) {
    return { normalized: `+48${digitsOnly}`, error: null };
  }

  if (/^48\d{9}$/.test(digitsOnly)) {
    return { normalized: `+${digitsOnly}`, error: null };
  }

  return {
    normalized: null,
    error: "Podaj prawidłowy numer telefonu, np. 501 234 567 lub +48 501 234 567.",
  };
}

/**
 * The deferred phone+SMS gate (spec-b2b §2 decision 3): partner creation is instant
 * and asks for nothing, so this step only appears later, right before an action that
 * needs a contactable owner (currently: creating a studio — see `create_studio` in
 * `wy-backend/src/app/api/studio.py`). Drop this inline or inside a Dialog.
 */
export function PhoneVerificationForm({ onVerified }: { onVerified: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleSendCode() {
    const result = normalizePhoneNumber(phoneNumber);
    if (!result.normalized) {
      setPhoneError(result.error);
      return;
    }

    setPhoneError(null);
    setIsSendingCode(true);
    try {
      await axiosInstance.post("/partner/send-verification-code", {
        phone_number: result.normalized,
      });
      setVerifiedPhoneNumber(result.normalized);
      setStep("code");
      toast({ description: "Kod weryfikacyjny został wysłany na Twój telefon." });
    } catch (err: any) {
      setPhoneError(
        err.response?.data?.detail ||
          "Nie udało się wysłać kodu. Sprawdź numer i spróbuj ponownie.",
      );
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    if (!verifiedPhoneNumber) return;
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setCodeError("Kod weryfikacyjny musi mieć 6 cyfr.");
      return;
    }

    setCodeError(null);
    setIsVerifying(true);
    try {
      await axiosInstance.put("/partner", {
        phone_number: verifiedPhoneNumber,
        verification_code: trimmed,
      });
      toast({ description: "Numer telefonu zweryfikowany." });
      onVerified();
    } catch (err: any) {
      setCodeError(err.response?.data?.detail || "Nieprawidłowy lub wygasły kod.");
    } finally {
      setIsVerifying(false);
    }
  }

  if (step === "phone") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone-verification-number">Numer telefonu *</Label>
          <Input
            id="phone-verification-number"
            type="tel"
            placeholder="501 234 567 lub +48 501 234 567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            aria-invalid={phoneError ? "true" : "false"}
          />
          {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
        </div>
        <Button onClick={handleSendCode} disabled={isSendingCode} className="w-full">
          {isSendingCode ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wysyłanie kodu...
            </>
          ) : (
            "Wyślij kod SMS"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Kod wysłaliśmy na numer</p>
        <p className="font-medium">{verifiedPhoneNumber}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone-verification-code">Kod weryfikacyjny *</Label>
        <Input
          id="phone-verification-code"
          placeholder="Wpisz 6-cyfrowy kod"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-invalid={codeError ? "true" : "false"}
        />
        {codeError && <p className="text-sm text-destructive">{codeError}</p>}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => setStep("phone")}
          disabled={isVerifying}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zmień numer telefonu
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={handleSendCode}
          disabled={isVerifying || isSendingCode}
        >
          {isSendingCode ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wysyłanie...
            </>
          ) : (
            "Wyślij kod ponownie"
          )}
        </Button>
      </div>
      <Button onClick={handleVerifyCode} disabled={isVerifying} className="w-full">
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Weryfikowanie...
          </>
        ) : (
          "Potwierdź kod"
        )}
      </Button>
    </div>
  );
}
