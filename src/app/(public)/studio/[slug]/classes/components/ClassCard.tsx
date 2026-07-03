import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { WyImage } from "@/components/custom/WyImage";
import { cn } from "@/lib/utils";

import { type ClassTemplateSummary, formatClassMetaLine } from "../types";

interface ClassCardProps {
  studioSlug: string;
  item: ClassTemplateSummary;
  variant?: "list" | "compact";
  className?: string;
  /** Where the class detail page's back button should return to. Defaults to the classes list. */
  backTo?: "studio";
}

export function ClassCard({
  studioSlug,
  item,
  variant = "list",
  className,
  backTo,
}: ClassCardProps) {
  const isCompact = variant === "compact";
  const coverImage = item.image_ids?.[0];
  const metaLine = formatClassMetaLine(item);
  const thumbSize = isCompact ? "h-[72px] w-[72px]" : "h-24 w-24";

  return (
    <Link
      href={`/studio/${studioSlug}/classes/${item.slug}${backTo ? `?back=${backTo}` : ""}`}
      className={cn("flex items-center gap-3 py-3 text-left", className)}
    >
      <div className={cn("relative shrink-0 overflow-hidden rounded-lg", thumbSize)}>
        {coverImage ? (
          <WyImage src={coverImage} alt={item.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#f4efe8]">
            <Sparkles className="h-6 w-6 text-[#b9a488]" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
        {metaLine && <p className="mt-0.5 truncate text-xs text-gray-500">{metaLine}</p>}
        {!isCompact && item.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.description}</p>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
    </Link>
  );
}
