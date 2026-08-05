"use client";

import { ArrowRight, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoPersonOutline } from "react-icons/io5";

import { ClassCard } from "@/app/(public)/studio/[slug]/classes/components/ClassCard";
import type { ClassTemplateListResponse } from "@/app/(public)/studio/[slug]/classes/types";
import { SessionCard } from "@/app/(public)/studio/[slug]/schedule/components/SessionCard";
import { SessionDetailDrawer } from "@/app/(public)/studio/[slug]/schedule/SessionDetailDrawer";
import type { PublicSchedulePreviewResponse } from "@/app/(public)/studio/[slug]/schedule/types";
import { HashedAvatar } from "@/components/common/HashedAvatar";
import { InstructorList } from "@/components/common/InstructorList";
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { SocialLinksRow } from "@/components/common/SocialLinksRow";
import { PhotoGallery } from "@/components/custom/PhotoGallery";
import { WyImage } from "@/components/custom/WyImage";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { amenityIcon } from "@/lib/amenityIcons";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type { StudioPublic } from "@/types/studio";

import { hasPassPricing, PassList } from "./PassList";
import {
  formatSneakDayHeader,
  formatWarsawDateShort,
  groupOccurrencesByDay,
} from "./scheduleSneakUtils";
import { SportCardList } from "./SportCardList";

interface StudioPageContentProps {
  studio: StudioPublic;
  initialSchedulePreview?: PublicSchedulePreviewResponse | null;
}

function StudioScheduleSneak({
  studioSlug,
  preview,
}: {
  studioSlug: string;
  preview?: PublicSchedulePreviewResponse | null;
}) {
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
  const occurrences = preview?.occurrences ?? [];
  const groups = groupOccurrencesByDay(occurrences);
  const todayStr = formatWarsawDateShort(new Date());

  // Mirrors StudioSchedulePage's pathname-reset effect: Next.js's client router cache can
  // keep this component instance (and its state) alive across an away-and-back navigation,
  // so a stale selectedOccurrenceId could reopen the drawer with data from a previous visit.
  const pathname = usePathname();
  const isFirstPathnameEffect = useRef(true);
  useEffect(() => {
    if (isFirstPathnameEffect.current) {
      isFirstPathnameEffect.current = false;
      return;
    }
    setSelectedOccurrenceId(null);
  }, [pathname]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Najbliższe zajęcia</h2>

      {groups.length > 0 && (
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
      )}

      <Link
        href={`/studio/${studioSlug}/grafik`}
        className={cn(
          buttonVariants({ variant: "muted" }),
          "relative mt-3 h-12 w-full rounded-xl grid grid-cols-[16px_1fr_16px] items-center gap-3 px-4!",
        )}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        <span className="text-center">Zobacz cały grafik</span>
        <ArrowRight className="h-4 w-4 shrink-0" />
      </Link>

      <SessionDetailDrawer
        occurrenceId={selectedOccurrenceId}
        onClose={() => setSelectedOccurrenceId(null)}
      />
    </section>
  );
}

function ZajeciaPreviewSection({ studioSlug }: { studioSlug: string }) {
  const [templates, setTemplates] = useState<ClassTemplateListResponse | null>(null);

  useEffect(() => {
    axiosInstance
      .get<ClassTemplateListResponse>(`/public/studios/${studioSlug}/class-templates`)
      .then((r) => setTemplates(r.data))
      .catch(() => setTemplates({ total: 0, items: [] }));
  }, [studioSlug]);

  if (!templates || templates.items.length === 0) return null;

  const preview = templates.items.slice(0, 3);

  return (
    <section className="mx-auto max-w-5xl px-4 py-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold text-[#222222]">Zajęcia</h2>
        <span className="text-sm text-[#717171]">{templates.total} rodzaje</span>
      </div>

      <div className="divide-y divide-gray-100">
        {preview.map((item) => (
          <ClassCard
            key={item.id}
            studioSlug={studioSlug}
            item={item}
            // hideDescription
            backTo="studio"
          />
        ))}
      </div>

      <Link
        href={`/studio/${studioSlug}/zajecia`}
        className={cn(buttonVariants({ variant: "muted" }), "relative mt-3 h-12 w-full rounded-xl")}
      >
        Zobacz wszystkie zajęcia
        <ArrowRight className="absolute right-4 h-4 w-4" />
      </Link>
    </section>
  );
}

function StudioHeader() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const accountHref = mounted && user ? "/account/partner" : "/account/login";

  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="relative flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span className="flex items-center text-xl font-semibold text-white drop-shadow-md">
            joga
            <span className="inline-block rounded-md bg-gray-900 pb-[3px] pl-[2px] pr-[5px] pt-[1px] leading-none">
              .yoga
            </span>
          </span>
        </Link>
        <Link href={accountHref} className="flex items-center">
          {user?.partner?.image_id ? (
            <WyImage
              src={user.partner.image_id}
              alt="Avatar"
              className="h-9 w-9 rounded-full object-cover ring-2 ring-white/100"
              width={128}
              height={128}
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
              <IoPersonOutline className="h-5 w-5" />
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}

function DescriptionBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight);
  }, [text]);

  return (
    <div className="mt-4">
      <p
        ref={ref}
        className={`text-base leading-[1.65] text-gray-700${!expanded ? " line-clamp-3" : ""}`}
      >
        {text}
      </p>
      {!expanded && isClamped && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-sm font-medium text-gray-500 underline underline-offset-2"
        >
          Czytaj dalej
        </button>
      )}
    </div>
  );
}

function HeroSection({ studio }: { studio: StudioPublic }) {
  const scrollToLocation = useCallback(() => {
    document.getElementById("location-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const styles = studio.yoga_styles ?? [];
  const [showAllStyles, setShowAllStyles] = useState(false);

  return (
    <section className="relative">
      <StudioHeader />
      <PhotoGallery images={studio.image_ids} alt={studio.name} />

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <div className="pointer-events-none -mt-[50px] w-[100px] overflow-hidden rounded-2xl border-2 border-white shadow-sm">
          <HashedAvatar
            seed={studio.id}
            name={studio.name}
            imageId={studio.image_id}
            size={100}
            imageFit="contain"
            className="rounded-none bg-white"
          />
        </div>

        <h1 className="mt-2.5 text-xl font-bold text-gray-950 md:text-3xl">{studio.name}</h1>

        {studio.address && (
          <button
            type="button"
            onClick={scrollToLocation}
            className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{studio.address}</span>
          </button>
        )}
        <SocialLinksRow links={studio.social_links} />
        {studio.description && <DescriptionBlock text={studio.description} />}
      </div>
    </section>
  );
}

function PricingSection({ studio }: { studio: StudioPublic }) {
  if (!hasPassPricing(studio.passes, studio.drop_in_price)) return null;

  return (
    <section id="pricing-section" className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Cennik</h2>
      <PassList
        passes={studio.passes}
        dropInPrice={studio.drop_in_price}
        currency={studio.currency}
      />
    </section>
  );
}

function SportCardsSection({ studio }: { studio: StudioPublic }) {
  if (studio.accepts_sport_cards == null) return null;

  return (
    <section id="sport-cards-section" className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-1 text-[18px] font-semibold text-[#222222]">Karty sportowe</h2>
      <SportCardList
        acceptsSportCards={studio.accepts_sport_cards}
        acceptances={studio.sport_card_acceptances}
        currency={studio.currency}
      />
    </section>
  );
}

function InstructorsSection({ studio }: { studio: StudioPublic }) {
  if (!studio.instructors || studio.instructors.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Instruktorzy</h2>
      <InstructorList instructors={studio.instructors} />
    </section>
  );
}

function LocationSection({ studio }: { studio: StudioPublic }) {
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
    <section id="location-section" className="mx-auto max-w-5xl px-4 py-5">
      <PublicLocation location={publicLocation} title={studio.name} />
    </section>
  );
}

const AMENITIES_PREVIEW_COUNT = 10;

function amenityCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return "udogodnienie";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "udogodnienia";
  return "udogodnień";
}

function AmenitiesSection({ studio }: { studio: StudioPublic }) {
  const [showAll, setShowAll] = useState(false);

  if (!studio.amenities || studio.amenities.length === 0) return null;

  const amenities = studio.amenities;
  const hasMore = amenities.length > AMENITIES_PREVIEW_COUNT;
  const visibleAmenities =
    showAll || !hasMore ? amenities : amenities.slice(0, AMENITIES_PREVIEW_COUNT);

  return (
    <section className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Udogodnienia</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleAmenities.map((amenity) => {
          const Icon = amenityIcon(amenity.icon_id);
          return (
            <div key={amenity.id} className="flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0 text-gray-500" />
              <span className="text-sm text-[#444444]">{amenity.name}</span>
            </div>
          );
        })}
      </div>
      {hasMore && !showAll && (
        <Button
          variant="muted"
          className="mt-4 h-12 w-full rounded-xl"
          onClick={() => setShowAll(true)}
        >
          Pokaż wszystkie {amenities.length} {amenityCountLabel(amenities.length)}
        </Button>
      )}
    </section>
  );
}

export function StudioPageContent({ studio, initialSchedulePreview }: StudioPageContentProps) {
  return (
    <main className="min-h-screen bg-white text-gray-950">
      <HeroSection studio={studio} />
      {studio.slug && (
        <StudioScheduleSneak studioSlug={studio.slug} preview={initialSchedulePreview} />
      )}
      {studio.slug && <ZajeciaPreviewSection studioSlug={studio.slug} />}
      <InstructorsSection studio={studio} />
      <PricingSection studio={studio} />
      <SportCardsSection studio={studio} />
      <AmenitiesSection studio={studio} />
      <LocationSection studio={studio} />
    </main>
  );
}
