"use client";

import { Control, Controller, FieldErrors } from "react-hook-form";

import { EventFormData } from "@/lib/schemas/event";

import { PREDEFINED_TAGS } from "./TagsSection.types";
import { TagsSelectBase } from "./TagsSelectBase";

interface TagsSelectProps {
  control: Control<EventFormData>;
  errors?: FieldErrors<EventFormData>;
}

export const TagsSelect = ({ control, errors }: TagsSelectProps) => {
  const validTagIds = new Set(PREDEFINED_TAGS.map((tag) => tag.id));

  return (
    <Controller
      name="tags"
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <TagsSelectBase
            selectedTags={((field.value as string[]) || []).filter((tagId) =>
              validTagIds.has(tagId),
            )}
            onToggle={(tagId) => {
              const currentTags = ((field.value as string[]) || []).filter((currentTagId) =>
                validTagIds.has(currentTagId),
              );

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
