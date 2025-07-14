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

interface EventDetailsSectionProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
  handleFocusField: (tipId: string) => void;
}

export const EventDetailsSection = ({
  control,
  register,
  errors,
  handleFocusField,
}: EventDetailsSectionProps) => {
  return (
    <div className="space-y-4 md:space-y-6" id="event-details-section">
      <div className="space-y-2">
        <Label htmlFor="title" size="event">
          Tytuł
        </Label>
        <Label htmlFor="title" size="event-description">
          Przyciągnij klientów tytułem, który podkreśla czas trwania, miejsce docelowe i atrakcje
          programu
        </Label>
        <Separator className="my-4 md:my-8" />
        <Input
          id="title"
          {...register("title")}
          placeholder="Tytuł"
          onFocus={() => handleFocusField("title")}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" size="event">
          Opis
        </Label>
        <Label htmlFor="description" size="event-description">
          Przedstaw swoją ofertę w krótkim podsumowaniu, aby przyciągnąć uwagę klientów
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="description"
          {...register("description")}
          rows={4}
          placeholder="Opis"
          onFocus={() => handleFocusField("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>
      <div className="space-y-2" id="event-main-attractions">
        <Label htmlFor="main_attractions" size="event">
          Najważniejsze atrakcje
        </Label>
        <Label htmlFor="main_attractions" size="event-description">
          Wyróżnij to, co jest wyjątkowe w tej podróży, w 6–8 punktach
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="main_attractions"
          control={control}
          render={({ field, fieldState }) => (
            <DynamicArrayInput
              initialValues={(field.value ?? []).filter(
                (item): item is string => typeof item === "string",
              )}
              onChange={field.onChange}
              placeholder="Wymień główny punkt programu lub unikalną cechę..."
              ariaLabel="Lista najważniejszych atrakcji"
              error={fieldState.error}
              onFocus={() => handleFocusField("main_attractions")}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" size="event">
          Język prowadzenia zajęć
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="language"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value || "pl"}
              onOpenChange={(isOpen) => isOpen && handleFocusField("language")}
            >
              <SelectTrigger onFocus={() => handleFocusField("language")}>
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
