import { ChevronRight } from "lucide-react";

import { DetailPageLink } from "@/components/navigation/DetailPageLink";

import { HashedAvatar } from "./HashedAvatar";

export interface InstructorRowData {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
  short_bio?: string | null;
}

/** Shared instructor row: 56px avatar (photo or id-hashed color fallback), 17px name,
 * optional 2-line-clamped 14.5px bio, trailing chevron. Whole row is the tap target,
 * navigating to `/instruktor/[slug]` when a slug is present (T07). */
export function InstructorRow({ instructor }: { instructor: InstructorRowData }) {
  const href = instructor.slug ? `/instruktor/${instructor.slug}` : null;

  const row = (
    <div className="flex items-center gap-3">
      <HashedAvatar
        seed={instructor.id}
        name={instructor.name}
        imageId={instructor.image_id}
        size={56}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold leading-tight text-[#222222]">{instructor.name}</p>
        {instructor.short_bio && (
          <p className="mt-0.5 line-clamp-2 text-[14.5px] leading-snug text-[#717171]">
            {instructor.short_bio}
          </p>
        )}
      </div>
      {href && <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />}
    </div>
  );

  return href ? <DetailPageLink href={href}>{row}</DetailPageLink> : row;
}
