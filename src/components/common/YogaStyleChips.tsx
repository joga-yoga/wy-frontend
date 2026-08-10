"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type { YogaStyle } from "@/types/instructor";

/** The `/yoga-styles` catalog. Shared so a screen rendering both chips and a
 *  name lookup (the instructor editor) fetches it once. */
export function useYogaStyleCatalog(): YogaStyle[] {
  const [catalog, setCatalog] = useState<YogaStyle[]>([]);

  useEffect(() => {
    axiosInstance
      .get<YogaStyle[]>("/yoga-styles")
      .then(({ data }) => setCatalog(data ?? []))
      .catch(() => {});
  }, []);

  return catalog;
}

type SelectionProps =
  | {
      /** One style or none. Tapping the selected chip clears it. */
      mode: "single";
      value: string | null;
      onChange: (styleId: string | null) => void;
    }
  | {
      mode: "multi";
      value: string[];
      onChange: (styleIds: string[]) => void;
    };

type YogaStyleChipsProps = SelectionProps & {
  /** Pass an already-fetched catalog to avoid a second request. */
  catalog?: YogaStyle[];
  className?: string;
};

/**
 * The yoga-style chip grid, shared by the instructor profile editor (multi-select,
 * with its own description cards around it) and the class-template editor
 * (single-select). Extracted so the two surfaces cannot drift apart visually.
 */
export function YogaStyleChips({ catalog, className, ...selection }: YogaStyleChipsProps) {
  const fetched = useYogaStyleCatalog();
  const styles = catalog ?? fetched;

  const selectedIds =
    selection.mode === "single" ? (selection.value ? [selection.value] : []) : selection.value;

  const toggle = (style: YogaStyle) => {
    if (selection.mode === "single") {
      selection.onChange(selection.value === style.id ? null : style.id);
      return;
    }
    selection.onChange(
      selection.value.includes(style.id)
        ? selection.value.filter((id) => id !== style.id)
        : [...selection.value, style.id],
    );
  };

  if (styles.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {styles.map((style) => {
        const isSelected = selectedIds.includes(style.id);
        return (
          <Badge
            key={style.id}
            variant={isSelected ? "default" : "outline"}
            // The outline variant's border is brand green, which on a grid of
            // *unselected* chips reads as "all selected". R5 draws unselected chips in a
            // neutral outline and only the chosen ones solid.
            className={cn(
              "cursor-pointer",
              !isSelected && "border-gray-200 text-gray-600 hover:bg-gray-50",
            )}
            onClick={() => toggle(style)}
          >
            {style.name}
          </Badge>
        );
      })}
    </div>
  );
}
