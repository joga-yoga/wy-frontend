"use client";

import { Control, Controller, FieldErrors } from "react-hook-form";

import { EventFormData } from "@/lib/schemas/event";

import { TagsSelectBase } from "./TagsSelectBase";

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
        <div>
          <TagsSelectBase
            selectedTags={(field.value as string[]) || []}
            onToggle={(tagId) => {
              const currentTags = (field.value as string[]) || [];
              if (currentTags.includes(tagId)) {
                field.onChange(currentTags.filter((t) => t !== tagId));
              } else {
                field.onChange([...currentTags, tagId]);
              }
            }}
          />
          {fieldState.error && (
            <p className="text-sm text-red-500 mt-2">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
};
