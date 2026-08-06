import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { WyImage } from "@/components/custom/WyImage";
import { cn } from "@/lib/utils";

import { type ClassTemplateSummary, formatClassMetaLine } from "../types";

interface ClassCardProps {
  studioSlug: string;
  item: ClassTemplateSummary;
  className?: string;
  /** Where the class detail page's back button should return to. Defaults to the classes list. */
  backTo?: "studio";
  /** Studio-page preview hides the description; the /zajecia index shows it. */
  hideDescription?: boolean;
  /** Studio attribution line, for aggregated multi-studio contexts (e.g. an instructor's
   * classes list) where the studio isn't already implied by the surrounding page. Omitted
   * on studio-owned pages, where it would be redundant. */
  studioName?: string;
}

export function ClassCard({
  studioSlug,
  item,
  className,
  backTo,
  hideDescription = false,
  studioName,
}: ClassCardProps) {
  const coverImage = item.image_ids?.[0];
  const metaLine = formatClassMetaLine(item);

  return (
    <Link
      href={`/studio/${studioSlug}/zajecia/${item.slug}${backTo ? `?back=${backTo}` : ""}`}
      className={cn("flex items-start gap-3 py-3 text-left", className)}
    >
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg">
        {coverImage ? (
          <WyImage src={coverImage} alt={item.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#f4efe8]">
            <Sparkles className="h-6 w-6 text-[#b9a488]" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-semibold text-gray-900">{item.title}</p>
        {metaLine && <p className="mt-0.5 truncate text-[15px] text-gray-500">{metaLine}</p>}
        {studioName && <p className="mt-0.5 truncate text-[13px] text-gray-400">{studioName}</p>}
        {!hideDescription && item.description && (
          <p className="mt-1 line-clamp-2 text-[15px] leading-[1.45] text-gray-500">
            {item.description}
          </p>
        )}
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 self-center text-gray-500" />
    </Link>
  );
}
