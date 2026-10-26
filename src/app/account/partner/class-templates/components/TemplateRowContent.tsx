"use client";

import { ChevronRight } from "lucide-react";

import { COLOR_SWATCH_MAP } from "@/lib/classColors";
import { cn } from "@/lib/utils";

import type { ClassTemplate } from "../types";

/** Template defaults only: an occurrence's substitute never changes this catalogue. */
export function TemplateRowContent({
  template,
  instructorName,
  instructorsLoading = false,
  instructorsError = false,
}: {
  template: ClassTemplate;
  instructorName?: string;
  instructorsLoading?: boolean;
  instructorsError?: boolean;
}) {
  const instructorLabel = !template.default_instructor_id
    ? "Prowadzący nie został jeszcze wybrany"
    : instructorName ||
      (instructorsLoading
        ? "Ładowanie prowadzącego…"
        : instructorsError
          ? "Nie udało się wczytać prowadzącego"
          : "Prowadzący niedostępny");

  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="break-words text-base font-semibold leading-6 text-gray-900">
          {template.title}
        </p>
        <p className="mt-1 break-words text-sm leading-5 text-gray-500">
          {template.color && (
            <span
              aria-hidden="true"
              className={cn(
                "mr-1.5 inline-block h-2 w-2 rounded-full",
                COLOR_SWATCH_MAP[template.color],
              )}
            />
          )}
          {template.duration_minutes} min · {instructorLabel}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 self-center text-gray-400" aria-hidden="true" />
    </>
  );
}
