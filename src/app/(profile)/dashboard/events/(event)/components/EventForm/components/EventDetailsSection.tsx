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

interface EventDetailsSectionProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const EventDetailsSection = ({ control, register, errors }: EventDetailsSectionProps) => {
  const { focusTip } = useEventHelpBar();
  return (
    <div className="flex flex-col gap-6 md:gap-10" id="event-details-section">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="title" size="event">
            Tytuł
          </Label>
          <EventHelpBarTipButton tipId="title" />
        </div>

        <Label htmlFor="title" size="event-description">
          Przyciągnij klientów tytułem, który podkreśla czas trwania, miejsce docelowe i atrakcje
          programu
        </Label>
        <Separator className="my-4 md:my-8" />
        <Input
          id="title"
          {...register("title")}
          placeholder="Tytuł"
          onFocus={() => {
            focusTip("title");
          }}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="description" size="event">
            Opis
          </Label>
          <EventHelpBarTipButton tipId="description" />
        </div>
        <Label htmlFor="description" size="event-description">
          Przedstaw swoją ofertę w krótkim podsumowaniu, aby przyciągnąć uwagę klientów
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="description"
          {...register("description")}
          rows={4}
          placeholder="Opis"
          onFocus={() => {
            focusTip("description");
          }}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>
      <div className="space-y-2" id="event-main-attractions">
        <div className="flex items-center gap-2">
          <Label htmlFor="main_attractions" size="event">
            Najważniejsze atrakcje
          </Label>
          <EventHelpBarTipButton tipId="main_attractions" />
        </div>
        <Label htmlFor="main_attractions" size="event-description">
          Wyróżnij to, co jest wyjątkowe w tej podróży, w 6–8 punktach
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="main_attractions"
          control={control}
          render={({ field, fieldState }) => {
            return (
              <DynamicArrayInput
                initialValues={field.value}
                onChange={field.onChange}
                placeholder="Wymień główny punkt programu lub unikalną cechę..."
                ariaLabel="Lista najważniejszych atrakcji"
                error={fieldState.error}
                onFocus={() => {
                  focusTip("main_attractions");
                }}
                control={control}
                name="main_attractions"
              />
            );
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="language" size="event">
            Język prowadzenia zajęć
          </Label>
          <EventHelpBarTipButton tipId="language" />
        </div>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="language"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value || "pl"}
              onOpenChange={(isOpen) => isOpen && focusTip("language")}
            >
              <SelectTrigger onFocus={() => focusTip("language")}>
                <SelectValue placeholder="Wybierz język" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pl">Polski</SelectItem>
                <SelectItem value="en">Angielski</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.language && <p className="text-sm text-destructive">{errors.language.message}</p>}
      </div>
    </div>
  );
};
