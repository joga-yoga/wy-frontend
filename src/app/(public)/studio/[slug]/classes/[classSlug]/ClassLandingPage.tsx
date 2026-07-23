"use client";

import { BarChart3, ChevronRight, Clock, Flower2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SessionCard } from "@/app/(public)/studio/[slug]/schedule/components/SessionCard";
import { SessionDetailDrawer } from "@/app/(public)/studio/[slug]/schedule/SessionDetailDrawer";
import type { PublicSchedulePreviewResponse } from "@/app/(public)/studio/[slug]/schedule/types";
import { BackButton } from "@/components/common/BackButton";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { InstructorList } from "@/components/common/InstructorList";
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { WyImage } from "@/components/custom/WyImage";
import {
  formatSneakDayHeader,
  formatWarsawDateShort,
  groupOccurrencesByDay,
} from "@/components/page-contents/studio/scheduleSneakUtils";
import { Button } from "@/components/ui/button";
import type { StudioPublic } from "@/types/studio";

import { type ClassTemplateDetail, levelLabel } from "../types";

interface ClassLandingPageProps {
  studio: StudioPublic;
  classTemplate: ClassTemplateDetail;
  initialUpcomingOccurrences?: PublicSchedulePreviewResponse | null;
}

function QuickFactsChips({ classTemplate }: { classTemplate: ClassTemplateDetail }) {
  const level = levelLabel(classTemplate.level);
  const chips: { icon: React.ReactNode; label: string }[] = [];
  if (classTemplate.duration_minutes) {
    chips.push({
      icon: <Clock className="h-3.5 w-3.5" />,
      label: `${classTemplate.duration_minutes} min`,
    });
  }
  if (level) {
    chips.push({ icon: <BarChart3 className="h-3.5 w-3.5" />, label: level });
  }
  if (classTemplate.style) {
    chips.push({ icon: <Flower2 className="h-3.5 w-3.5" />, label: classTemplate.style });
  }
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700"
        >
          {chip.icon}
          {chip.label}
        </span>
      ))}
    </div>
  );
}

function Header({
  studio,
  classTemplate,
}: {
  studio: StudioPublic;
  classTemplate: ClassTemplateDetail;
}) {
  const coverImage = classTemplate.image_ids?.[0];
  const searchParams = useSearchParams();
  const backHref =
    searchParams.get("back") === "studio"
      ? `/studio/${studio.slug}`
      : `/studio/${studio.slug}/zajecia`;

  return (
    <>
      {coverImage ? (
        <div className="relative aspect-[4/4] w-full overflow-hidden md:aspect-[21/9]">
          <WyImage
            src={coverImage}
            alt={classTemplate.title}
            fill
            className="object-cover"
            sizes="100vw"
          />
          <BackButton href={backHref} className="fixed left-4 top-4 z-50" />
        </div>
      ) : (
        <div className="flex items-center justify-center bg-[#f4efe8] px-4 pb-8 pt-14">
          <BackButton href={backHref} className="fixed left-4 top-4 z-50" />
          <Flower2 className="h-14 w-14 text-[#c9b596]" />
        </div>
      )}
      <div className="border-b bg-white px-4 py-4">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Zajęcia</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
            {classTemplate.title}
          </h1>
          <div className="mt-3">
            <QuickFactsChips classTemplate={classTemplate} />
          </div>
        </div>
      </div>
    </>
  );
}

function InstructorsSection({ classTemplate }: { classTemplate: ClassTemplateDetail }) {
  if (classTemplate.instructors.length === 0) return null;

  return (
    <section className="border-b px-4 py-5">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-3 text-[18px] font-semibold text-[#222222]">Instruktorzy</h2>
        <InstructorList instructors={classTemplate.instructors} />
      </div>
    </section>
  );
}

function NajblizszeZajeciaSection({ preview }: { preview?: PublicSchedulePreviewResponse | null }) {
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);

  // Mirrors StudioSchedulePage's/StudioScheduleSneak's pathname-reset effect: Next.js's
  // client router cache can keep this component instance (and its state) alive across an
  // away-and-back navigation, so a stale selectedOccurrenceId could reopen the drawer with
  // data from a previous visit.
  const pathname = usePathname();
  const isFirstPathnameEffect = useRef(true);
  useEffect(() => {
    if (isFirstPathnameEffect.current) {
      isFirstPathnameEffect.current = false;
      return;
    }
    setSelectedOccurrenceId(null);
  }, [pathname]);

  const occurrences = preview?.occurrences ?? [];
  if (occurrences.length === 0) return null;

  const groups = groupOccurrencesByDay(occurrences);
  const todayStr = formatWarsawDateShort(new Date());

  return (
    <section className="border-b px-4 py-5">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Najbliższe zajęcia</h2>
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.date}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {formatSneakDayHeader(group.date, todayStr)}
              </p>
              <div className="space-y-2">
                {group.occurrences.map((occ) => (
                  <SessionCard
                    key={occ.id}
                    occ={occ}
                    onClick={(clicked) => setSelectedOccurrenceId(clicked.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SessionDetailDrawer
        occurrenceId={selectedOccurrenceId}
        onClose={() => setSelectedOccurrenceId(null)}
      />
    </section>
  );
}

function StudioCardSection({ studio }: { studio: StudioPublic }) {
  return (
    <section className="border-b px-4 py-5">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-3 text-[18px] font-semibold text-[#222222]">Studio</h2>
        <Link href={`/studio/${studio.slug}`} className="flex items-center gap-3">
          <div className="w-12 shrink-0 overflow-hidden rounded-xl">
            <HashedAvatar
              seed={studio.id}
              name={studio.name}
              imageId={studio.image_id}
              size={48}
              imageFit="contain"
              className="rounded-none bg-white"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[#222222]">{studio.name}</p>
            {studio.address && (
              <p className="mt-0.5 truncate text-xs text-[#717171]">{studio.address}</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
        </Link>
      </div>
    </section>
  );
}

function ClassLocationSection({ studio }: { studio: StudioPublic }) {
  const location = studio.location;
  const hasLatLng = location?.latitude != null && location?.longitude != null;

  if (!studio.address && !location?.address_line1 && !hasLatLng) return null;

  const publicLocation = {
    title: location?.title ?? studio.name,
    address: studio.address,
    address_line1: location?.address_line1,
    city: location?.city,
    latitude: location?.latitude,
    longitude: location?.longitude,
  };

  return (
    <section className="px-4 py-5">
      <div className="mx-auto max-w-5xl">
        <PublicLocation location={publicLocation} title={studio.name} />
      </div>
    </section>
  );
}

export function ClassLandingPage({
  studio,
  classTemplate,
  initialUpcomingOccurrences,
}: ClassLandingPageProps) {
  return (
    <div className="min-h-screen bg-white pb-24">
      <Header studio={studio} classTemplate={classTemplate} />

      {classTemplate.description && (
        <section className="border-b px-4 py-5">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-3 text-[18px] font-semibold text-[#222222]">Opis</h2>
            <div className="whitespace-pre-line text-base leading-[1.65] text-[#222222]">
              {classTemplate.description}
            </div>
          </div>
        </section>
      )}

      <NajblizszeZajeciaSection preview={initialUpcomingOccurrences} />

      <InstructorsSection classTemplate={classTemplate} />
      <StudioCardSection studio={studio} />
      <ClassLocationSection studio={studio} />

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white shadow-[0_-4px_16px_0_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-5xl items-center justify-end px-4 py-3">
          <Button asChild variant="cta" size="cta" className="w-full">
            <Link href={`/studio/${studio.slug}/grafik?class=${classTemplate.slug}`}>
              Zapisz się na zajęcia
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
