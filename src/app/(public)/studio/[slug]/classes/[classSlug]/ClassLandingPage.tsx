"use client";

import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flower2,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { EventLocation } from "@/app/(public)/retreats/[slug]/components/EventLocation";
import type { LocationDetail } from "@/app/(public)/retreats/[slug]/types";
import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";
import type { StudioPublic } from "@/types/studio";

import { type ClassTemplateDetail, levelLabel } from "../types";

interface ClassLandingPageProps {
  studio: StudioPublic;
  classTemplate: ClassTemplateDetail;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function googleMapsUrl(address?: string | null) {
  if (!address) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm"
      aria-label="Wróć"
    >
      <ChevronLeft className="h-5 w-5" />
    </Link>
  );
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
          <BackButton href={backHref} />
        </div>
      ) : (
        <div className="flex items-center justify-center bg-[#f4efe8] px-4 pb-8 pt-14">
          <BackButton href={backHref} />
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
        <div className="space-y-3">
          {classTemplate.instructors.map((instructor) => {
            const row = (
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {instructor.image_id ? (
                    <WyImage
                      src={instructor.image_id}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-500">
                      {initials(instructor.name)}
                    </div>
                  )}
                </div>
                <p className="min-w-0 flex-1 truncate font-semibold text-[#222222]">
                  {instructor.name}
                </p>
                {instructor.slug && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />}
              </div>
            );
            return instructor.slug ? (
              <Link key={instructor.id} href={`/instruktor/${instructor.slug}`}>
                {row}
              </Link>
            ) : (
              <div key={instructor.id}>{row}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StudioCardSection({ studio }: { studio: StudioPublic }) {
  return (
    <section className="border-b px-4 py-5">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-3 text-[18px] font-semibold text-[#222222]">Studio</h2>
        <Link href={`/studio/${studio.slug}`} className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
            {studio.image_id ? (
              <WyImage src={studio.image_id} alt={studio.name} fill className="object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
            )}
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

  if (!studio.address && !hasLatLng) return null;

  const mapsHref = googleMapsUrl(studio.address);

  if (hasLatLng) {
    const locationDetail: LocationDetail = {
      id: "",
      title: studio.name,
      address_line1: studio.address || location?.address_line1 || null,
      address_line2: null,
      city: location?.city || null,
      state_province: null,
      postal_code: null,
      country: null,
      latitude: location!.latitude!,
      longitude: location!.longitude!,
      google_place_id: null,
    };
    return (
      <section className="px-4 py-5">
        <div className="mx-auto max-w-5xl">
          <EventLocation location={locationDetail} title={studio.name} googleMapsHref={mapsHref} />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-5">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-3 text-[18px] font-semibold text-[#222222]">Lokalizacja</h2>
        <p className="mb-4 text-sm text-[#717171]">{studio.address}</p>
        <Button asChild variant="outline" className="w-full">
          <a href={mapsHref} target="_blank" rel="noopener noreferrer">
            <Navigation className="mr-2 h-4 w-4" />
            Nawiguj w Google Maps
          </a>
        </Button>
      </div>
    </section>
  );
}

export function ClassLandingPage({ studio, classTemplate }: ClassLandingPageProps) {
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

      <InstructorsSection classTemplate={classTemplate} />
      <StudioCardSection studio={studio} />
      <ClassLocationSection studio={studio} />

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white shadow-[0_-4px_16px_0_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-[#222222]">
            <Clock className="h-4 w-4" />
            {classTemplate.duration_minutes} min
          </div>
          <Button asChild variant="cta" size="cta" className="shrink-0">
            <Link href={`/studio/${studio.slug}/grafik?class=${classTemplate.slug}`}>
              Zapisz się na zajęcia
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
