"use client";

import { isAxiosError } from "axios";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FormDrawer, FormDrawerBody, FormDrawerContent } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import { wejscia } from "@/lib/polishPlural";
import { cn } from "@/lib/utils";

import type { StudioPass } from "./types";

interface PassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (pass: StudioPass) => void;
  studioId: string | null;
  studioName?: string;
  dropInPrice: number | null;
  currency: string;
  editPass?: StudioPass | null;
}

type Limit = { value: string; unlimited: boolean; custom: boolean };
type FormValues = { name: string; price: string; description: string; visits: Limit; days: Limit };
type Field = "name" | "price" | "visits" | "days";
const VISITS = [4, 8, 12];
const DAYS = [30, 60, 90];

function initialValues(pass?: StudioPass | null): FormValues {
  const limit = (
    value: StudioPass["session_count"],
    presets: number[],
    fallback: number,
  ): Limit => ({
    value: value == null || value === "" ? String(fallback) : String(value),
    unlimited: value == null || value === "",
    custom: value != null && value !== "" && !presets.includes(Number(value)),
  });
  return {
    name: pass?.name ?? "",
    price: pass ? decimal(Number(pass.price)) : "",
    description: pass?.description ?? "",
    visits: pass
      ? limit(pass.session_count, VISITS, 8)
      : { value: "8", unlimited: false, custom: false },
    days: pass
      ? limit(pass.duration_days, DAYS, 30)
      : { value: "30", unlimited: false, custom: false },
  };
}

function positiveInteger(value: string): number | null {
  const number = Number(value);
  return /^\d+$/.test(value.trim()) && Number.isSafeInteger(number) && number > 0 ? number : null;
}
function positivePrice(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  const number = Number(normalized);
  return /^\d+(\.\d{1,2})?$/.test(normalized) && Number.isFinite(number) && number > 0
    ? number
    : null;
}
function decimal(value: number): string {
  return value.toFixed(2).replace(".", ",");
}
// Compare saved meaning, so formatting on blur or opening a custom field isn't a change.
function signature(form: FormValues): string {
  return JSON.stringify({
    name: form.name,
    description: form.description,
    price: positivePrice(form.price) ?? form.price,
    visits: form.visits.unlimited ? null : form.visits.value,
    days: form.days.unlimited ? null : form.days.value,
  });
}
function DesignIcon({
  name,
  width = 18,
  height = width,
}: {
  name: string;
  width?: number;
  height?: number;
}) {
  return (
    <Image
      src={`/images/pass-form/${name}.svg`}
      width={width}
      height={height}
      alt=""
      className="shrink-0"
    />
  );
}
const inputClass =
  "h-12 rounded-xl border-zinc-200 px-4 text-base shadow-none focus-visible:ring-brand-green-700 aria-invalid:border-destructive aria-invalid:bg-red-50";
const choiceClass = "h-11 min-w-0 rounded-xl border px-2 text-base font-semibold shadow-none";

function LimitField({
  id,
  label,
  value,
  presets,
  customLabel,
  unit,
  unlimitedLabel,
  unlimitedText,
  icon,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  value: Limit;
  presets: number[];
  customLabel: string;
  unit: string;
  unlimitedLabel: string;
  unlimitedText: string;
  icon: string;
  error?: string;
  onChange: (next: Limit) => void;
  onBlur: () => void;
}) {
  return (
    <div className="space-y-2" role="group" aria-labelledby={`${id}-label`}>
      <div className="flex items-center justify-between gap-2">
        <span id={`${id}-label`} className="text-sm font-semibold">
          {label}
        </span>
        <label
          className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600"
          htmlFor={`${id}-unlimited`}
        >
          {unlimitedLabel}
          <Button
            id={`${id}-unlimited`}
            type="button"
            role="switch"
            aria-checked={value.unlimited}
            aria-label={unlimitedLabel}
            variant="ghost"
            className="h-[22px] w-9 rounded-full p-0"
            onClick={() => onChange({ ...value, unlimited: !value.unlimited })}
          >
            <DesignIcon
              name={value.unlimited ? "toggle-on" : "toggle-off"}
              width={36}
              height={22}
            />
          </Button>
        </label>
      </div>
      {value.unlimited ? (
        <p className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--pass-tint)] px-3 text-[var(--pass-green)]">
          <DesignIcon name={icon} />
          {unlimitedText}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                aria-pressed={!value.custom && value.value === String(preset)}
                className={cn(
                  choiceClass,
                  !value.custom &&
                    value.value === String(preset) &&
                    "border-[var(--pass-green)] bg-[var(--pass-tint)] text-[var(--pass-green)]",
                )}
                onClick={() => onChange({ value: String(preset), unlimited: false, custom: false })}
              >
                {preset}
                {unit === "dni" ? " dni" : ""}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              aria-pressed={value.custom}
              className={cn(
                choiceClass,
                value.custom &&
                  "border-[var(--pass-green)] bg-[var(--pass-tint)] text-[var(--pass-green)]",
              )}
              onClick={() => onChange({ ...value, custom: true })}
            >
              {customLabel}
            </Button>
          </div>
          {value.custom && (
            <>
              <div className="relative">
                <Input
                  id={id}
                  aria-label={label}
                  inputMode="numeric"
                  value={value.value}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className={cn(inputClass, "pr-16")}
                  onBlur={onBlur}
                  onChange={(e) => onChange({ ...value, value: e.target.value })}
                />
                <span className="pointer-events-none absolute right-4 top-3.5 text-sm text-zinc-600">
                  {unit}
                </span>
              </div>
              {unit === "dni" && (
                <div className="grid grid-cols-2 gap-2">
                  {[180, 365].map((days) => (
                    <Button
                      type="button"
                      key={days}
                      variant="outline"
                      className={cn(
                        choiceClass,
                        value.value === String(days) &&
                          "border-[var(--pass-green)] bg-[var(--pass-tint)] text-[var(--pass-green)]",
                      )}
                      aria-pressed={value.value === String(days)}
                      onClick={() => onChange({ ...value, value: String(days) })}
                    >
                      {days} dni
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
          {error && (
            <p id={`${id}-error`} className="text-xs text-destructive">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function PassModal({
  isOpen,
  onClose,
  onSaved,
  studioId,
  studioName,
  dropInPrice,
  currency,
  editPass,
}: PassModalProps) {
  const id = useId();
  const [form, setForm] = useState(() => initialValues(editPass));
  const baseline = useRef(signature(form));
  const saving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [descriptionOpen, setDescriptionOpen] = useState(Boolean(editPass?.description));
  const [discardOpen, setDiscardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const next = initialValues(editPass);
    setForm(next);
    baseline.current = signature(next);
    setTouched({});
    setError(null);
    setDescriptionOpen(Boolean(editPass?.description));
    setDiscardOpen(false);
  }, [isOpen, editPass]);
  const field = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const touch = (key: Field) => setTouched((current) => ({ ...current, [key]: true }));
  const visits = positiveInteger(form.visits.value);
  const days = positiveInteger(form.days.value);
  const price = positivePrice(form.price);
  const passCurrency = editPass?.currency || currency || "PLN";
  const symbol = getCurrencySymbol(passCurrency);
  const errors = {
    name: form.name.trim() ? undefined : "Wpisz nazwę karnetu.",
    price:
      price === null ? `Wpisz cenę większą niż 0 ${symbol} (do 2 miejsc po przecinku).` : undefined,
    visits:
      !form.visits.unlimited && visits === null
        ? "Wpisz dodatnią, całkowitą liczbę wejść."
        : undefined,
    days:
      !form.days.unlimited && days === null ? "Wpisz dodatnią, całkowitą liczbę dni." : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const perVisit = !form.visits.unlimited && visits && price ? price / visits : null;
  const suggestedPrice =
    !editPass && !form.visits.unlimited && visits && dropInPrice && dropInPrice > 0
      ? Math.round(visits * dropInPrice * 0.9 * 100) / 100
      : null;
  const visitSummary = form.visits.unlimited ? "Bez limitu" : visits ? wejscia(visits) : "— wejść";
  const daySummary = form.days.unlimited ? "bez terminu" : days ? `${days} dni` : "— dni";
  const total = price === null ? "—" : `${decimal(price)} ${symbol}`;
  function requestClose() {
    if (saving.current) return;
    if (signature(form) !== baseline.current) setDiscardOpen(true);
    else onClose();
  }
  async function handleSave() {
    if (saving.current) return;
    setTouched({ name: true, price: true, visits: true, days: true });
    if (!valid || price === null) return;
    saving.current = true;
    setIsSaving(true);
    setError(null);
    const passData = {
      name: form.name.trim(),
      price,
      currency: passCurrency,
      description: form.description.trim(),
      session_count: form.visits.unlimited ? null : visits,
      duration_days: form.days.unlimited ? null : days,
    };
    try {
      let saved: StudioPass;
      if (studioId && editPass?.id) {
        const { data } = await axiosInstance.put<StudioPass>(
          `/studios/${studioId}/passes/${editPass.id}`,
          passData,
        );
        saved = data;
      } else if (studioId) {
        const { data } = await axiosInstance.post<StudioPass>(
          `/studios/${studioId}/passes`,
          passData,
        );
        saved = data;
      } else saved = { ...editPass, ...passData };
      onSaved(saved);
      onClose();
    } catch (error: unknown) {
      const detail: unknown = isAxiosError(error) ? error.response?.data?.detail : null;
      setError(
        typeof detail === "string" ? detail : "Nie udało się zapisać karnetu. Spróbuj ponownie.",
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }
  return (
    <>
      <FormDrawer open={isOpen} onClose={requestClose}>
        <FormDrawerContent className="mx-auto w-[calc(100%-1rem)] max-w-[960px] text-zinc-800 [--pass-green:#245642] [--pass-tint:#eaf2ec] md:my-auto md:!h-[min(721px,calc(100dvh-4rem))] md:inset-y-0">
          <DrawerHeader className="shrink-0 border-b border-zinc-200 p-6 text-left md:p-8">
            <div className="flex items-center justify-between gap-3">
              <DrawerTitle className="text-[26px] font-semibold leading-9 md:text-[30px]">
                {editPass ? "Edytuj karnet" : "Nowy karnet"}
              </DrawerTitle>
              <DrawerClose
                aria-label="Zamknij"
                disabled={isSaving}
                className="rounded-md p-2 focus-visible:ring-2 focus-visible:ring-brand-green-700"
              >
                <span className="md:hidden">
                  <DesignIcon name="close-mobile" width={20} />
                </span>
                <span className="hidden md:block">
                  <DesignIcon name="icon-close" width={24} />
                </span>
              </DrawerClose>
            </div>
            <DrawerDescription className="text-left text-sm text-zinc-600">
              <span className="md:hidden">Ustaw zasady i cenę karnetu.</span>
              <span className="hidden md:inline">
                Ustaw zasady i cenę. Podgląd pokaże efekt od razu.
              </span>
            </DrawerDescription>
          </DrawerHeader>
          <FormDrawerBody className="p-6 md:p-8">
            <div className="grid gap-10 md:grid-cols-[minmax(0,492px)_324px]">
              <form
                id={`${id}-form`}
                className="min-w-0"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSave();
                }}
              >
                <fieldset disabled={isSaving} className="min-w-0 space-y-5">
                  <div className="space-y-2">
                    <label htmlFor={`${id}-name`} className="block text-sm font-semibold">
                      Nazwa karnetu
                    </label>
                    <Input
                      id={`${id}-name`}
                      value={form.name}
                      onChange={(e) => field("name", e.target.value)}
                      onBlur={() => touch("name")}
                      className={inputClass}
                      placeholder="np. Karnet 8 wejść"
                      aria-invalid={Boolean(touched.name && errors.name)}
                      aria-describedby={
                        touched.name && errors.name ? `${id}-name-error` : undefined
                      }
                    />
                    {touched.name && errors.name && (
                      <p id={`${id}-name-error`} className="text-xs text-destructive">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <LimitField
                    id={`${id}-visits`}
                    label="Liczba wejść"
                    value={form.visits}
                    presets={VISITS}
                    customLabel="Inna"
                    unit="wejść"
                    unlimitedLabel="Bez limitu"
                    unlimitedText="Dowolna liczba zajęć"
                    icon="icon-ticket"
                    onChange={(next) => field("visits", next)}
                    onBlur={() => touch("visits")}
                    error={touched.visits ? errors.visits : undefined}
                  />
                  <LimitField
                    id={`${id}-days`}
                    label="Ważność"
                    value={form.days}
                    presets={DAYS}
                    customLabel="Inny"
                    unit="dni"
                    unlimitedLabel="Bez terminu"
                    unlimitedText="Bez terminu ważności"
                    icon="icon-clock"
                    onChange={(next) => field("days", next)}
                    onBlur={() => touch("days")}
                    error={touched.days ? errors.days : undefined}
                  />
                  <div className="space-y-2">
                    <label htmlFor={`${id}-price`} className="block text-sm font-semibold">
                      Cena karnetu
                    </label>
                    <div className="relative">
                      <Input
                        id={`${id}-price`}
                        inputMode="decimal"
                        value={form.price}
                        onChange={(e) => field("price", e.target.value)}
                        onBlur={() => {
                          touch("price");
                          if (price !== null || /^0+([,.]0{1,2})?$/.test(form.price.trim()))
                            field("price", decimal(price ?? 0));
                        }}
                        className={cn(inputClass, "pr-16")}
                        placeholder="np. 240,00"
                        aria-invalid={Boolean(touched.price && errors.price)}
                        aria-describedby={`${id}-price-help`}
                      />
                      <span className="pointer-events-none absolute right-4 top-3.5 text-sm text-zinc-600">
                        {passCurrency}
                      </span>
                    </div>
                    <p
                      id={`${id}-price-help`}
                      className={cn(
                        "text-xs text-zinc-600",
                        touched.price && errors.price && "text-destructive",
                      )}
                    >
                      {touched.price && errors.price
                        ? errors.price
                        : perVisit
                          ? `${decimal(perVisit)} ${symbol} za jedno wejście`
                          : form.visits.unlimited
                            ? "Stała cena za cały karnet."
                            : "Kwota, którą zapłaci klient."}
                    </p>
                    {suggestedPrice !== null && (
                      <button
                        type="button"
                        className="text-left text-xs text-zinc-500 underline underline-offset-4"
                        onClick={() => field("price", decimal(suggestedPrice))}
                      >
                        Użyj sugerowanej ceny {decimal(suggestedPrice)} {symbol} (−10% od wejść
                        pojedynczych)
                      </button>
                    )}
                  </div>
                  {descriptionOpen ? (
                    <div className="space-y-2">
                      <label htmlFor={`${id}-description`} className="block text-sm font-semibold">
                        Opis · opcjonalnie
                      </label>
                      <Textarea
                        id={`${id}-description`}
                        value={form.description}
                        onChange={(e) => field("description", e.target.value)}
                        rows={2}
                        className="rounded-xl border-zinc-200 p-4 text-sm shadow-none"
                        placeholder="Dodatkowe informacje dla klientów"
                      />
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto justify-start p-0 text-[var(--pass-green)]"
                      onClick={() => setDescriptionOpen(true)}
                    >
                      <DesignIcon name="icon-plus" />
                      Dodaj opis <span className="font-normal text-zinc-600">· opcjonalnie</span>
                    </Button>
                  )}
                </fieldset>
              </form>
              <aside aria-label="Podgląd karnetu" className="hidden min-w-0 space-y-5 md:block">
                <p className="text-[11px] font-semibold text-zinc-600">TAK ZOBACZY GO KLIENT</p>
                <div className="space-y-5 rounded-[20px] bg-[var(--pass-tint)] p-6 text-[var(--pass-green)]">
                  <p className="flex items-center gap-2 text-[13px]">
                    <DesignIcon name="icon-leaf" width={24} />
                    <span className="break-words">{studioName || "Twoje studio"}</span>
                  </p>
                  <h3 className="break-words text-[26px] font-semibold leading-9">
                    {form.name.trim() || "Nazwa karnetu"}
                  </h3>
                  <div className="space-y-3 text-[15px]">
                    <p className="flex items-center gap-2.5">
                      <DesignIcon name="icon-ticket" />
                      {form.visits.unlimited
                        ? "Dowolna liczba zajęć"
                        : `${visitSummary} na zajęcia`}
                    </p>
                    <p className="flex items-center gap-2.5">
                      <DesignIcon name="icon-clock" />
                      {form.days.unlimited
                        ? "Bez terminu ważności"
                        : days
                          ? `Ważny przez ${days} dni`
                          : "Ważność —"}
                    </p>
                  </div>
                  {form.description.trim() && (
                    <p className="whitespace-pre-wrap break-words text-sm">{form.description}</p>
                  )}
                  <div className="border-t border-zinc-200 pt-5">
                    <span className="break-words text-[40px] font-semibold leading-[56px]">
                      {price === null ? "—" : decimal(price)}
                    </span>
                    {price !== null && <span className="ml-1.5 text-lg">{symbol}</span>}
                  </div>
                  {perVisit !== null && (
                    <p className="text-[13px]">
                      {decimal(perVisit)} {symbol} / wejście
                    </p>
                  )}
                </div>
                <p className="text-[13px] text-zinc-600">
                  Podgląd aktualizuje się podczas
                  <br />
                  wypełniania formularza.
                </p>
              </aside>
            </div>
          </FormDrawerBody>
          <DrawerFooter className="shrink-0 gap-3 border-t border-zinc-200 p-6">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div
              aria-label="Podsumowanie karnetu"
              className="flex items-center justify-between gap-2 text-[13px] md:hidden"
            >
              <span className="text-zinc-600">
                {visitSummary} · {daySummary}
              </span>
              <strong className="shrink-0 text-[15px]">{total}</strong>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="hidden h-12 rounded-xl px-6 text-base shadow-none md:inline-flex"
                disabled={isSaving}
                onClick={requestClose}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                form={`${id}-form`}
                className="h-12 w-full rounded-xl bg-[var(--pass-green)] px-8 text-base font-semibold text-white hover:bg-[var(--pass-green)]/90 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:opacity-100 md:w-auto"
                disabled={!valid || isSaving}
              >
                {isSaving ? "Zapisywanie…" : editPass ? "Zapisz zmiany" : "Utwórz karnet"}
              </Button>
            </div>
          </DrawerFooter>
        </FormDrawerContent>
      </FormDrawer>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odrzucić zmiany?</AlertDialogTitle>
            <AlertDialogDescription>Zmiany w karnecie nie zostały zapisane.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Wróć do edycji</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false);
                onClose();
              }}
            >
              Odrzuć zmiany
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
