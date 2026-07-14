"use client";

import { ArrowRight, Calendar, CreditCard, MapPin } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoPersonOutline } from "react-icons/io5";

import { ClassCard } from "@/app/(public)/studio/[slug]/classes/components/ClassCard";
import type { ClassTemplateListResponse } from "@/app/(public)/studio/[slug]/classes/types";
import { SessionCard } from "@/app/(public)/studio/[slug]/schedule/components/SessionCard";
import { SessionDetailDrawer } from "@/app/(public)/studio/[slug]/schedule/SessionDetailDrawer";
import type {
  PublicOccurrence,
  PublicSchedulePreviewResponse,
} from "@/app/(public)/studio/[slug]/schedule/types";
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { PhotoGallery } from "@/components/custom/PhotoGallery";
import { WyImage } from "@/components/custom/WyImage";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import { Button, buttonVariants } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";
import type { StudioPass, StudioPublic, StudioSportCardAcceptance } from "@/types/studio";

import {
  discountPercent,
  formatMoney,
  LightPassTile,
  perEntry,
  sportCardName,
  sportCardPhoto,
} from "./pricingHelpers";
import { formatSneakDayHeader } from "./scheduleSneakUtils";

interface StudioPageContentProps {
  studio: StudioPublic;
  initialSchedulePreview?: PublicSchedulePreviewResponse | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatWarsawDateShort(d: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function groupOccurrencesByDay(occurrences: PublicOccurrence[]) {
  const groups: { date: string; occurrences: PublicOccurrence[] }[] = [];
  for (const occ of occurrences) {
    const last = groups[groups.length - 1];
    if (last?.date === occ.calendar_date) {
      last.occurrences.push(occ);
    } else {
      groups.push({ date: occ.calendar_date, occurrences: [occ] });
    }
  }
  return groups;
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
        className="mt-3 grid h-12 w-full grid-cols-[16px_1fr_16px] items-center gap-3 rounded-xl bg-gray-950 px-4 text-md font-medium text-white transition-colors hover:bg-gray-800"
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
            variant="compact"
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
  const accountHref = mounted && user ? "/profile" : "/profile/login";

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
        <div className="pointer-events-none relative -mt-[50px] h-[100px] w-[100px] overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm">
          {studio.image_id ? (
            <WyImage src={studio.image_id} alt={studio.name} fill className="object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xl font-bold text-gray-500">
              {initials(studio.name)}
            </div>
          )}
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
        {studio.description && <DescriptionBlock text={studio.description} />}
      </div>
    </section>
  );
}

function PricingSection({ studio }: { studio: StudioPublic }) {
  const currency = studio.currency || "PLN";
  const hasDropIn = studio.drop_in_price != null;
  const hasPricing = hasDropIn || studio.passes.length > 0;
  const [selectedPass, setSelectedPass] = useState<StudioPass | null>(null);
  const [showDropIn, setShowDropIn] = useState(false);
  const [showAllPasses, setShowAllPasses] = useState(false);
  if (!hasPricing) return null;

  const passLimit = hasDropIn ? 2 : 3;
  const visiblePasses = showAllPasses ? studio.passes : studio.passes.slice(0, passLimit);
  const hiddenPassCount = studio.passes.length - passLimit;

  return (
    <section id="pricing-section" className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Cennik</h2>
      <div className="divide-y divide-gray-100">
        {hasDropIn && (
          <button
            type="button"
            onClick={() => setShowDropIn(true)}
            className="flex w-full items-center gap-4 py-3 text-left"
          >
            <LightPassTile sessionCount={1} durationDays={0} />
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold text-[#222222]">Pojedyncze wejście</h3>
              <p className="mt-0.5 text-sm text-[#717171]">Bez karnetu i karty sportowej</p>
            </div>
            <span className="shrink-0 text-lg font-semibold text-[#222222]">
              {formatMoney(studio.drop_in_price, currency)}
            </span>
          </button>
        )}
        {visiblePasses.map((pass) => {
          const entryPrice = perEntry(pass);
          const discount = discountPercent(pass, studio.drop_in_price);
          const subtitle = [
            pass.description,
            entryPrice != null
              ? `${formatMoney(entryPrice, pass.currency || currency)}/wejście`
              : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <button
              key={pass.id}
              type="button"
              onClick={() => setSelectedPass(pass)}
              className="flex w-full items-center gap-4 py-3 text-left"
            >
              <LightPassTile sessionCount={pass.session_count} durationDays={pass.duration_days} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-[#222222]">{pass.name}</h3>
                  {discount != null && (
                    <span className="text-sm font-semibold text-emerald-600">−{discount}%</span>
                  )}
                </div>
                {subtitle && (
                  <p className="mt-0.5 text-sm leading-snug text-[#717171]">{subtitle}</p>
                )}
              </div>
              <span className="shrink-0 text-lg font-semibold text-[#222222]">
                {formatMoney(pass.price, pass.currency || currency)}
              </span>
            </button>
          );
        })}
      </div>
      {!showAllPasses && hiddenPassCount > 0 && (
        <Button
          variant="muted"
          className="mt-3 h-12 w-full rounded-xl"
          onClick={() => setShowAllPasses(true)}
        >
          Pokaż wszystkie karnety
        </Button>
      )}

      <Drawer open={selectedPass != null} onOpenChange={(o) => !o && setSelectedPass(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedPass?.name ?? ""}</DrawerTitle>
          </DrawerHeader>
          {selectedPass &&
            (() => {
              const passCurrency = selectedPass.currency || currency;
              const entry = perEntry(selectedPass);
              const discount = discountPercent(selectedPass, studio.drop_in_price);
              const isUnlimitedSessions = selectedPass.session_count == null;
              const isUnlimitedDays = selectedPass.duration_days == null;

              return (
                <div className="px-4 pb-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <LightPassTile
                        sessionCount={selectedPass.session_count}
                        durationDays={selectedPass.duration_days}
                      />
                      <span className="text-2xl font-bold text-[#222222]">
                        {formatMoney(selectedPass.price, passCurrency)}
                      </span>
                    </div>
                    {discount != null && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        −{discount}%
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100 rounded-xl bg-[#FAFAFA] px-4">
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-[#717171]">Wejścia</span>
                      <span className="text-sm font-medium text-[#222222]">
                        {isUnlimitedSessions ? "Bez limitu" : selectedPass.session_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-[#717171]">Ważność</span>
                      <span className="text-sm font-medium text-[#222222]">
                        {isUnlimitedDays ? "Bezterminowo" : `${selectedPass.duration_days} dni`}
                      </span>
                    </div>
                    {entry != null && (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-[#717171]">Cena za wejście</span>
                        <span className="text-sm font-medium text-[#222222]">
                          {formatMoney(entry, passCurrency)}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedPass.description && (
                    <p className="mt-4 text-sm leading-relaxed text-[#717171]">
                      {selectedPass.description}
                    </p>
                  )}
                </div>
              );
            })()}
        </DrawerContent>
      </Drawer>

      <Drawer open={showDropIn} onOpenChange={setShowDropIn}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Pojedyncze wejście</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <div className="mb-5 flex items-center gap-4">
              <LightPassTile sessionCount={1} durationDays={0} />
              <span className="text-2xl font-bold text-[#222222]">
                {formatMoney(studio.drop_in_price, currency)}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed text-[#222222]">
              Cena za jedno wejście bez karnetu i bez karty sportowej.
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function SportCardsSection({ studio }: { studio: StudioPublic }) {
  const [selectedCard, setSelectedCard] = useState<StudioSportCardAcceptance | null>(null);
  const [showAllCards, setShowAllCards] = useState(false);

  if (studio.accepts_sport_cards == null) return null;

  const selectedPhoto = selectedCard ? sportCardPhoto(selectedCard) : null;
  const selectedDescription =
    selectedCard?.description || selectedCard?.sport_card?.description || null;

  return (
    <section id="sport-cards-section" className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-1 text-[18px] font-semibold text-[#222222]">Karty sportowe</h2>
      <p className="mb-4 text-sm text-[#717171]">
        Akceptujemy karty sportowe. Przy niektórych kartach może obowiązywać dopłata za wejście.
      </p>
      {studio.accepts_sport_cards === false ? (
        <p className="text-sm text-[#717171]">Studio nie akceptuje kart sportowych.</p>
      ) : (
        <div>
          {(showAllCards
            ? studio.sport_card_acceptances
            : studio.sport_card_acceptances.slice(0, 3)
          ).map((item, i) => {
            const photo = sportCardPhoto(item);
            const hasFee = item.fee != null && item.fee > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedCard(item)}
                className={`flex w-full items-center gap-3 py-3 text-left${i > 0 ? " border-t border-gray-100" : ""}`}
              >
                <div className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#F5F3EE]">
                  {photo ? (
                    <WyImage
                      src={photo}
                      alt={sportCardName(item)}
                      width={56}
                      height={40}
                      className="h-10 w-14 object-fill"
                    />
                  ) : (
                    <CreditCard className="h-4 w-4 text-[#AAAAAA]" />
                  )}
                </div>
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#222222]">
                  {sportCardName(item)}
                </p>
                <span
                  className={`shrink-0 text-sm ${hasFee ? "text-[#717171]" : "font-medium text-emerald-600"}`}
                >
                  {hasFee
                    ? `dopłata ${formatMoney(item.fee, studio.currency || "PLN")}`
                    : "bez dopłaty"}
                </span>
              </button>
            );
          })}
          {studio.sport_card_acceptances.length === 0 && (
            <p className="py-3 text-sm text-[#717171]">
              Lista akceptowanych kart pojawi się po uzupełnieniu profilu.
            </p>
          )}
          {!showAllCards && studio.sport_card_acceptances.length > 3 && (
            <Button
              variant="muted"
              className="mt-3 h-12 w-full rounded-xl"
              onClick={() => setShowAllCards(true)}
            >
              Pokaż wszystkie karty
            </Button>
          )}
        </div>
      )}

      <Drawer open={selectedCard != null} onOpenChange={(o) => !o && setSelectedCard(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedCard ? sportCardName(selectedCard) : ""}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {selectedPhoto ? (
              <div className="mb-4 overflow-hidden rounded-xl">
                <WyImage
                  src={selectedPhoto}
                  alt={selectedCard ? sportCardName(selectedCard) : ""}
                  width={560}
                  height={320}
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              <div className="mb-4 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl bg-[#F5F3EE]">
                <CreditCard className="h-8 w-8 text-[#BBBBBB]" />
              </div>
            )}
            <div className="space-y-3">
              <p className="text-[15px] leading-relaxed text-[#222222]">
                {selectedCard?.fee != null && selectedCard.fee > 0 ? (
                  <>
                    Akceptujemy kartę{" "}
                    <strong>{selectedCard ? sportCardName(selectedCard) : ""}</strong>. Do każdego
                    wejścia obowiązuje dopłata{" "}
                    {formatMoney(selectedCard.fee, studio.currency || "PLN")}.
                  </>
                ) : (
                  <>
                    Akceptujemy kartę{" "}
                    <strong>{selectedCard ? sportCardName(selectedCard) : ""}</strong> bez
                    dodatkowych opłat.
                  </>
                )}
              </p>
              {selectedDescription && (
                <p className="text-sm leading-relaxed text-[#717171]">{selectedDescription}</p>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function InstructorsSection({ studio }: { studio: StudioPublic }) {
  if (!studio.instructors || studio.instructors.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Instruktorzy</h2>
      <div className="space-y-4">
        {studio.instructors.map((instructor) => {
          const href = instructor.slug ? `/instruktor/${instructor.slug}` : null;
          const avatar = instructor.image_id ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
              <WyImage
                src={instructor.image_id}
                alt={instructor.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-base font-semibold text-amber-800">
              {initials(instructor.name)}
            </div>
          );

          const row = (
            <div className="flex items-center gap-3">
              {avatar}
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight text-[#222222]">{instructor.name}</p>
                {instructor.short_bio && (
                  <p className="mt-0.5 text-sm leading-tight text-[#717171]">
                    {instructor.short_bio}
                  </p>
                )}
              </div>
              {href && <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />}
            </div>
          );

          return (
            <div key={instructor.id}>
              {href ? <DetailPageLink href={href}>{row}</DetailPageLink> : row}
            </div>
          );
        })}
      </div>
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
      <div className="flex flex-wrap gap-2">
        {visibleAmenities.map((amenity) => (
          <span
            key={amenity.id}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-[#444444]"
          >
            {amenity.name}
          </span>
        ))}
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
