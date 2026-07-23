import { Globe } from "lucide-react";

import type { SocialPlatform } from "@/lib/socialLinks";
import { SOCIAL_PLATFORM_ICONS } from "@/lib/socialPlatformIcons";
import type { SocialLinkOut } from "@/types/socialLink";

/** Public icon row: one icon per link, `position` order, accessible name from
 * handle/label, opens in a new tab. Renders nothing when there are no links — no empty
 * row, no placeholder (T09). Used on both the studio page and instructor profile. */
export function SocialLinksRow({
  links,
  className,
}: {
  links?: SocialLinkOut[] | null;
  className?: string;
}) {
  if (!links || links.length === 0) return null;

  const sorted = [...links].sort((a, b) => a.position - b.position);

  return (
    <div className={className ?? "mt-3 flex items-center gap-3"}>
      {sorted.map((link) => {
        const Icon = SOCIAL_PLATFORM_ICONS[link.platform as SocialPlatform] ?? Globe;
        const accessibleName = link.handle || link.label;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={accessibleName}
            className="text-gray-500 transition-colors hover:text-gray-900"
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}
