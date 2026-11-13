"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { useAssignableStudioId } from "@/hooks/useAssignableInstructors";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";

import type { TemplateStudioPricing } from "../types";

interface StudioPrice {
  id: string;
  drop_in_price: number | null;
  currency: string | null;
}

const defaults = (studioId: string): TemplateStudioPricing => ({
  studio_id: studioId,
  amount: null,
  currency: null,
  name: null,
  conditions: null,
  trial_enabled: false,
});

export function TemplatePricing({
  initial,
  changes,
  onChange,
}: {
  initial: TemplateStudioPricing[];
  changes: TemplateStudioPricing[];
  onChange: (setting: TemplateStudioPricing) => void;
}) {
  const { capabilities } = usePartnerCapabilities();
  const contextStudioId = useAssignableStudioId();
  const [chosenStudio, setChosenStudio] = useState<string | null>(null);
  const studioId = chosenStudio ?? contextStudioId;
  const [studio, setStudio] = useState<StudioPrice | null>(null);
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState<TemplateStudioPricing | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("PLN");
  const [priceEdited, setPriceEdited] = useState(false);
  const [validation, setValidation] = useState("");
  useEffect(() => {
    let active = true;
    setStudio(null);
    setError(false);
    if (studioId)
      axiosInstance
        .get<StudioPrice>(`/studios/${studioId}`)
        .then(({ data }) => {
          if (active) setStudio(data);
        })
        .catch(() => {
          if (active) setError(true);
        });
    return () => {
      active = false;
    };
  }, [studioId]);
  const setting =
    changes.find((s) => s.studio_id === studioId) ??
    initial.find((s) => s.studio_id === studioId) ??
    defaults(studioId ?? "");
  const currentStudio = studio?.id === studioId ? studio : null;
  const effectiveAmount = setting.amount ?? currentStudio?.drop_in_price;
  const effectiveCurrency = setting.currency ?? currentStudio?.currency;

  function open() {
    setDraft({ ...setting });
    setAmount(effectiveAmount != null ? String(effectiveAmount) : "");
    setCurrency(effectiveCurrency || "PLN");
    setPriceEdited(false);
    setValidation("");
  }
  function confirm() {
    if (!draft) return;
    if (
      priceEdited &&
      (!amount.trim() ||
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0 ||
        !/^\d+(\.\d{1,2})?$/.test(amount))
    ) {
      setValidation(
        "Podaj dodatnią cenę z maksymalnie dwoma miejscami po przecinku. Próbne wejście włącz przełącznikiem.",
      );
      return;
    }
    onChange({ ...draft, ...(priceEdited ? { amount: Number(amount), currency } : {}) });
    setDraft(null);
  }
  return (
    <section className="space-y-3">
      <Label className="font-light text-gray-400">Cena zajęć</Label>
      {(capabilities?.managedStudios.length ?? 0) > 1 && (
        <Select
          value={studioId ?? ""}
          onValueChange={(value) => {
            if (value) setChosenStudio(value);
          }}
        >
          <SelectTrigger
            aria-label="Studio dla ceny zajęć"
            className="data-[placeholder]:text-sm data-[placeholder]:font-light"
          >
            <SelectValue placeholder="Wybierz studio" />
          </SelectTrigger>
          <SelectContent>
            {capabilities?.managedStudios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {studioId && (
        <p className="text-sm">
          {setting.amount == null
            ? "Cena według cennika studia"
            : setting.name || "Wejście jednorazowe"}{" "}
          ·{" "}
          {effectiveAmount != null
            ? `${effectiveAmount} ${getCurrencySymbol(effectiveCurrency)}`
            : "Brak ceny"}
        </p>
      )}
      {setting.trial_enabled && <p className="text-sm">Pierwsze zajęcia próbne gratis</p>}
      {error && <p role="alert">Nie udało się wczytać cennika studia.</p>}
      <Button type="button" variant="outline" disabled={!currentStudio} onClick={open}>
        Dostosuj cenę
      </Button>
      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto" closeLabel="Zamknij">
          <DialogTitle>Dostosuj cenę</DialogTitle>
          {draft && (
            <div className="space-y-4">
              <div>
                <Label className="font-light text-gray-400" htmlFor="template-entry-price">
                  Cena jednego wejścia
                </Label>
                <div className="mt-2 grid grid-cols-[1fr_88px] gap-3">
                  <Input
                    id="template-entry-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setPriceEdited(true);
                    }}
                  />
                  <Select
                    value={currency}
                    onValueChange={(value) => {
                      if (value) {
                        setCurrency(value);
                        setPriceEdited(true);
                      }
                    }}
                  >
                    <SelectTrigger aria-label="Waluta wejścia">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLN">zł</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bezpłatne pierwsze zajęcia włącz przełącznikiem poniżej, zamiast wpisywać 0.
                </p>
              </div>
              <div>
                <Label className="font-light text-gray-400" htmlFor="template-entry-name">
                  Nazwa
                </Label>
                <Input
                  id="template-entry-name"
                  maxLength={120}
                  placeholder="Wejście jednorazowe"
                  className="placeholder:text-sm placeholder:font-light"
                  value={draft.name ?? ""}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value || null })}
                />
              </div>
              <div>
                <Label className="font-light text-gray-400" htmlFor="template-entry-conditions">
                  Opis / warunki
                </Label>
                <Textarea
                  id="template-entry-conditions"
                  maxLength={500}
                  value={draft.conditions ?? ""}
                  onChange={(e) => setDraft({ ...draft, conditions: e.target.value || null })}
                />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="font-light text-gray-400" htmlFor="template-trial">
                    Pierwsze zajęcia próbne gratis
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Dla osób, które po raz pierwszy uczestniczą w tych zajęciach.
                  </p>
                </div>
                <Switch
                  id="template-trial"
                  checked={draft.trial_enabled}
                  onCheckedChange={(checked) => setDraft({ ...draft, trial_enabled: checked })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDraft(defaults(studioId!));
                  setPriceEdited(false);
                  setValidation("");
                  setAmount(
                    currentStudio?.drop_in_price != null ? String(currentStudio.drop_in_price) : "",
                  );
                  setCurrency(currentStudio?.currency || "PLN");
                }}
              >
                Przywróć ustawienia studia
              </Button>
              {validation && (
                <p role="alert" className="text-sm text-destructive">
                  {validation}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                  Anuluj
                </Button>
                <Button type="button" onClick={confirm}>
                  Zastosuj
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Organizujesz wydarzenie z osobnym cennikiem?{" "}
                <a
                  className="underline"
                  href="/account/partner/workshops/create"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Utwórz wydarzenie.
                </a>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
