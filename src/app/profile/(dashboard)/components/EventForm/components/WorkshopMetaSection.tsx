import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";

import { TagsSelect } from "@/components/custom/TagsSelect";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { EventFormData } from "@/lib/schemas/event";

import { DynamicArrayInput } from "../../DynamicArrayInput";

interface WorkshopMetaSectionProps {
  control: Control<EventFormData>;
  register: UseFormRegister<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const WorkshopMetaSection = ({ control }: WorkshopMetaSectionProps) => {
  return (
    <>
      <div className="space-y-2 event-form-section-padding">
        <Label htmlFor="is_online" size="event">
          Format
        </Label>
        <Label htmlFor="is_online" size="event-description">
          Czy wydarzenie będzie online czy stacjonarne?
        </Label>

        <Separator className="my-4 md:my-8" />
        <div className="flex flex-col gap-4">
          <Controller
            name="is_online"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Switch checked={!!field.value} onCheckedChange={field.onChange} id="is_online" />
                <Label htmlFor="is_online">Online</Label>
              </div>
            )}
          />
          <Controller
            name="is_onsite"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <div className="flex items-center gap-3">
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} id="is_onsite" />
                  <Label htmlFor="is_onsite">Stacjonarne</Label>
                </div>
                <div
                  ref={field.ref}
                  tabIndex={-1}
                  className="absolute w-0 h-0 opacity-0 pointer-events-none"
                />
                {fieldState.error &&
                  !Array.isArray(fieldState.error) &&
                  typeof fieldState.error === "object" &&
                  fieldState.error.message && (
                    <div className="mt-1">
                      <p className="text-xs text-red-500">{fieldState.error.message}</p>
                    </div>
                  )}
              </>
            )}
          />
        </div>
      </div>

      <div className="space-y-2 event-form-section-padding">
        <Label htmlFor="goals" size="event">
          Cele
        </Label>
        <Label htmlFor="goals" size="event-description">
          Wymień cele wydarzenia, które mają być wyświetlane na stronie publicznej.
        </Label>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="goals"
          control={control}
          render={({ field, fieldState }) => (
            <DynamicArrayInput
              initialValues={field.value}
              onChange={field.onChange}
              placeholder="Dodaj cel (np. Nauka podstaw jogi)"
              ariaLabel="Cele"
              error={fieldState.error}
              control={control}
              name="goals"
            />
          )}
        />
      </div>

      <div className="space-y-2 event-form-section-padding">
        <Label htmlFor="tags" size="event">
          Tagi
        </Label>
        <Label htmlFor="tags" size="event-description">
          Wymień tagi wydarzenia, które mają być wyświetlane na stronie publicznej.
        </Label>
        <Separator className="my-4 md:my-8" />
        <TagsSelect control={control} />
      </div>
    </>
  );
};
