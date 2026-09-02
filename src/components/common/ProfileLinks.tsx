import { Globe } from "lucide-react";

import type { SocialPlatform } from "@/lib/socialLinks";
import { SOCIAL_PLATFORM_ICONS } from "@/lib/socialPlatformIcons";
import type { SocialLinkOut } from "@/types/socialLink";

/**
 * The one way a public profile shows its links (WY-77).
 *
 * There used to be two. The studio page rendered `SocialLinksRow` — bare 20px icons with no
 * text, tucked into the hero under the address — and the instructor profile rendered
 * `InstructorSocialLinksSection`, a two-column grid of bordered cards with a 44px icon chip.
 * Same data, same question, two answers, and neither was right once these stopped being
 * *social* links: a studio's own website is not something anyone recognises from a glyph, and
 * it does not deserve a card the size of a contact block either.
 *
 * Chips sit between the two. The icon still does the recognising for Instagram and Facebook,
 * and the label carries the ones no icon can — which, for a custom link, is the domain the
 * backend already put in `label`.
 *
 * **Renders nothing when there are no links.** Both predecessors did, and a heading over an
 * empty row is worse than no section at all — so callers must guard their own heading too.
 *
 * ⚠ **This is the chips only, not the section.** The two profiles have genuinely different
 * section chrome — the studio page uses a plain `h2`, the instructor profile an icon-led
 * `SectionHeading` — and it is that way throughout both pages, not just here. Forcing one
 * shared wrapper would make the links read as imported from another site on whichever page
 * lost. What has to be identical is the links; where each page puts its own heading is the
 * page's business.
 */
export function ProfileLinks({ links }: { links?: SocialLinkOut[] | null }) {
  if (!links || links.length === 0) return null;

  const sorted = [...links].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((link) => {
        const Icon = SOCIAL_PLATFORM_ICONS[link.platform as SocialPlatform] ?? Globe;
        // `label` is never empty: the backend fills it with the platform's name, or — for a
        // custom link — the domain (`services/social_links.py`). Preferring it over a
        // hardcoded platform map also means a studio that renamed a link ("Nasz Instagram")
        // gets what they typed, which the old card grid silently discarded.
        const label = link.label || "Strona internetowa";
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            // The handle is not drawn — it is usually a repeat of the profile name and would
            // double the width of every chip — but it is the one thing that distinguishes two
            // links to the same platform, so it goes to screen readers.
            aria-label={link.handle ? `${label} — ${link.handle}` : label}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#EBEBEB] bg-white px-3.5 py-2 text-sm font-medium text-[#222222] transition-colors hover:bg-[#FAFAFA]"
          >
            <Icon className="h-4 w-4 shrink-0 text-[#717171]" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </a>
        );
      })}
    </div>
  );
}
