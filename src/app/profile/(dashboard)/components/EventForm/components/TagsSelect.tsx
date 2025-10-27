"use client";

import { Control, Controller, FieldErrors } from "react-hook-form";

import { EventFormData } from "@/lib/schemas/event";
import { cn } from "@/lib/utils";

import { PREDEFINED_TAGS } from "../../../../../../components/custom/TagsSelect/TagsSection.types";

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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2">
            {PREDEFINED_TAGS.map((tag) => {
              const isSelected = field.value?.includes(tag.id);
              const Icon = tag.icon;

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    const currentTags = field.value || [];
                    if (isSelected) {
                      field.onChange(currentTags.filter((t) => t !== tag.id));
                    } else {
                      field.onChange([...currentTags, tag.id]);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center gap-3 rounded-full border-2 px-4 py-2 transition-all duration-200 hover:scale-105",
                    isSelected
                      ? "border-[#2CBF5E] bg-white"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isSelected ? "text-[#2CBF5E]" : "text-gray-600",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium whitespace-nowrap",
                      isSelected ? "text-[#2CBF5E]" : "text-gray-700",
                    )}
                  >
                    {tag.label}
                  </span>
                </button>
              );
            })}
          </div>
          {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
};
