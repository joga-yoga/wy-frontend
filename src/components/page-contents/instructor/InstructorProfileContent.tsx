"use client";

import { type ReactNode, useState } from "react";

import type { InstructorPublicSchedulePreviewResponse } from "@/app/(public)/instructor/[slug]/schedule/types";
import type { StudioCardData } from "@/components/common/StudioCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { InstructorDetails } from "@/types/instructor";

import { CompletedItemsPreview } from "./components/CompletedItemsPreview";
import { InstructorClassesPreviewSection } from "./components/InstructorClassesPreviewSection";
import { InstructorContactDrawer } from "./components/InstructorContactDrawer";
import { InstructorEventSection } from "./components/InstructorEventSection";
import { InstructorHero } from "./components/InstructorHero";
import {
  AboutInstructor,
  InstructorCertificates,
  InstructorExperience,
  InstructorGallery,
  InstructorHighlights,
} from "./components/InstructorInfoSections";
import { InstructorScheduleSneak } from "./components/InstructorScheduleSneak";
import { InstructorSocialLinksSection } from "./components/InstructorSocialLinksSection";
import { InstructorStudiosSection } from "./components/InstructorStudiosSection";
import type { InstructorProfileSection, InstructorProfileViewModel } from "./components/viewModel";

export type InstructorBottomAction = {
  label: string;
  href: string;
  hideIcon?: boolean;
};

interface InstructorProfileContentProps {
  data: InstructorDetails;
  profile: InstructorProfileViewModel;
  notice?: ReactNode;
  bottomPrimaryAction?: InstructorBottomAction;
  /** Suppresses the default "Napisz do mnie" CTA and its contact dialog entirely
   * (e.g. unpublished/minimal profile with nobody to actually contact yet). */
  hideBottomAction?: boolean;
  sampleSections?: Partial<Record<InstructorProfileSection, true>>;
  /** Server-fetched "next 3 sessions" preview, mirroring the Studio profile's schedule
   * block — rendered as an initial prop, no client refetch. */
  schedulePreview?: InstructorPublicSchedulePreviewResponse | null;
  /** Studios the instructor is linked to / provides sessions at ("Gdzie mnie znajdziesz"). */
  studios?: StudioCardData[];
}

function ContentSeparator() {
  return <Separator className="w-auto" />;
}

function SampleDataMarker() {
  return (
    <div className="px-4 pt-4 md:px-8">
      <Badge variant="outline">Dane przykładowe</Badge>
    </div>
  );
}

export function InstructorProfileContent({
  data,
  profile,
  notice,
  bottomPrimaryAction,
  hideBottomAction = false,
  sampleSections = {},
  schedulePreview,
  studios = [],
}: InstructorProfileContentProps) {
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);

  const { instructor } = data;
  const hasAbout = Boolean(profile.bio);
  const hasRetreats = profile.retreats.length > 0;
  const hasWorkshops = profile.workshops.length > 0;
  const hasCompletedItems = profile.completedItems.length > 0;
  const hasExperience = profile.experienceItems.length > 0;
  const hasCertificates = profile.certificates.length > 0;
  const hasGallery = profile.galleryImageIds.length > 0;
  const hasSchedule = Boolean(schedulePreview?.occurrences?.length) && Boolean(instructor.slug);
  const hasSocialLinks = profile.hero.socialLinks.length > 0;

  const handlePrimaryAction = () => {
    if (bottomPrimaryAction) {
      window.location.href = bottomPrimaryAction.href;
      return;
    }

    setIsContactDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <div className="container-wy mx-auto">
        {sampleSections.hero && <SampleDataMarker />}
        <InstructorHero hero={profile.hero} />

        {profile.highlights.length > 0 && (
          <>
            {sampleSections.highlights && <SampleDataMarker />}
            <InstructorHighlights highlights={profile.highlights} />
          </>
        )}
        <ContentSeparator />

        {hasSchedule && (
          <>
            <InstructorScheduleSneak instructorSlug={instructor.slug!} preview={schedulePreview} />
            <ContentSeparator />
          </>
        )}

        {studios.length > 0 && (
          <>
            <InstructorStudiosSection studios={studios} />
            <ContentSeparator />
          </>
        )}

        {instructor.slug && <InstructorClassesPreviewSection instructorSlug={instructor.slug} />}

        {notice && (
          <>
            <div className="px-4 py-4 md:px-8">{notice}</div>
            <ContentSeparator />
          </>
        )}

        {hasRetreats && (
          <>
            {sampleSections.retreats && <SampleDataMarker />}
            <InstructorEventSection
              id="instructor-retreats-title"
              title="Wyjazdy"
              items={profile.retreats}
            />
            <ContentSeparator />
          </>
        )}

        {hasWorkshops && (
          <>
            {sampleSections.workshops && <SampleDataMarker />}
            <InstructorEventSection
              id="instructor-workshops-title"
              title="Wydarzenia"
              items={profile.workshops}
            />
            <ContentSeparator />
          </>
        )}

        {hasCompletedItems && (
          <>
            {sampleSections.completed && <SampleDataMarker />}
            <CompletedItemsPreview items={profile.completedItems} />
            <ContentSeparator />
          </>
        )}

        {hasAbout && (
          <>
            {sampleSections.about && <SampleDataMarker />}
            <AboutInstructor bio={profile.bio!} />
            <ContentSeparator />
          </>
        )}

        {hasExperience && (
          <>
            {sampleSections.experience && <SampleDataMarker />}
            <InstructorExperience items={profile.experienceItems} />
            <ContentSeparator />
          </>
        )}

        {hasCertificates && (
          <>
            {sampleSections.certificates && <SampleDataMarker />}
            <InstructorCertificates certificates={profile.certificates} />
            <ContentSeparator />
          </>
        )}
        {hasSocialLinks && (
          <>
            <InstructorSocialLinksSection links={profile.hero.socialLinks} />
            <ContentSeparator />
          </>
        )}

        {hasGallery && (
          <>
            {sampleSections.gallery && <SampleDataMarker />}
            <InstructorGallery imageIds={profile.galleryImageIds} />
          </>
        )}
      </div>

      {!hideBottomAction && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#EBEBEB] bg-white">
          <div className="container-wy mx-auto px-4 py-3">
            <button
              type="button"
              aria-label={bottomPrimaryAction?.label ?? `Napisz do: ${instructor.name}`}
              onClick={handlePrimaryAction}
              className="h-12 w-full items-center gap-3 rounded-xl px-4 text-md font-medium text-white transition-colors bg-gray-700 hover:bg-gray-800"
            >
              {bottomPrimaryAction?.label ?? "Napisz do mnie"}
            </button>
          </div>
        </div>
      )}

      {!bottomPrimaryAction && !hideBottomAction && (
        <InstructorContactDrawer
          open={isContactDrawerOpen}
          onClose={() => setIsContactDrawerOpen(false)}
          instructorId={instructor.id}
          instructorName={instructor.name}
        />
      )}
    </div>
  );
}
