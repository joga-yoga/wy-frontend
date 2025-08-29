import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EventFormData } from "@/lib/schemas/event";

import { DynamicArrayInput } from "../../DynamicArrayInput";
import { useEventHelpBar } from "../contexts/EventHelpBarContext";
import { EventHelpBarTipButton } from "./EventHelpBar";
interface EventPricingSectionProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const EventPricingSection = ({ control, register, errors }: EventPricingSectionProps) => {
  const { focusTip } = useEventHelpBar();

  return (
    <div className="flex flex-col gap-6 md:gap-10" id="event-pricing-section">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="price" size="event">
            Cena
          </Label>
          <EventHelpBarTipButton tipId="price" />
        </div>
        <Label htmlFor="price" size="event-description">
          Podaj pełną cenę za udział w wyjazdzie za jedną osobę
        </Label>
        <Separator className="my-4 md:my-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="flex">
              Cena
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step=""
              {...register("price", {
                setValueAs: (v) =>
                  v === "" || typeof v === "undefined" ? undefined : parseFloat(v),
              })}
              placeholder="Cena za jedną osobę"
              onFocus={() => focusTip("price")}
            />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency" className="flex">
              Waluta
            </Label>
            <Controller
              name="currency"
              control={control}
              defaultValue="PLN"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || "PLN"}>
                  <SelectTrigger id="currency" onFocus={() => focusTip("price")}>
                    <SelectValue placeholder="Wybierz walutę" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLN">PLN</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.currency && (
              <p className="text-sm text-destructive">{errors.currency.message}</p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="price_includes" size="event">
            Co jest wliczone w cenę
          </Label>
          <EventHelpBarTipButton tipId="price_includes" />
        </div>
        <Label htmlFor="price_includes" size="event-description">
          Wymień wszystkie aktywności, udogodnienia i usługi, które są zawarte w cenie pakietu.
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="price_includes"
          control={control}
          render={({ field, fieldState }) => {
            return (
              <DynamicArrayInput
                initialValues={field.value}
                onChange={field.onChange}
                placeholder="Np. Śniadanie, Transfer z lotniska"
                ariaLabel="Lista rzeczy wliczonych w cenę"
                error={fieldState.error}
                onFocus={() => focusTip("price_includes")}
              />
            );
          }}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="price_excludes" size="event">
            Co nie jest wliczone w cenę
          </Label>
          <EventHelpBarTipButton tipId="price_excludes" />
        </div>
        <Label htmlFor="price_excludes" size="event-description">
          Wymień wszystkie elementy istotne dla uczestników, które nie są zawarte w cenie pakietu
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="price_excludes"
          control={control}
          render={({ field, fieldState }) => (
            <DynamicArrayInput
              initialValues={field.value}
              onChange={field.onChange}
              placeholder="Np. Lunch, Opłaty klimatyczne"
              ariaLabel="Lista rzeczy niewliczonych w cenę"
              error={fieldState.error}
              onFocus={() => focusTip("price_excludes")}
            />
          )}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="paid_attractions" size="event">
            Dodatkowe atrakcje za dopłatą
          </Label>
          <EventHelpBarTipButton tipId="paid_attractions" />
        </div>
        <Label htmlFor="paid_attractions" size="event-description">
          Podziel się informacjami o innych aktywnościach, które uczestnicy mogą zrobić w okolicy za
          dodatkową opłatę
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="paid_attractions"
          control={control}
          render={({ field, fieldState }) => (
            <DynamicArrayInput
              initialValues={field.value}
              onChange={field.onChange}
              placeholder="Np. Masaż, Wypożyczenie sprzętu"
              ariaLabel="Lista dodatkowych płatnych atrakcji"
              error={fieldState.error}
              onFocus={() => focusTip("paid_attractions")}
            />
          )}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="cancellation_policy" size="event">
            Zasady anulowania rezerwacji
          </Label>
          <EventHelpBarTipButton tipId="cancellation_policy" />
        </div>
        <Label htmlFor="cancellation_policy" size="event-description">
          Tutaj należy opisać, na jakich warunkach uczestnik może odwołać swój udział w wyjazdzie
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="cancellation_policy"
          {...register("cancellation_policy")}
          rows={3}
          placeholder="Zasady anulowania rezerwacji"
          onFocus={() => focusTip("cancellation_policy")}
        />
        {errors.cancellation_policy && (
          <p className="text-sm text-destructive">{errors.cancellation_policy.message}</p>
        )}
      </div>
    </div>
  );
};
