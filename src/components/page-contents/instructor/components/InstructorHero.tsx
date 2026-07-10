"use client";

import { WyImage } from "@/components/custom/WyImage";

import { getInitials } from "./helpers";
import type { InstructorProfileViewModel } from "./viewModel";

type InstructorHeroProps = {
  hero: InstructorProfileViewModel["hero"];
};

export function InstructorHero({ hero }: InstructorHeroProps) {
  const initials = getInitials(hero.name);

  return (
    <section
      data-testid="instructor-hero"
      className="px-[18px] pb-3 pt-[18px] md:px-8 md:pb-6 md:pt-8"
    >
      <div
        data-testid="instructor-hero-card"
        className="grid w-full grid-cols-[130px_minmax(0,1fr)] gap-x-4 rounded-[22px] bg-white p-3 shadow-[0_18px_42px_rgba(0,0,0,0.08)] md:h-[260px] md:grid-cols-[196px_minmax(0,1fr)] md:gap-x-10 md:rounded-[30px] md:p-8"
      >
        <div className="flex items-center justify-center">
          <div
            data-testid="instructor-hero-avatar"
            className="relative h-[130px] w-[130px] overflow-hidden rounded-full bg-[#F7F7F7] md:h-[190px] md:w-[190px]"
          >
            {hero.imageId ? (
              <WyImage
                src={hero.imageId}
                alt={hero.name}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 190px, 130px"
                priority
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[36px] font-semibold text-[#92400E] md:text-[52px]">
                {initials}
              </span>
            )}
          </div>
        </div>

        <div
          data-testid="instructor-hero-info"
          className="flex min-h-0 min-w-0 flex-col justify-center md:max-w-[620px]"
        >
          <h1
            data-testid="instructor-hero-name"
            className="line-clamp-2 text-[24px] font-semibold leading-[30px] text-[#222222] md:text-[54px] md:leading-[58px]"
          >
            {hero.name}
          </h1>

          {hero.shortBio && (
            <p
              data-testid="instructor-hero-short-bio"
              className="mt-2 line-clamp-6 text-[12px] font-medium leading-[18px] text-[#717171] md:mt-5 md:max-w-[560px] md:text-[28px] md:leading-[34px]"
            >
              {hero.shortBio}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
