"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

import type { StudioApiResponse } from "../edit/types";

/**
 * Płatności i odwołania (spec-b2b §8) — a workspace screen, not part of the public
 * profile editor. Re-sites the payment-method toggles and cancellation-policy
 * controls that `booking-attendance` already shipped fields/API for
 * (`accepts_cash`/`accepts_stripe`/`accepts_bank_transfer`,
 * `cancellation_policy_mode` + its two deadline fields) — no new plumbing, and
 * deliberately no separate pass-burn setting: this one config drives both the
 * free-cancel deadline and the pass-burn rule.
 */
export default function StudioPaymentsPage() {
  const params = useParams<{ studioId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cancellationMode, setCancellationMode] = useState<"by_time_of_day" | "always_free">(
    "by_time_of_day",
  );
  const [morningDeadline, setMorningDeadline] = useState("");
  const [afternoonHoursBefore, setAfternoonHoursBefore] = useState("");
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [acceptsStripe, setAcceptsStripe] = useState(false);
  const [acceptsBankTransfer, setAcceptsBankTransfer] = useState(false);

  useEffect(() => {
    axiosInstance
      .get<StudioApiResponse>(`/studios/${params.studioId}`)
      .then(({ data }) => {
        setCancellationMode(
          (data.cancellation_policy_mode as "by_time_of_day" | "always_free") ?? "by_time_of_day",
        );
        setMorningDeadline(data.cancellation_morning_deadline_time ?? "");
        setAfternoonHoursBefore(
          data.cancellation_afternoon_hours_before != null
            ? String(data.cancellation_afternoon_hours_before)
            : "",
        );
        setAcceptsCash(data.accepts_cash ?? true);
        setAcceptsStripe(data.accepts_stripe ?? false);
        setAcceptsBankTransfer(data.accepts_bank_transfer ?? false);
      })
      .catch(() =>
        toast({ description: "Nie udało się załadować ustawień.", variant: "destructive" }),
      )
      .finally(() => setIsLoading(false));
  }, [params.studioId, toast]);

  async function handleSave() {
    if (
      cancellationMode === "by_time_of_day" &&
      (!morningDeadline || afternoonHoursBefore === "")
    ) {
      toast({
        description:
          "Uzupełnij obie godziny graniczne (poranną i popołudniową) albo wybierz „Zawsze bezpłatnie”.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await axiosInstance.put(`/studios/${params.studioId}`, {
        cancellation_policy_mode: cancellationMode,
        cancellation_morning_deadline_time:
          cancellationMode === "by_time_of_day" ? morningDeadline || null : null,
        cancellation_afternoon_hours_before:
          cancellationMode === "by_time_of_day" && afternoonHoursBefore !== ""
            ? Number(afternoonHoursBefore)
            : null,
      });
      toast({ description: "Zapisano ustawienia." });
      router.push("/konto/partner/menu");
    } catch {
      toast({ description: "Nie udało się zapisać ustawień.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-6 pb-24">
      <h1 className="text-xl font-semibold text-gray-900">Płatności i odwołania</h1>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Metody płatności
        </h2>
        <div className="space-y-4 rounded-xl border bg-white px-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Gotówka na miejscu</label>
            <SegmentedToggle
              disabled
              value={acceptsCash}
              onChange={() => {}}
              options={[
                { label: "Nieaktywna", value: false },
                { label: "Aktywna", value: true },
              ]}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Płatność gotówką jest wymagana i nie można jej wyłączyć.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Online · karta lub BLIK</label>
            <SegmentedToggle
              disabled
              value={acceptsStripe}
              onChange={() => {}}
              options={[
                { label: "Wkrótce", value: false },
                { label: "Aktywna", value: true },
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Przelew bankowy</label>
            <SegmentedToggle
              disabled
              value={acceptsBankTransfer}
              onChange={() => {}}
              options={[
                { label: "Wkrótce", value: false },
                { label: "Aktywna", value: true },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Bezpłatne odwołanie
        </h2>
        <div className="space-y-4 rounded-xl border bg-white px-4 py-4">
          <SegmentedToggle
            value={cancellationMode}
            onChange={setCancellationMode}
            options={[
              { label: "Wg pory zajęć", value: "by_time_of_day" },
              { label: "Zawsze bezpłatnie", value: "always_free" },
            ]}
          />

          {cancellationMode === "by_time_of_day" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Zajęcia poranne (start przed 12:00)
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Bezpłatne odwołanie możliwe do tej godziny dnia poprzedniego.
                </p>
                <Input
                  type="time"
                  value={morningDeadline}
                  onChange={(e) => setMorningDeadline(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Zajęcia popołudniowe (start od 12:00)
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Bezpłatne odwołanie możliwe do tylu godzin przed startem zajęć.
                </p>
                <Input
                  type="number"
                  min="0"
                  value={afternoonHoursBefore}
                  onChange={(e) => setAfternoonHoursBefore(e.target.value)}
                  placeholder="np. 3"
                />
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Ta konfiguracja wyznacza termin bezpłatnego odwołania i zasadę wejść z karnetu przy
            nieobecności — nie ma osobnego ustawienia.
          </p>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background px-4 py-3">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.back()}>
            Anuluj
          </Button>
          <Button variant="green" className="flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
