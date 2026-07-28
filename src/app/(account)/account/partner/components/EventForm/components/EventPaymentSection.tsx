"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EventFormData } from "@/lib/schemas/event";

const BALANCE_METHODS = [
  { value: "online", label: "Online" },
  { value: "cash_on_site", label: "Gotówka na miejscu" },
  { value: "bank_transfer", label: "Przelew bankowy" },
] as const;

interface EventPaymentSectionProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const EventPaymentSection = ({ control, register, errors }: EventPaymentSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2 event-form-section-padding">
      <button
        type="button"
        className="flex items-center justify-between w-full text-left"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div>
          <Label size="event" className="cursor-pointer">
            Opcje płatności
          </Label>
          <Label size="event-description" className="cursor-pointer block mt-1">
            Ustaw zadatek, metody płatności salda i warunki płatności (informacyjnie)
          </Label>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
        )}
      </button>

      {isOpen && (
        <>
          <Separator className="my-4 md:my-8" />

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Kwota zadatku</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Np. 200"
                  {...register("deposit_amount", {
                    setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                  })}
                />
                {errors.deposit_amount && (
                  <p className="text-sm text-destructive">{errors.deposit_amount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Metody płatności salda</Label>
              <Controller
                name="balance_payment_methods"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    {BALANCE_METHODS.map(({ value, label }) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`bpm-${value}`}
                          checked={(field.value ?? []).includes(value)}
                          onCheckedChange={(checked) => {
                            const current = field.value ?? [];
                            if (checked) {
                              field.onChange([...current, value]);
                            } else {
                              field.onChange(current.filter((m) => m !== value));
                            }
                          }}
                        />
                        <Label htmlFor={`bpm-${value}`} className="font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Warunki płatności</Label>
              <Textarea
                id="payment_terms"
                {...register("payment_terms")}
                rows={3}
                placeholder="Np. Zadatek wymagany przy rezerwacji. Saldo płatne 14 dni przed kursem."
              />
              {errors.payment_terms && (
                <p className="text-sm text-destructive">{errors.payment_terms.message}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
