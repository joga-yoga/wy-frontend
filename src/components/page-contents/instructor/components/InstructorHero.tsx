"use client";

import { Award, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { WyImage } from "@/components/custom/WyImage";

import { getInitials } from "./helpers";
import type { InstructorProfileViewModel } from "./viewModel";

type InstructorHeroProps = {
  hero: InstructorProfileViewModel["hero"];
};

export function InstructorHero({ hero }: InstructorHeroProps) {
  const initials = getInitials(hero.name);
  const primaryCertificate = hero.certificates[0];
  const primaryLocation = hero.locations[0];

  return (
    <section className="px-4 pb-7 pt-6 md:px-8 md:pb-10 md:pt-10">
      <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-x-5 gap-y-5 md:grid-cols-[190px_minmax(0,1fr)] md:gap-x-10">
        <div className="min-w-0">
          <div className="relative h-[150px] w-[150px] overflow-hidden rounded-full bg-[#FEF3C7] md:h-[190px] md:w-[190px]">
            {hero.imageId ? (
              <WyImage
                src={hero.imageId}
                alt={hero.name}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 190px, 150px"
                priority
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[42px] font-semibold text-[#92400E]">
                {initials}
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center md:max-w-[620px]">
          <h1 className="text-[30px] font-semibold leading-[32px] text-[#222222] md:text-[42px] md:leading-[44px]">
            {hero.name}
          </h1>

          {hero.shortBio && (
            <p className="mt-2 text-[15px] font-medium leading-[18px] text-[#717171] md:max-w-[540px] md:text-[18px] md:leading-[24px]">
              {hero.shortBio}
            </p>
          )}

          <div className="mt-5 space-y-2 md:mt-6">
            <MetadataBadge icon={<Award className="h-4 w-4" />} value={primaryCertificate} />
            <MetadataBadge icon={<MapPin className="h-4 w-4" />} value={primaryLocation} />
          </div>
        </div>

        {hero.yogaStyles.length > 0 && (
          <div className="col-span-2 flex flex-wrap gap-2 pt-1 md:pt-2">
            {hero.yogaStyles.map((style) => (
              <span
                key={style.id}
                className="rounded-full border border-[#D9D9D9] bg-transparent px-3 py-1 text-[13px] font-medium leading-5 text-[#444444] md:text-[14px]"
              >
                {style.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MetadataBadge({ icon, value }: { icon: ReactNode; value: string | undefined }) {
  const label = value?.trim();
  if (!label) return null;

  return (
    <div className="flex min-w-0 items-center gap-2 px-0 py-2 text-[#717171]">
      <span className="shrink-0 text-[#717171]">{icon}</span>
      <span className="min-w-0 truncate text-[14px] font-medium leading-5" title={label}>
        {label}
      </span>
    </div>
  );
}
