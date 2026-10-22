"use client";

import { ChevronRight, ImageIcon } from "lucide-react";
import { useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import { COLOR_SWATCH_MAP } from "@/lib/classColors";
import { stripHtml } from "@/lib/plainText";
import { cn } from "@/lib/utils";

import type { ClassTemplate } from "../types";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "początkujący",
  intermediate: "średni",
  advanced: "zaawansowany",
  all_levels: "wszystkie poziomy",
};

/** Content only: the caller owns the row's link or selection button. */
export function TemplateRowContent({
  template,
  showMissingDefaults = false,
}: {
  template: ClassTemplate;
  showMissingDefaults?: boolean;
}) {
  const imageId = template.image_ids?.[0];
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const description = stripHtml(template.description);
  const missing = showMissingDefaults ? "— brak —" : null;
  const metadata = [
    `${template.duration_minutes} min`,
    (template.level && LEVEL_LABELS[template.level]) || missing,
    template.style || missing,
    template.default_capacity != null ? `limit ${template.default_capacity}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400">
        {imageId && failedImage !== imageId ? (
          <WyImage
            src={imageId}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
            onError={() => setFailedImage(imageId)}
          />
        ) : (
          <ImageIcon className="h-6 w-6" aria-hidden="true" />
        )}
      </div>
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
          {metadata}
        </p>
        {description && (
          <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-gray-500">
            {description}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 self-center text-gray-400" aria-hidden="true" />
    </>
  );
}
