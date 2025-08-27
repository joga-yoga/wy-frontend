import { Control, Controller, FieldErrors } from "react-hook-form";

import MultipleSelector, { Option } from "@/components/custom/multiple-selector";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EventFormData } from "@/lib/schemas/event";

import { useEventHelpBar } from "../contexts/EventHelpBarContext";
import { EventHelpBarTipButton } from "./EventHelpBar";

const OPTIONS: Option[] = [
  { label: "Początkujący", value: "beginner" },
  { label: "Średni", value: "intermediate" },
  { label: "Zaawansowany", value: "advanced" },
];

interface EventSkillLevelProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

export const EventSkillLevel = ({ control, errors }: EventSkillLevelProps) => {
  const { focusTip } = useEventHelpBar();
  return (
    <div className="flex flex-col gap-10 md:gap-[80px]" id="event-details-continued">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="skill_level" size="event">
            Poziom zaawansowania
          </Label>
          <EventHelpBarTipButton tipId="skill_level" />
        </div>
        <Separator className="my-4 md:my-8" />
        <Controller
          name="skill_level"
          control={control}
          render={({ field }) => (
            <div
              onFocus={() => {
                focusTip("skill_level");
              }}
              tabIndex={0}
            >
              <MultipleSelector
                defaultOptions={OPTIONS}
                selectFirstItem={false}
                value={
                  field.value?.map((val: string) => ({
                    label: OPTIONS.find((o) => o.value === val)?.label || val,
                    value: val,
                  })) || []
                }
                onChange={(options: Option[]) => {
                  field.onChange(options.map((option) => option.value));
                }}
                placeholder="Wybierz poziom zaawansowania"
                emptyIndicator={
                  <p className="text-center text-smlg:text-lg leading-10 text-gray-600 dark:text-gray-400">
                    Brak wyników.
                  </p>
                }
                hidePlaceholderWhenSelected
              />
            </div>
          )}
        />
        {errors.skill_level && (
          <p className="text-sm text-destructive">{errors.skill_level.message}</p>
        )}
      </div>
    </div>
  );
};
