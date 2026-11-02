"use client";

import { SelectionChip } from "@/components/ui/selection-chip";
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
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          const Icon = tag.icon;

          return (
            <SelectionChip
              key={tag.id}
              selected={isSelected}
              icon={<Icon />}
              onClick={() => onToggle(tag.id)}
            >
              {tag.label}
            </SelectionChip>
          );
        })}
      </div>
    </div>
  );
};
