import { FieldErrors, UseFormRegister } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EventFormData } from "@/lib/schemas/event";

import { useEventHelpBar } from "../contexts/EventHelpBarContext";
import { EventHelpBarTipButton } from "./EventHelpBar";
interface EventHospitalitySectionProps {
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const EventHospitalitySection = ({ register, errors }: EventHospitalitySectionProps) => {
  const { focusTip } = useEventHelpBar();
  return (
    <div className="flex flex-col gap-10 md:gap-[80px]" id="event-hospitality">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="accommodation_description" size="event">
            Nocleg
          </Label>
          <EventHelpBarTipButton tipId="accommodation_description" />
        </div>
        <Label htmlFor="accommodation_description" size="event-description">
          Opisz miejsce lub miejsca, w których będą przebywać uczestnicy
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="accommodation_description"
          {...register("accommodation_description")}
          rows={3}
          placeholder="Opisz miejsce lub miejsca, w których będą przebywać uczestnicy"
          onFocus={() => focusTip("accommodation_description")}
        />
        {errors.accommodation_description && (
          <p className="text-sm text-destructive">{errors.accommodation_description.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="guest_welcome_description" size="event">
            Powitanie gości
          </Label>
          <EventHelpBarTipButton tipId="guest_welcome_description" />
        </div>
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
          onFocus={() => focusTip("guest_welcome_description")}
        />
        {errors.guest_welcome_description && (
          <p className="text-sm text-destructive">{errors.guest_welcome_description.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="food_description" size="event">
            Wyżywienie
          </Label>
          <EventHelpBarTipButton tipId="food_description" />
        </div>
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
          onFocus={() => focusTip("food_description")}
        />
        {errors.food_description && (
          <p className="text-sm text-destructive">{errors.food_description.message}</p>
        )}
      </div>
    </div>
  );
};
