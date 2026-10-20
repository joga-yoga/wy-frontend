"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CancellationPolicyFields } from "@/components/partner/CancellationPolicyFields";
import { PhoneVerificationDialog } from "@/components/partner/PhoneVerificationDialog";
import { useBusinessModeConfirmation } from "@/components/partner/useBusinessModeConfirmation";
import { Button } from "@/components/ui/button";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

export default function SoloBookingSetupPage() {
  const router = useRouter();
  const { capabilities, isLoading, refetch } = usePartnerCapabilities();
  const { toast } = useToast();
  const { confirmMode, dialog } = useBusinessModeConfirmation(capabilities?.businessMode);
  const [cancellationMode, setCancellationMode] = useState<"always_free" | "by_time_of_day">(
    "always_free",
  );
  const [morningDeadline, setMorningDeadline] = useState("");
  const [afternoonHoursBefore, setAfternoonHoursBefore] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (
      !isLoading &&
      capabilities &&
      !capabilities.businessMode &&
      !capabilities.hasInstructorProfile
    )
      router.replace("/account/partner/instructors/create?returnTo=solo");
  }, [capabilities, isLoading, router]);

  async function save() {
    if (savingRef.current) return;
    if (
      cancellationMode === "by_time_of_day" &&
      (!morningDeadline || afternoonHoursBefore === "")
    ) {
      toast({
        description:
          "Uzupełnij obie granice bezpłatnego odwołania albo wybierz „Zawsze bezpłatnie”.",
        variant: "destructive",
      });
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    try {
      if (!(await confirmMode("solo"))) return;
      await axiosInstance.post("/partner/solo-booking", {
        cancellation_policy_mode: cancellationMode,
        cancellation_morning_deadline_time:
          cancellationMode === "by_time_of_day" ? morningDeadline : null,
        cancellation_afternoon_hours_before:
          cancellationMode === "by_time_of_day" ? Number(afternoonHoursBefore) : null,
      });
      refetch();
      router.replace("/account/partner/menu");
    } catch (error: unknown) {
      const detail = (
        error as { response?: { data?: { detail?: string | { error_code?: string } } } }
      ).response?.data?.detail;
      if (typeof detail === "object" && detail.error_code === "PHONE_VERIFICATION_REQUIRED")
        setVerifyPhone(true);
      else
        toast({
          description:
            typeof detail === "string"
              ? detail
              : "Nie udało się zapisać ustawień. Spróbuj ponownie.",
          variant: "destructive",
        });
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="p-4">Ładowanie…</p>;
  if (!capabilities) return <p className="p-4">Nie udało się załadować ustawień konta.</p>;
  if (capabilities.businessMode)
    return (
      <div className="p-4">
        <Link href="/account/partner/menu">Przejdź do zarządzania</Link>
      </div>
    );
  if (!capabilities.hasInstructorProfile)
    return <p className="p-4">Ładowanie profilu instruktora…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="text-xl font-semibold">Włącz zapisy na moje zajęcia</h1>
      <p className="text-sm text-muted-foreground">
        Cena i miejsce pojawią się w szablonie zajęć. Karnety możesz dodać opcjonalnie.
      </p>
      <div className="rounded-b2b border p-4">
        <p className="font-semibold">Płatność na miejscu</p>
        <p className="text-sm text-muted-foreground">
          Płatności online możesz skonfigurować w ustawieniach.
        </p>
      </div>
      <CancellationPolicyFields
        cancellationMode={cancellationMode}
        setCancellationMode={setCancellationMode}
        morningDeadline={morningDeadline}
        setMorningDeadline={setMorningDeadline}
        afternoonHoursBefore={afternoonHoursBefore}
        setAfternoonHoursBefore={setAfternoonHoursBefore}
      />
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Wróć
        </Button>
        <Button variant="green" disabled={isSaving} onClick={save}>
          {isSaving ? "Zapisywanie…" : "Zapisz ustawienia"}
        </Button>
      </div>
      {dialog}
      <PhoneVerificationDialog
        open={verifyPhone}
        onOpenChange={setVerifyPhone}
        onVerified={() => {}}
        description="Zanim włączysz zapisy, potwierdź numer telefonu kodem SMS."
      />
    </div>
  );
}
