import { FieldErrors, UseFormRegister } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EventFormData } from "@/lib/schemas/event";

interface EventHospitalitySectionProps {
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
  handleFocusField: (tipId: string) => void;
}

export const EventHospitalitySection = ({
  register,
  errors,
  handleFocusField,
}: EventHospitalitySectionProps) => {
  return (
    <div className="space-y-4 md:space-y-6" id="event-hospitality">
      <div className="space-y-2">
        <Label htmlFor="accommodation_description" size="event">
          Nocleg
        </Label>
        <Label htmlFor="accommodation_description" size="event-description">
          Opisz miejsce lub miejsca, w których będą przebywać uczestnicy
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="accommodation_description"
          {...register("accommodation_description")}
          rows={3}
          placeholder="Opisz miejsce lub miejsca, w których będą przebywać uczestnicy"
          onFocus={() => handleFocusField("accommodation_description")}
        />
        {errors.accommodation_description && (
          <p className="text-sm text-destructive">{errors.accommodation_description.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="guest_welcome_description" size="event">
          Powitanie gości
        </Label>
        <Label htmlFor="guest_welcome_description" size="event-description">
          Opisz, kto będzie gościł uczestników oraz o której godzinie przewidziane są zameldowanie i
          wymeldowanie.
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="guest_welcome_description"
          {...register("guest_welcome_description")}
          rows={3}
          placeholder="Powitanie gości"
          onFocus={() => handleFocusField("guest_welcome_description")}
        />
        {errors.guest_welcome_description && (
          <p className="text-sm text-destructive">{errors.guest_welcome_description.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="food_description" size="event">
          Wyżywienie
        </Label>
        <Label htmlFor="food_description" size="event-description">
          Wybierz wszystkie rodzaje jedzenia, które są serwowane, oraz wszelkie wymagania
          dietetyczne, które są uwzględniane{" "}
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="food_description"
          {...register("food_description")}
          rows={3}
          placeholder="Wyżywienie"
          onFocus={() => handleFocusField("food_description")}
        />
        {errors.food_description && (
          <p className="text-sm text-destructive">{errors.food_description.message}</p>
        )}
      </div>
    </div>
  );
};
