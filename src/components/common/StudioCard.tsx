import { ChevronRight } from "lucide-react";

import { HashedAvatar } from "@/components/common/HashedAvatar";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import { cn } from "@/lib/utils";

export interface StudioCardData {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
  address?: string | null;
}

/** Shared studio row/card: 48px logo (photo, cover-fit on white, or id-hashed color
 * fallback), name, optional address, trailing chevron. Whole row is the tap target,
 * navigating to `/studio/[slug]` when a slug is present. */
export function StudioCard({ studio }: { studio: StudioCardData }) {
  const href = studio.slug ? `/studio/${studio.slug}` : null;

  const row = (
    <div className="flex items-center gap-3">
      <div className="w-12 shrink-0 overflow-hidden rounded-xl">
        <HashedAvatar
          seed={studio.id}
          name={studio.name}
          imageId={studio.image_id}
          size={48}
          imageFit="cover"
          // Keep the image background separate from the colored initials fallback.
          className={cn("rounded-none", studio.image_id && "bg-white")}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[#222222]">{studio.name}</p>
        {studio.address && (
          <p className="mt-0.5 truncate text-xs text-[#717171]">{studio.address}</p>
        )}
      </div>
      {href && <ChevronRight className="h-5 w-5 shrink-0 text-gray-500" />}
    </div>
  );

  return href ? <DetailPageLink href={href}>{row}</DetailPageLink> : row;
}
