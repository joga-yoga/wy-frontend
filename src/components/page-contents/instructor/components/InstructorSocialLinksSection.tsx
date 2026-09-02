import { Share2 } from "lucide-react";

import { ProfileLinks } from "@/components/common/ProfileLinks";
import type { SocialLinkOut } from "@/types/socialLink";

import { SectionHeading } from "./InstructorInfoSections";

/**
 * The instructor profile's links section.
 *
 * Reduced to this page's section chrome — heading, spacing, anchor — with the links themselves
 * drawn by the shared `ProfileLinks` (WY-77). It used to own a two-column grid of bordered
 * cards and a private `PLATFORM_LABELS` map; the studio page meanwhile drew bare icons in its
 * hero. Same data, two answers. The map is gone too: `SocialLinkOut.label` already carries the
 * platform's name — or, for a custom link, its domain — and honours a label the instructor
 * chose themselves, which the map overrode.
 */
export function InstructorSocialLinksSection({ links }: { links: SocialLinkOut[] }) {
  if (links.length === 0) return null;

  return (
    <section
      id="social"
      className="scroll-mt-16 px-4 py-7 md:px-8 md:py-10"
      aria-labelledby="instructor-social-title"
    >
      <SectionHeading
        id="instructor-social-title"
        icon={<Share2 className="h-5 w-5" aria-hidden="true" />}
      >
        Znajdziesz mnie też tutaj
      </SectionHeading>

      <div className="mt-4">
        <ProfileLinks links={links} />
      </div>
    </section>
  );
}
