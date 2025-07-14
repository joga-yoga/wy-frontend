import { FieldErrors, UseFormRegister } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EventFormData } from "@/lib/schemas/event";

interface EventImportantInfoSectionProps {
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
  handleFocusField: (tipId: string) => void;
}

export const EventImportantInfoSection = ({
  register,
  errors,
  handleFocusField,
}: EventImportantInfoSectionProps) => {
  return (
    <div className="space-y-4 md:space-y-6" id="event-policies">
      <div className="space-y-2">
        <Label htmlFor="important_info" size="event">
          Warto wiedzieć przed wyjazdem
        </Label>
        <Label htmlFor="important_info" size="event-description">
          Podziel się dodatkowymi informacjami, które mogą być istotne dla uczestników. Ta sekcja
          nie będzie publikowana w ofercie, a jedynie widoczna w powiadomieniach e-mail dla klientów
        </Label>
        <Separator className="my-4 md:my-8" />
        <Textarea
          id="important_info"
          {...register("important_info")}
          rows={3}
          placeholder="Warto wiedzieć przed wyjazdem"
          onFocus={() => handleFocusField("important_info")}
        />
        {errors.important_info && (
          <p className="text-sm text-destructive">{errors.important_info.message}</p>
        )}
      </div>
    </div>
  );
};
