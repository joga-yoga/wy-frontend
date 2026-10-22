"use client";

import { Control, Controller, FieldErrors } from "react-hook-form";

import { PREDEFINED_TAGS } from "@/components/custom/TagsSelect";
import { SelectionChip } from "@/components/ui/selection-chip";
import { EventFormData } from "@/lib/schemas/event";

interface TagsSelectProps {
  control: Control<EventFormData>;
  errors?: FieldErrors<EventFormData>;
}

export const TagsSelect = ({ control, errors }: TagsSelectProps) => {
  return (
    <Controller
      name="tags"
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag) => {
              const isSelected = field.value?.includes(tag.id);
              const Icon = tag.icon;

              return (
                <SelectionChip
                  key={tag.id}
                  selected={Boolean(isSelected)}
                  icon={<Icon />}
                  onClick={() => {
                    const currentTags = field.value || [];
                    if (isSelected) {
                      field.onChange(currentTags.filter((t) => t !== tag.id));
                    } else {
                      field.onChange([...currentTags, tag.id]);
                    }
                  }}
                >
                  {tag.label}
                </SelectionChip>
              );
            })}
          </div>
          {fieldState.error && (
            <p className="text-sm text-b2b-red-solid">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
};
