"use client";

import { CreditCard } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InfoNote } from "@/components/b2b/InfoNote";
import { PinnedFooter } from "@/components/b2b/PinnedFooter";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

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
/**
 * One payment method (V2): icon tile, name, state line, and a switch that reports rather
 * than offers. All three are locked today — cash is mandatory, the other two unbuilt —
 * so the switch is `disabled` and the row that is off is dimmed.
 */
function PaymentMethodRow({
  title,
  subtitle,
  checked,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5", !checked && "opacity-60")}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <CreditCard size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      {/* V2 draws the enabled method's switch in brand green. The primitive's default
          `bg-primary` is near-black here, and `disabled:opacity-50` then greys it out
          entirely — so a method that *is* active read as inert. Locked is not the same
          as off, and the colour has to say which. */}
      <Switch
        checked={checked}
        disabled
        aria-label={title}
        className={cn(
          "disabled:cursor-default",
          checked
            ? "data-[state=checked]:bg-b2b-green-text disabled:opacity-100"
            : "disabled:opacity-70",
        )}
      />
    </div>
  );
}

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
      router.push("/account/partner/menu");
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
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Metody płatności
        </h2>
        {/* V2 draws these as rows with a switch, not as segmented toggles. A segmented
            control asks the user to pick between two states; every one of these is
            locked, so the switch — which shows a state rather than offering a choice —
            is the honest control. */}
        <div className="divide-y overflow-hidden rounded-b2b border bg-white">
          <PaymentMethodRow
            title="Gotówka na miejscu"
            subtitle="Płatność w studiu przed zajęciami"
            checked={acceptsCash}
          />
          <PaymentMethodRow
            title="Online · karta lub BLIK"
            subtitle="Wkrótce"
            checked={acceptsStripe}
          />
          <PaymentMethodRow
            title="Przelew bankowy"
            subtitle="Wkrótce"
            checked={acceptsBankTransfer}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Bezpłatne odwołanie
        </h2>
        <div className="space-y-4">
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

          <InfoNote>
            Ta konfiguracja wyznacza termin bezpłatnego odwołania i zasadę wejść z karnetu przy
            nieobecności. Przy &bdquo;Zawsze bezpłatne&rdquo; wejście nigdy nie przepada.
          </InfoNote>
        </div>
      </section>

      <PinnedFooter>
        <Button variant="outline" size="action" onClick={() => router.back()}>
          Anuluj
        </Button>
        <Button variant="green" size="action" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </PinnedFooter>
    </div>
  );
}
