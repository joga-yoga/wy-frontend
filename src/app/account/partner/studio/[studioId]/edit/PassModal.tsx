"use client";

import { AlertTriangle, Lightbulb } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";

import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { Button } from "@/components/ui/button";
import { DrawerFooter } from "@/components/ui/drawer";
import {
  FormDrawer,
  FormDrawerBody,
  FormDrawerContent,
  FormDrawerHeader,
} from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { cn } from "@/lib/utils";

import type { StudioPass } from "./types";

interface PassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (pass: StudioPass) => void;
  studioId: string | null;
  dropInPrice: number | null;
  currency: string;
  editPass?: StudioPass | null;
}

/** Month presets map to fixed day counts — `StudioPass.duration_days` is an int of days
 *  and expiry flows through `timedelta(days=...)`, so there is no calendar-month arithmetic
 *  to hook into. `null` is the "Własna" escape hatch, which reveals the raw days input. */
const DURATION_PRESETS: { label: string; days: number | null }[] = [
  { label: "1 miesiąc", days: 30 },
  { label: "2 miesiące", days: 60 },
  { label: "3 miesiące", days: 90 },
  { label: "6 miesięcy", days: 180 },
  { label: "12 miesięcy", days: 365 },
  { label: "Własna", days: null },
];

const PRESET_DAY_COUNTS = DURATION_PRESETS.map((preset) => preset.days).filter(
  (days): days is number => days != null,
);

function blockInvalidNumberChars(event: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(event.key)) {
    event.preventDefault();
  }
}

function fieldClass(hasError?: boolean) {
  return cn(
    "h-12 rounded-md bg-white px-3 text-base shadow-none focus-visible:ring-brand-green",
    hasError && "border-destructive focus-visible:ring-destructive",
  );
}

export function PassModal({
  isOpen,
  onClose,
  onSaved,
  studioId,
  dropInPrice,
  currency,
  editPass,
}: PassModalProps) {
  const [name, setName] = useState("");
  const [durationUnlimited, setDurationUnlimited] = useState(true);
  const [durationDays, setDurationDays] = useState<string>("");
  /** True when "Własna" is chosen — either explicitly, or because an existing pass's
   *  duration_days doesn't match any preset. */
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [sessionUnlimited, setSessionUnlimited] = useState(true);
  const [sessionCount, setSessionCount] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editPass) {
      setName(editPass.name);
      setDurationUnlimited(editPass.duration_days == null || editPass.duration_days === "");
      setDurationDays(editPass.duration_days != null ? String(editPass.duration_days) : "");
      setIsCustomDuration(
        editPass.duration_days != null &&
          editPass.duration_days !== "" &&
          !PRESET_DAY_COUNTS.includes(Number(editPass.duration_days)),
      );
      setSessionUnlimited(editPass.session_count == null || editPass.session_count === "");
      setSessionCount(editPass.session_count != null ? String(editPass.session_count) : "");
      setPrice(editPass.price != null ? String(editPass.price) : "");
      setDescription(editPass.description ?? "");
    } else {
      setName("");
      setDurationUnlimited(false);
      setDurationDays("");
      setIsCustomDuration(false);
      setSessionUnlimited(false);
      setSessionCount("");
      setPrice("");
      setDescription("");
    }
    setError(null);
  }, [isOpen, editPass]);

  const sessionCountNum = sessionCount ? Number(sessionCount) : null;
  const priceNum = price ? Number(price) : null;
  const perEntry =
    sessionCountNum && sessionCountNum > 0 && priceNum != null
      ? (priceNum / sessionCountNum).toFixed(2)
      : null;

  const suggestedPrice =
    sessionCountNum && sessionCountNum > 0 && dropInPrice
      ? Math.round(sessionCountNum * dropInPrice * 0.9 * 100) / 100
      : null;

  const bothUnlimited = durationUnlimited && sessionUnlimited;

  async function handleSave() {
    if (!name.trim()) {
      setError("Nazwa karnetu jest wymagana.");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Cena jest wymagana.");
      return;
    }
    setError(null);
    setIsSaving(true);

    const passData = {
      name: name.trim(),
      price: Number(price),
      currency: currency || "PLN",
      description: description.trim() || undefined,
      duration_days: durationUnlimited ? null : Number(durationDays) || null,
      session_count: sessionUnlimited ? null : Number(sessionCount) || null,
    };

    try {
      if (studioId && editPass?.id) {
        const { data } = await axiosInstance.put(
          `/studios/${studioId}/passes/${editPass.id}`,
          passData,
        );
        onSaved(data);
      } else if (studioId) {
        const { data } = await axiosInstance.post(`/studios/${studioId}/passes`, passData);
        onSaved(data);
      } else {
        onSaved({ ...passData, price: passData.price } as StudioPass);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Nie udało się zapisać karnetu.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <FormDrawer open={isOpen} onClose={onClose}>
      <FormDrawerContent>
        <FormDrawerHeader title={editPass ? "Edytuj karnet" : "Nowy karnet"} />
        <FormDrawerBody className="space-y-4">
          {/* Nazwa */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Nazwa</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass(!name.trim() && !!error)}
              placeholder="np. Karnet miesięczny"
            />
          </div>

          {/* Liczba wejść — before Ważność: a partner decides "how many entries" first,
              and the duration then qualifies that. */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Liczba wejść</label>
            <SegmentedToggle
              value={sessionUnlimited}
              onChange={(next) => {
                setSessionUnlimited(next);
                if (next) setSessionCount("");
              }}
              options={[
                { label: "Liczba", value: false },
                { label: "∞ Bez limitu", value: true },
              ]}
            />
            {!sessionUnlimited && (
              <Input
                type="number"
                min="1"
                value={sessionCount}
                onChange={(e) => setSessionCount(e.target.value)}
                onKeyDown={blockInvalidNumberChars}
                placeholder="Liczba wejść"
                className={fieldClass()}
              />
            )}
          </div>

          {/* Ważność */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Ważność</label>
            <SegmentedToggle
              value={durationUnlimited}
              onChange={(next) => {
                setDurationUnlimited(next);
                if (next) {
                  setDurationDays("");
                  setIsCustomDuration(false);
                }
              }}
              options={[
                { label: "Liczba dni", value: false },
                { label: "∞ Bez limitu", value: true },
              ]}
            />
            {durationUnlimited && (
              <p className="text-sm text-muted-foreground mb-2">
                ∞ Karnet nie wygasa — ważny do wykorzystania wejść.
              </p>
            )}
            {/* An unlimited pass has no duration at all, so the presets live inside the
                non-unlimited branch rather than alongside the toggle. */}
            {!durationUnlimited && (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((preset) => {
                    const isSelected =
                      preset.days == null
                        ? isCustomDuration
                        : !isCustomDuration && durationDays === String(preset.days);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (preset.days == null) {
                            setIsCustomDuration(true);
                            return;
                          }
                          setIsCustomDuration(false);
                          setDurationDays(String(preset.days));
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-colors",
                          isSelected
                            ? "border-brand-green-700 bg-brand-green-700 text-white"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                {isCustomDuration && (
                  <Input
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    onKeyDown={blockInvalidNumberChars}
                    placeholder="Liczba dni"
                    className={fieldClass()}
                  />
                )}
              </div>
            )}
          </div>

          {/* Both unlimited warning — kept directly after the two toggles it is about,
              which is still where it lands now that Ważność sits second. */}
          {bothUnlimited && (
            <div className="flex items-center gap-2 rounded-md bg-b2b-amber-bg border border-b2b-amber-border px-3 py-2 text-sm text-b2b-amber-text">
              <AlertTriangle className="size-4 shrink-0" />
              Karnet bez limitu dni i wejść — upewnij się, że tego chcesz.
            </div>
          )}

          {/* Cena */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Cena</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={blockInvalidNumberChars}
                className={fieldClass()}
                placeholder={`Cena w ${currency}`}
              />
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                {getCurrencySymbol(currency)}
              </span>
            </div>
            {perEntry && (
              <p className="mt-1 text-sm text-muted-foreground">
                ={" "}
                <strong>
                  {perEntry} {getCurrencySymbol(currency)}/wejście
                </strong>
              </p>
            )}
            {suggestedPrice && !editPass && (
              <button
                type="button"
                className="mt-2 flex items-center gap-2 rounded-md bg-muted/50 border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors w-full text-left"
                onClick={() => setPrice(String(suggestedPrice))}
              >
                <Lightbulb className="size-4 shrink-0" />
                <span>
                  Sugerowana:{" "}
                  <strong>
                    {suggestedPrice} {getCurrencySymbol(currency)}
                  </strong>{" "}
                  (−10% vs cena za wejście). Stuknij, aby użyć.
                </span>
              </button>
            )}
          </div>

          {/* Opis */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Opis (opcjonalnie)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-sm"
              placeholder="Dodatkowe informacje..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </FormDrawerBody>
        {/* The footer's own X is gone — the header owns closing now, so the footer is
            purely the save action. */}
        <DrawerFooter>
          <Button size="action" onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? "Zapisuję..." : "Zapisz karnet"}
          </Button>
        </DrawerFooter>
      </FormDrawerContent>
    </FormDrawer>
  );
}
