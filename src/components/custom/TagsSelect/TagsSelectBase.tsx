"use client";

import { cn } from "@/lib/utils";

import { PREDEFINED_TAGS } from "./TagsSection.types";

interface TagsSelectBaseProps {
  selectedTags: string[];
  onToggle: (tagId: string) => void;
  className?: string;
}

export const TagsSelectBase = ({ selectedTags, onToggle, className }: TagsSelectBaseProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-3">
        {PREDEFINED_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          const Icon = tag.icon;

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id)}
              className={cn(
                "flex items-center justify-center gap-3 rounded-full border-1 px-4 py-2 transition-all duration-200 hover:scale-105",
                isSelected
                  ? "border-brand-green bg-white"
                  : "border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 md:h-8 md:w-8 flex-shrink-0",
                  isSelected ? "text-brand-green" : "text-gray-600",
                )}
              />
              <span className={cn("text-md md:text-lg whitespace-nowrap text-gray-700")}>
                {tag.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
