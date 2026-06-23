"use client";

import {
  CalendarDays,
  ChevronRight,
  Clock3,
  CreditCard,
  ImageIcon,
  MapPin,
  Navigation,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";
import { getCurrencySymbol } from "@/lib/currency";
import type { StudioPass, StudioPublic, StudioSportCardAcceptance } from "@/types/studio";

interface StudioPageContentProps {
  studio: StudioPublic;
}

const FALLBACK_HERO = "/images/partners/hero.jpg";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMoney(value: number | null | undefined, currency?: string | null) {
  if (value == null) return "";
  return `${value.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} ${getCurrencySymbol(currency || "PLN")}`;
}

function googleMapsUrl(address?: string | null) {
  if (!address) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function googleMapsEmbedUrl(address?: string | null) {
  if (!address) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function perEntry(pass: StudioPass) {
  if (!pass.session_count || pass.session_count <= 0) return null;
  return pass.price / pass.session_count;
}

function discountPercent(pass: StudioPass, dropInPrice?: number | null) {
  const entry = perEntry(pass);
  if (!entry || !dropInPrice || dropInPrice <= 0 || entry >= dropInPrice) return null;
  return Math.round((1 - entry / dropInPrice) * 100);
}

function HeroSlider({ studio, images }: { studio: StudioPublic; images: string[] }) {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const activeImage = images[index];

  const move = (direction: 1 | -1) => {
    setIndex((current) => (current + direction + images.length) % images.length);
  };

  return (
    <section className="relative">
      <div
        className="relative aspect-[4/3] overflow-hidden bg-gray-100 md:aspect-[16/7]"
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStart == null || images.length < 2) return;
          const end = event.changedTouches[0]?.clientX ?? touchStart;
          const delta = end - touchStart;
          if (Math.abs(delta) > 44) move(delta < 0 ? 1 : -1);
          setTouchStart(null);
        }}
      >
        {activeImage ? (
          <WyImage
            src={activeImage}
            alt={studio.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <img src={FALLBACK_HERO} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Poprzednie zdjęcie"
              onClick={() => move(-1)}
              className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow md:flex"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Następne zdjęcie"
              onClick={() => move(1)}
              className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
              {index + 1}/{images.length}
            </div>
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((image, dotIndex) => (
                <button
                  key={`${image}-${dotIndex}`}
                  type="button"
                  aria-label={`Pokaż zdjęcie ${dotIndex + 1}`}
                  onClick={() => setIndex(dotIndex)}
                  className={`h-2 rounded-full transition-all ${
                    dotIndex === index ? "w-6 bg-white" : "w-2 bg-white/55"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function HeaderBlock({ studio }: { studio: StudioPublic }) {
  const styles = studio.yoga_styles ?? [];
  return (
    <section className="mx-auto -mt-8 max-w-5xl px-4 pb-6 md:-mt-10">
      <div className="relative bg-white px-4 py-5 shadow-sm md:px-6">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-4 ring-white">
            {studio.image_id ? (
              <WyImage src={studio.image_id} alt={studio.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-600">
                {initials(studio.name)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-normal text-gray-950 md:text-4xl">
              {studio.name}
            </h1>
            {studio.address && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{studio.address}</span>
              </p>
            )}
            {styles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {styles.slice(0, 6).map((style) => (
                  <span
                    key={style.id}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {style.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {studio.description && (
          <p className="mt-5 max-w-3xl text-sm leading-6 text-gray-700 md:text-base">
            {studio.description}
          </p>
        )}
      </div>
    </section>
  );
}

function ScheduleShell() {
  const today = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <section className="border-y bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              ZAJĘCIA DZIŚ · {today}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">Najbliższe zajęcia</h2>
          </div>
          <Button disabled variant="outline" className="hidden md:inline-flex">
            Pełny grafik
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {["Poranek", "Popołudnie", "Wieczór"].map((label) => (
            <div key={label} className="border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">{label}</span>
                <Clock3 className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Grafik studia będzie dostępny wkrótce.</p>
              <Button disabled size="sm" className="mt-4 w-full">
                Zapisz się
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RuleTile({ main, subtitle }: { main: string; subtitle?: string }) {
  return (
    <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-950 text-white">
      <span className="text-4xl font-semibold leading-none">{main}</span>
      {subtitle && <span className="mt-1 text-xs font-medium text-white/70">{subtitle}</span>}
    </div>
  );
}

function PricingSection({ studio }: { studio: StudioPublic }) {
  const currency = studio.currency || "PLN";
  const hasDropIn = studio.drop_in_price != null;
  const hasPricing = hasDropIn || studio.passes.length > 0;
  if (!hasPricing) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-9">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-gray-700" />
        <h2 className="text-xl font-semibold text-gray-950">Cennik</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {hasDropIn && (
          <div className="flex gap-4 border bg-white p-4">
            <RuleTile main="1" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-950">Jednorazowe wejście</h3>
              <p className="mt-1 text-sm text-gray-500">Pojedyncze zajęcia bez karnetu.</p>
              <p className="mt-3 text-lg font-semibold text-gray-950">
                {formatMoney(studio.drop_in_price, currency)}
              </p>
            </div>
          </div>
        )}
        {studio.passes.map((pass) => {
          const entryPrice = perEntry(pass);
          const discount = discountPercent(pass, studio.drop_in_price);
          return (
            <div key={pass.id} className="flex gap-4 border bg-white p-4">
              <RuleTile
                main={pass.session_count == null ? "∞" : String(pass.session_count)}
                subtitle={pass.duration_days == null ? "∞" : `${pass.duration_days} dni`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-950">{pass.name}</h3>
                  {discount != null && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      -{discount}%
                    </span>
                  )}
                </div>
                {pass.description && (
                  <p className="mt-1 text-sm leading-5 text-gray-500">{pass.description}</p>
                )}
                <p className="mt-3 text-lg font-semibold text-gray-950">
                  {formatMoney(pass.price, pass.currency || currency)}
                </p>
                {entryPrice != null && (
                  <p className="text-xs text-gray-500">
                    {formatMoney(entryPrice, pass.currency || currency)} / wejście
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function sportCardName(item: StudioSportCardAcceptance) {
  return item.sport_card?.name ?? item.name ?? "Karta sportowa";
}

function sportCardPhoto(item: StudioSportCardAcceptance) {
  return item.sport_card?.photo ?? item.photo ?? null;
}

function SportCardsSection({ studio }: { studio: StudioPublic }) {
  if (studio.accepts_sport_cards == null) return null;

  return (
    <section className="border-y bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-9">
        <div className="mb-1 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-950">Karty sportowe</h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Akceptujemy karty sportowe. Przy niektórych kartach może obowiązywać dopłata za wejście.
        </p>
        {studio.accepts_sport_cards === false ? (
          <div className="border bg-white p-4 text-sm text-gray-600">
            Studio nie akceptuje kart sportowych.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {studio.sport_card_acceptances.map((item) => {
              const photo = sportCardPhoto(item);
              return (
                <div key={item.id} className="flex items-center gap-3 border bg-white p-4 rounded-lg">
                  <div className="relative flex h-12 w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                    {photo ? (
                      <WyImage
                        src={photo}
                        alt={sportCardName(item)}
                        width={76}
                        height={48}
                        className="h-12 w-[76px] object-contain"
                      />
                    ) : (
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-950">
                      {sportCardName(item)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.fee != null && item.fee > 0
                        ? `dopłata ${formatMoney(item.fee, studio.currency || "PLN")}`
                        : "bez dopłaty"}
                    </p>
                  </div>
                </div>
              );
            })}
            {studio.sport_card_acceptances.length === 0 && (
              <div className="border bg-white p-4 text-sm text-gray-600">
                Lista akceptowanych kart pojawi się po uzupełnieniu profilu.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function InstructorsSection({ studio }: { studio: StudioPublic }) {
  if (studio.instructors?.length > 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-9">
      <div className="mb-4 flex items-center gap-2">
        <UserRound className="h-5 w-5 text-gray-700" />
        <h2 className="text-xl font-semibold text-gray-950">Instruktorzy</h2>
      </div>
      <div className="space-y-3">
        {studio.instructors?.map((instructor) => {
          const row = (
            <div className="flex items-center gap-3 border bg-white p-4 transition-colors hover:bg-gray-50">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-50 text-base font-semibold text-amber-800">
                {instructor.image_id ? (
                  <WyImage
                    src={instructor.image_id}
                    alt={instructor.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  initials(instructor.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-950">{instructor.name}</p>
                {instructor.short_bio && (
                  <p className="line-clamp-2 text-sm leading-5 text-gray-500">
                    {instructor.short_bio}
                  </p>
                )}
              </div>
              {instructor.slug && <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />}
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
    </section>
  );
}

function LocationSection({ studio }: { studio: StudioPublic }) {
  const embed = googleMapsEmbedUrl(studio.address);
  if (!studio.address) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-9">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-gray-700" />
        <h2 className="text-xl font-semibold text-gray-950">Lokalizacja</h2>
      </div>
      <div className="overflow-hidden border bg-white">
        {embed ? (
          <iframe
            title={`Mapa: ${studio.name}`}
            src={embed}
            loading="lazy"
            className="h-64 w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-64 items-center justify-center bg-gray-100">
            <ImageIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-700">{studio.address}</p>
          <Button asChild variant="outline">
            <a href={googleMapsUrl(studio.address)} target="_blank" rel="noopener noreferrer">
              <Navigation className="mr-2 h-4 w-4" />
              Nawiguj w Google Maps
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function StubStudioContent({ studio }: { studio: StudioPublic }) {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="border bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Profil w trakcie weryfikacji
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-950">{studio.name}</h1>
          {studio.address && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
              <MapPin className="h-4 w-4" />
              {studio.address}
            </p>
          )}
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-700">
            Dane tego studia mogą być niepełne. Profil został dodany przez instruktora i czeka na
            przejęcie przez właściciela lub managera.
          </p>
          <Button asChild className="mt-5">
            <Link href="/profile/login">Jesteś właścicielem? Przejmij ten profil</Link>
          </Button>
        </div>
      </section>
      <InstructorsSection studio={studio} />
      <LocationSection studio={studio} />
    </main>
  );
}

export function StudioPageContent({ studio }: StudioPageContentProps) {
  const images = useMemo(() => {
    const gallery = studio.image_ids?.filter(Boolean) ?? [];
    const all = gallery;
    return Array.from(new Set(all));
  }, [studio.image_id, studio.image_ids]);

  if (studio.status === "stub") {
    return <StubStudioContent studio={studio} />;
  }

  return (
    <main className="min-h-screen bg-white text-gray-950">
      <HeroSlider studio={studio} images={images} />
      <HeaderBlock studio={studio} />
      {studio.amenities.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-8">
          <div className="flex flex-wrap gap-2">
            {studio.amenities.map((amenity) => (
              <span
                key={amenity.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                {amenity.name}
              </span>
            ))}
          </div>
        </section>
      )}
      <ScheduleShell />
      <PricingSection studio={studio} />
      <SportCardsSection studio={studio} />
      <InstructorsSection studio={studio} />
      <LocationSection studio={studio} />
    </main>
  );
}
