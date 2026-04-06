import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EventFormData } from "@/lib/schemas/event";

interface ClassMetaSectionProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const ClassMetaSection = ({ control, register, errors }: ClassMetaSectionProps) => {
  return (
    <div className="space-y-2 event-form-section-padding">
      <Label htmlFor="duration_minutes" size="event">
        Parametry zajęć
      </Label>
      <Label htmlFor="duration_minutes" size="event-description">
        Uzupełnij podstawowe informacje o stylu, poziomie i intensywności zajęć.
      </Label>
      <Separator className="my-4 md:my-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Czas trwania (min)</Label>
          <Input id="duration_minutes" type="number" {...register("duration_minutes")} />
          {errors.duration_minutes && (
            <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="style">Styl</Label>
          <Input id="style" {...register("style")} />
          {errors.style && <p className="text-sm text-destructive">{errors.style.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Poziom</Label>
          <Input id="level" {...register("level")} />
          {errors.level && <p className="text-sm text-destructive">{errors.level.message}</p>}
        </div>
        <Controller
          name="intensity"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <Label htmlFor="intensity">Intensywność (1-10)</Label>
              <Input
                id="intensity"
                type="number"
                min={1}
                max={10}
                value={field.value ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  field.onChange(value === "" ? null : Number(value));
                }}
              />
              {errors.intensity && (
                <p className="text-sm text-destructive">{errors.intensity.message}</p>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
};
