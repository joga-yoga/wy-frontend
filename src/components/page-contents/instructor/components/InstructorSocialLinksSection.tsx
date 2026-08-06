import { ExternalLink, Globe, Share2 } from "lucide-react";

import type { SocialPlatform } from "@/lib/socialLinks";
import { SOCIAL_PLATFORM_ICONS } from "@/lib/socialPlatformIcons";
import type { SocialLinkOut } from "@/types/socialLink";

import { SectionHeading } from "./InstructorInfoSections";

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  threads: "Threads",
  custom: "Strona internetowa",
};

export function InstructorSocialLinksSection({ links }: { links: SocialLinkOut[] }) {
  if (links.length === 0) return null;

  const sorted = [...links].sort((a, b) => a.position - b.position);

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

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {sorted.map((link) => {
          const Icon = SOCIAL_PLATFORM_ICONS[link.platform as SocialPlatform] ?? Globe;
          const platformLabel = PLATFORM_LABELS[link.platform as SocialPlatform] ?? link.label;

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-3 rounded-2xl border border-[#EBEBEB] bg-white p-4 transition-colors hover:bg-[#FAFAFA]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1F1F1] text-[#444444]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-5 text-[#222222]">
                  {platformLabel}
                </p>
                {link.handle && (
                  <p className="mt-0.5 truncate text-[13px] text-[#717171]">{link.handle}</p>
                )}
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
