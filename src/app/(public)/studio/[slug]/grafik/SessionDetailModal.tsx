"use client";

import {
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  ClockAlert,
  DoorOpen,
  Flower2,
  Share2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EventLocation } from "@/app/(public)/retreats/[slug]/components/EventLocation";
import type { LocationDetail } from "@/app/(public)/retreats/[slug]/types";
import { WyImage } from "@/components/custom/WyImage";
import {
  discountPercent,
  formatMoney,
  LightPassTile,
  perEntry,
} from "@/components/page-contents/studio/pricingHelpers";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

import { levelLabel } from "../classes/types";
import { COLOR_BORDER_MAP, DEFAULT_BORDER, NEARLY_FULL_THRESHOLD } from "./components/SessionCard";
import type {
  OccurrenceDetail,
  OccurrenceDetailInstructor,
  OccurrenceDetailStudioPass,
  OccurrenceDetailStudioSportCardAcceptance,
} from "./types";

const BRAND_GREEN = "#4F8A62";

// ── Formatting helpers ────────────────────────────────────────────────

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

function formatDayHeader(iso: string): string {
  const d = new Date(iso);
  const label = d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
  const timePart = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} o ${timePart}`;
}

const LANGUAGE_INSTRUMENTAL: Record<string, string> = {
  polski: "polsku",
  angielski: "angielsku",
  ukraiński: "ukraińsku",
  niemiecki: "niemiecku",
  francuski: "francusku",
  hiszpański: "hiszpańsku",
  rosyjski: "rosyjsku",
  włoski: "włosku",
};

function instrumental(language: string): string {
  return LANGUAGE_INSTRUMENTAL[language.toLowerCase()] ?? language;
}

function joinPolish(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} i ${items[items.length - 1]}`;
}

function buildLanguageLines(
  sessionLanguage: string | null | undefined,
  instructor: OccurrenceDetailInstructor | null | undefined,
): { base: string; extra: string | null } | null {
  if (!sessionLanguage) return null;
  const base = `Zajęcia prowadzone po ${instrumental(sessionLanguage)}.`;
  const extraLanguages = (instructor?.languages ?? []).filter(
    (l) => l.toLowerCase() !== sessionLanguage.toLowerCase(),
  );
  if (extraLanguages.length === 0 || !instructor) return { base, extra: null };
  const firstName = instructor.name.split(" ")[0];
  const joined = joinPolish(extraLanguages.map(instrumental));
  return {
    base,
    extra: `${firstName} mówi także po ${joined} — możesz zwrócić się w swoim języku.`,
  };
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

// ── Fill-state / icon-row primitives (T05) ────────────────────────────

type Tone = "neutral" | "amber" | "red";

const TILE_TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-500",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
};

const VALUE_TONE_CLASSES: Record<Tone, string> = {
  neutral: "text-gray-900",
  amber: "text-amber-700",
  red: "text-red-600",
};

function IconRow({
  icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          TILE_TONE_CLASSES[tone],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={cn("text-sm font-semibold", VALUE_TONE_CLASSES[tone])}>
          {value}
          {hint && <span className="ml-1 font-normal">· {hint}</span>}
        </p>
      </div>
    </div>
  );
}

function computeFillTone(spotsRemaining: number | null | undefined, isBooked: boolean): Tone {
  if (isBooked) return "neutral";
  if (spotsRemaining == null) return "neutral";
  if (spotsRemaining === 0) return "red";
  if (spotsRemaining <= NEARLY_FULL_THRESHOLD) return "amber";
  return "neutral";
}

// ── Header (T05, T08) ─────────────────────────────────────────────────

function ModalHeader({
  detail,
  isBooked,
  showTimeChange,
  showInstructorChange,
  isCancelled,
}: {
  detail: OccurrenceDetail;
  isBooked: boolean;
  showTimeChange: boolean;
  showInstructorChange: boolean;
  isCancelled: boolean;
}) {
  const fillTone = computeFillTone(detail.spots_remaining, isBooked);
  const showRoom = detail.studio.room_count >= 2 && !!detail.room_name;
  const duration = formatDurationMinutes(detail.start_time, detail.end_time);

  return (
    <div className="space-y-4 px-4 pt-4">
      <h1
        className={cn(
          "text-xl font-bold text-gray-900",
          isCancelled && "text-gray-400 line-through",
        )}
      >
        {detail.template_title}
      </h1>

      <IconRow
        icon={<Calendar className="h-4 w-4" />}
        label="Termin"
        value={<span className="capitalize">{formatDayHeader(detail.calendar_date)}</span>}
        tone={isCancelled ? "neutral" : "neutral"}
      />

      <IconRow
        icon={<Clock className="h-4 w-4" />}
        label={showTimeChange ? "Godzina · zmieniona" : "Godzina"}
        value={
          <>
            {showTimeChange && detail.previous_start_time && (
              <span className="mr-1.5 text-gray-400 line-through">
                {formatTime(detail.previous_start_time)}
              </span>
            )}
            {formatTime(detail.start_time)} – {formatTime(detail.end_time)} · {duration} min
          </>
        }
        tone={showTimeChange ? "amber" : "neutral"}
      />

      {showRoom && (
        <IconRow icon={<DoorOpen className="h-4 w-4" />} label="Sala" value={detail.room_name} />
      )}

      {detail.capacity != null && (
        <IconRow
          icon={<Users className="h-4 w-4" />}
          label="Wolne miejsca"
          value={
            fillTone === "red" && !isBooked
              ? "Brak wolnych miejsc"
              : `${detail.spots_remaining} z ${detail.capacity}`
          }
          hint={fillTone === "amber" ? "zostały ostatnie miejsca" : undefined}
          tone={fillTone}
        />
      )}

      {showInstructorChange && detail.previous_instructor_name && (
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          <span>Zastępstwo na tych zajęciach</span>
        </div>
      )}
    </div>
  );
}

// ── Banners (T08) ─────────────────────────────────────────────────────

function fundingSubline(booking: OccurrenceDetail["viewer_booking"]): string | null {
  if (!booking) return null;
  if (booking.funding_type === "use_pass" || booking.funding_type === "buy_and_use") {
    return "Opłacone karnetem";
  }
  if (booking.funding_type === "drop_in") return "Wejście jednorazowe";
  if (booking.funding_type === "sport_card") {
    return booking.sport_card_surcharge
      ? `Opłacone kartą sportową · dopłata ${formatMoney(booking.sport_card_surcharge)}`
      : "Opłacone kartą sportową";
  }
  return null;
}

function BookedBanner({ booking }: { booking: OccurrenceDetail["viewer_booking"] }) {
  const subline = fundingSubline(booking);
  return (
    <div className="flex items-center gap-2 bg-[#4F8A62]/10 px-4 py-2.5 text-sm font-medium text-[#4F8A62]">
      <Check className="h-4 w-4 shrink-0" />
      <div>
        <p>Masz rezerwację na te zajęcia</p>
        {subline && <p className="text-xs font-normal opacity-80">{subline}</p>}
      </div>
    </div>
  );
}

function CancelledBanner() {
  return (
    <div className="bg-red-50 px-4 py-2.5 text-center text-sm font-medium text-red-600">
      Te zajęcia zostały odwołane
    </div>
  );
}

function ChangedNoticeBanner({
  showTimeChange,
  showInstructorChange,
}: {
  showTimeChange: boolean;
  showInstructorChange: boolean;
}) {
  const text =
    showTimeChange && showInstructorChange
      ? "Zmieniono godzinę i prowadzącą tych zajęć."
      : showTimeChange
        ? "Zmieniono godzinę tych zajęć."
        : "Zmieniono prowadzącą tych zajęć.";
  return (
    <div className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
      <Clock className="h-4 w-4 shrink-0" />
      {text}
    </div>
  );
}

// ── Free-cancellation strip (T05, T08) ────────────────────────────────

function lateCancelCostClause(booking: OccurrenceDetail["viewer_booking"]): string {
  if (!booking) return "wejście z karnetu nie zostanie zwrócone";
  if (booking.funding_type === "drop_in") return "opłata nie zostanie zwrócona";
  if (booking.funding_type === "sport_card") return "nic nie stracisz";
  return "wejście z karnetu nie zostanie zwrócone";
}

function CancellationStrip({
  deadline,
  withinWindow,
  booking,
}: {
  deadline: string | null | undefined;
  withinWindow: boolean;
  booking: OccurrenceDetail["viewer_booking"];
}) {
  if (withinWindow) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        {deadline
          ? `Bezpłatne odwołanie do ${formatDeadline(deadline)}`
          : "Bezpłatne odwołanie w dowolnym momencie"}
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 px-4 py-2 text-xs text-gray-500">
      <ClockAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
      <span>
        Bezpłatny termin odwołania minął{deadline ? ` o ${formatDeadline(deadline)}` : ""}. Możesz
        nadal odwołać, ale {lateCancelCostClause(booking)}.
      </span>
    </div>
  );
}

// ── Prowadzi section (T06) ────────────────────────────────────────────

function ProwadziSection({ detail }: { detail: OccurrenceDetail }) {
  const instructor = detail.instructor;
  if (!instructor) return null;
  const languageLines = buildLanguageLines(detail.language, instructor);

  return (
    <section className="space-y-3 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Prowadzi</p>
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-amber-50">
          {instructor.image_id ? (
            <WyImage
              src={instructor.image_id}
              alt={instructor.name}
              fill
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-amber-800">
              {initials(instructor.name)}
            </span>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
          {instructor.name}
        </p>
        {instructor.slug && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />}
      </div>
      {languageLines && (
        <p className="text-xs leading-relaxed text-gray-500">
          {languageLines.base}
          {languageLines.extra && <> {languageLines.extra}</>}
        </p>
      )}
    </section>
  );
}

// ── O zajęciach section (T06) ─────────────────────────────────────────

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <p
        className={cn(
          "whitespace-pre-line text-sm leading-relaxed text-gray-700",
          !expanded && "line-clamp-3",
        )}
      >
        {text}
      </p>
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-sm font-medium text-gray-500 underline underline-offset-2"
        >
          Pokaż więcej
        </button>
      )}
    </div>
  );
}

function OZajeciachSection({ detail }: { detail: OccurrenceDetail }) {
  const level = levelLabel(detail.level);
  const chips: { icon: React.ReactNode; label: string }[] = [];
  if (level) chips.push({ icon: <BarChart3 className="h-3.5 w-3.5" />, label: level });
  if (detail.style) chips.push({ icon: <Flower2 className="h-3.5 w-3.5" />, label: detail.style });
  if (detail.duration_minutes) {
    chips.push({
      icon: <Clock className="h-3.5 w-3.5" />,
      label: `${detail.duration_minutes} min`,
    });
  }

  if (chips.length === 0 && !detail.description) return null;

  return (
    <section className="space-y-3 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">O zajęciach</p>
      {chips.length > 0 && (
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
      )}
      {detail.description && <ExpandableDescription text={detail.description} />}
    </section>
  );
}

// ── Cennik i dostęp section (T07) ─────────────────────────────────────

function minPrice(studio: OccurrenceDetail["studio"]): number | null {
  const values = [studio.drop_in_price ?? null, ...studio.passes.map((p) => p.price)].filter(
    (v): v is number => v != null,
  );
  if (values.length === 0) return null;
  return Math.min(...values);
}

function CennikSection({ detail }: { detail: OccurrenceDetail }) {
  const { studio } = detail;
  const [isOpen, setIsOpen] = useState(false);
  const [showAllPasses, setShowAllPasses] = useState(false);
  const hasDropIn = studio.drop_in_price != null;
  const hasPricing = hasDropIn || studio.passes.length > 0;
  const hasSportCards = studio.accepts_sport_cards != null;
  if (!hasPricing && !hasSportCards) return null;

  const min = minPrice(studio);
  const hintParts = [
    studio.passes.length > 0 ? "karnet" : null,
    studio.accepts_sport_cards ? "karty sportowe" : null,
  ].filter(Boolean);

  const passLimit = hasDropIn ? 2 : 3;
  const visiblePasses = showAllPasses ? studio.passes : studio.passes.slice(0, passLimit);
  const hiddenPassCount = studio.passes.length - passLimit;

  return (
    <section className="px-4 py-4">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Cennik i dostęp
        </p>
        <ChevronDown
          className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {!isOpen && (
        <p className="mt-2 text-sm text-gray-600">
          {min != null ? `od ${formatMoney(min, studio.currency)}` : "Sprawdź cennik"}
          {hintParts.length > 0 ? ` · ${hintParts.join(" · ")}` : ""}
        </p>
      )}

      {isOpen && (
        <div className="mt-3 space-y-4">
          {hasPricing && (
            <div className="divide-y divide-gray-100">
              {hasDropIn && (
                <div className="flex items-center gap-4 py-3">
                  <LightPassTile sessionCount={1} durationDays={0} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Pojedyncze wejście</h3>
                    <p className="mt-0.5 text-xs text-gray-500">Bez karnetu i karty sportowej</p>
                  </div>
                  <span className="shrink-0 text-base font-semibold text-gray-900">
                    {formatMoney(studio.drop_in_price, studio.currency)}
                  </span>
                </div>
              )}
              {visiblePasses.map((pass: OccurrenceDetailStudioPass) => {
                const entry = perEntry(pass);
                const discount = discountPercent(pass, studio.drop_in_price);
                return (
                  <div key={pass.id} className="flex items-center gap-4 py-3">
                    <LightPassTile
                      sessionCount={pass.session_count}
                      durationDays={pass.duration_days}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{pass.name}</h3>
                        {discount != null && (
                          <span className="text-xs font-semibold text-emerald-600">
                            −{discount}%
                          </span>
                        )}
                      </div>
                      {entry != null && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatMoney(entry, pass.currency || studio.currency)}/wejście
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-base font-semibold text-gray-900">
                      {formatMoney(pass.price, pass.currency || studio.currency)}
                    </span>
                  </div>
                );
              })}
              {!showAllPasses && hiddenPassCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllPasses(true)}
                  className="w-full py-3 text-center text-sm font-medium text-gray-900"
                >
                  Pokaż wszystkie karnety (+{hiddenPassCount})
                </button>
              )}
            </div>
          )}

          {hasSportCards && (
            <div>
              <p className="mb-2 text-xs text-gray-500">
                Akceptujemy karty sportowe. Przy niektórych kartach może obowiązywać dopłata za
                wejście.
              </p>
              {studio.sport_card_acceptances.map(
                (item: OccurrenceDetailStudioSportCardAcceptance, i: number) => {
                  const name = item.sport_card?.name ?? item.name ?? "Karta sportowa";
                  const photo = item.sport_card?.photo ?? item.photo ?? null;
                  const hasFee = item.fee != null && item.fee > 0;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 py-2.5",
                        i > 0 && "border-t border-gray-100",
                      )}
                    >
                      <div className="relative flex h-8 w-11 shrink-0 items-center justify-center overflow-hidden rounded bg-[#F5F3EE]">
                        {photo ? (
                          <WyImage
                            src={photo}
                            alt={name}
                            width={44}
                            height={32}
                            className="h-8 w-11 object-fill"
                          />
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-400">Karta</span>
                        )}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                        {name}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 text-xs",
                          hasFee ? "text-gray-500" : "font-medium text-emerald-600",
                        )}
                      >
                        {hasFee
                          ? `dopłata ${formatMoney(item.fee, studio.currency)}`
                          : "bez dopłaty"}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Lokalizacja section (T07) ─────────────────────────────────────────

function LokalizacjaSection({ detail }: { detail: OccurrenceDetail }) {
  const { studio } = detail;
  const location = studio.location;
  const hasLatLng = location?.latitude != null && location?.longitude != null;
  if (!studio.address && !hasLatLng) return null;

  const mapsHref = googleMapsUrl(studio.address);

  return (
    <section className="border-t border-gray-100 px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white">
          {studio.image_id ? (
            <WyImage src={studio.image_id} alt={studio.name} fill className="object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-500">
              {initials(studio.name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{studio.name}</p>
          {studio.address && <p className="truncate text-xs text-gray-500">{studio.address}</p>}
        </div>
      </div>

      {hasLatLng ? (
        <EventLocation
          location={
            {
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
            } as LocationDetail
          }
          title={studio.name}
          googleMapsHref={mapsHref}
        />
      ) : (
        <Button asChild variant="outline" className="w-full">
          <a href={mapsHref} target="_blank" rel="noopener noreferrer">
            Nawiguj w Google Maps
          </a>
        </Button>
      )}
    </section>
  );
}

// ── Cancellation confirm sheet (T09) ──────────────────────────────────

interface CancelCopy {
  stateLabel: string;
  showPositiveIcon: boolean;
  body: string;
  primaryLabel: string;
  primaryVariant: "green" | "redOutline";
}

function buildCancelCopy(
  booking: NonNullable<OccurrenceDetail["viewer_booking"]>,
  withinWindow: boolean,
  dropInPrice: number | null | undefined,
): CancelCopy {
  const { funding_type: fundingType, sport_card_surcharge: surcharge } = booking;

  if (fundingType === "sport_card") {
    const hasSurcharge = surcharge != null && surcharge > 0;
    if (!hasSurcharge || !withinWindow) {
      return {
        stateLabel: hasSurcharge ? "Karta sportowa · z dopłatą" : "Karta sportowa",
        showPositiveIcon: false,
        body: "Rezerwacja opłacana kartą sportową — nic nie tracisz. Odwołując, dasz znać studiu, że nie dotrzesz.",
        primaryLabel: "Odwołaj rezerwację",
        primaryVariant: "green",
      };
    }
    return {
      stateLabel: "Karta sportowa · z dopłatą",
      showPositiveIcon: true,
      body: `Odwołujesz w bezpłatnym terminie — otrzymasz zwrot dopłaty ${formatMoney(surcharge)}.`,
      primaryLabel: "Tak, odwołaj",
      primaryVariant: "green",
    };
  }

  if (fundingType === "drop_in") {
    if (withinWindow) {
      return {
        stateLabel: "Wejście jednorazowe",
        showPositiveIcon: true,
        body: `Odwołujesz w bezpłatnym terminie — otrzymasz zwrot ${formatMoney(dropInPrice)}.`,
        primaryLabel: "Tak, odwołaj",
        primaryVariant: "green",
      };
    }
    return {
      stateLabel: "Wejście jednorazowe",
      showPositiveIcon: false,
      body: `Bezpłatny termin minął. Po odwołaniu opłata ${formatMoney(dropInPrice)} nie zostanie zwrócona. Damy jednak znać studiu, że nie dotrzesz.`,
      primaryLabel: "Odwołaj — bez zwrotu",
      primaryVariant: "redOutline",
    };
  }

  // use_pass | buy_and_use | unknown fallback
  if (withinWindow) {
    return {
      stateLabel: "Karnet",
      showPositiveIcon: true,
      body: "Odwołujesz w bezpłatnym terminie — wejście wróci na Twój karnet.",
      primaryLabel: "Tak, odwołaj",
      primaryVariant: "green",
    };
  }
  return {
    stateLabel: "Karnet",
    showPositiveIcon: false,
    body: "Bezpłatny termin minął. Po odwołaniu wejście z karnetu przepadnie. Damy jednak znać studiu, że nie dotrzesz.",
    primaryLabel: "Odwołaj — wejście przepadnie",
    primaryVariant: "redOutline",
  };
}

function CancelSheet({
  open,
  onOpenChange,
  bookingId,
  copy,
  onCancelled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  copy: CancelCopy;
  onCancelled: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await axiosInstance.post<{ booking: { status: string }; was_free: boolean }>(
        `/bookings/${bookingId}/cancel`,
      );
      onCancelled();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Nie udało się odwołać rezerwacji.";
      setError(detail);
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="px-4 pb-6 pt-2">
          {copy.showPositiveIcon && (
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#4F8A62]/10">
              <Check className="h-6 w-6" style={{ color: BRAND_GREEN }} />
            </div>
          )}
          <p className="text-center text-xs font-medium uppercase tracking-wide text-gray-400">
            {copy.stateLabel}
          </p>
          <h3 className="mt-1 text-center text-lg font-semibold text-gray-900">
            Odwołać rezerwację?
          </h3>
          <p className="mt-2 text-center text-sm text-gray-600">{copy.body}</p>
          {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
          <div className="mt-5 space-y-2">
            <Button
              className={cn(
                "w-full text-white",
                copy.primaryVariant === "redOutline" &&
                  "border-red-500 bg-white text-red-600 hover:bg-red-50",
              )}
              style={copy.primaryVariant === "green" ? { background: BRAND_GREEN } : undefined}
              variant={copy.primaryVariant === "redOutline" ? "outline" : undefined}
              size="cta"
              disabled={isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? "Odwołuję..." : copy.primaryLabel}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              size="cta"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Zostaw rezerwację
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ── CTA zone (T09) ─────────────────────────────────────────────────────

function CtaZone({
  detail,
  isCancelled,
  isFull,
  isBooked,
  withinWindow,
  onBook,
  onOpenCancelSheet,
}: {
  detail: OccurrenceDetail;
  isCancelled: boolean;
  isFull: boolean;
  isBooked: boolean;
  withinWindow: boolean;
  onBook: () => void;
  onOpenCancelSheet: () => void;
}) {
  if (isCancelled) {
    return (
      <Button disabled className="w-full" variant="cta" size="cta">
        Zajęcia odwołane
      </Button>
    );
  }

  if (isBooked) {
    return (
      <div className="space-y-2">
        <CancellationStrip
          deadline={detail.free_cancellation_deadline}
          withinWindow={withinWindow}
          booking={detail.viewer_booking}
        />
        <Button variant="outline" className="w-full" size="cta" onClick={onOpenCancelSheet}>
          Odwołaj rezerwację
        </Button>
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="space-y-1">
        <Button disabled className="w-full" variant="cta" size="cta">
          Brak miejsc
        </Button>
        <p className="text-center text-xs text-gray-500">Zajęcia są w pełni obłożone</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-center text-xs text-gray-500">
        {detail.free_cancellation_deadline
          ? `Bezpłatne odwołanie do ${formatDeadline(detail.free_cancellation_deadline)}`
          : "Bezpłatne odwołanie w dowolnym momencie"}
      </p>
      <Button
        className="w-full text-white"
        style={{ background: BRAND_GREEN }}
        size="cta"
        onClick={onBook}
      >
        Zarezerwuj
      </Button>
    </div>
  );
}

// ── Change-visibility gate (shared with SessionCard's 48h rule) ──────

function isChangeVisible(detail: OccurrenceDetail, isBooked: boolean, now: Date): boolean {
  if (!detail.is_modified) return false;
  if (isBooked) return true;
  if (!detail.modified_at) return false;
  const startMs = new Date(detail.start_time).getTime();
  const modifiedMs = new Date(detail.modified_at).getTime();
  return modifiedMs >= startMs - 48 * 60 * 60 * 1000;
}

// ── Root component ─────────────────────────────────────────────────────

interface SessionDetailModalProps {
  occurrenceId: string | null;
  onClose: () => void;
  /** Called after a successful in-modal cancellation so the parent can refetch the week. */
  onBookingCancelled?: () => void;
}

export function SessionDetailModal({
  occurrenceId,
  onClose,
  onBookingCancelled,
}: SessionDetailModalProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<OccurrenceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);

  useEffect(() => {
    if (!occurrenceId) {
      setDetail(null);
      return;
    }
    setIsLoading(true);
    axiosInstance
      .get<OccurrenceDetail>(`/public/occurrences/${occurrenceId}/detail`)
      .then((r) => setDetail(r.data))
      .catch(() => setDetail(null))
      .finally(() => setIsLoading(false));
  }, [occurrenceId]);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: detail?.template_title, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  if (!occurrenceId) return null;

  if (isLoading || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-full p-1.5 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  const isCancelled = detail.status === "cancelled";
  const isBooked = !!detail.viewer_booking && detail.viewer_booking.status === "booked";
  const isFull = !isBooked && !isCancelled && detail.spots_remaining === 0;
  const now = new Date();
  const withinWindow =
    !detail.free_cancellation_deadline ||
    now.getTime() <= new Date(detail.free_cancellation_deadline).getTime();
  const changeVisible = !isCancelled && isChangeVisible(detail, isBooked, now);
  const showTimeChange = changeVisible && !!detail.previous_start_time;
  const showInstructorChange = changeVisible && !!detail.previous_instructor_name;

  const borderClass =
    isCancelled || !detail.color ? DEFAULT_BORDER : COLOR_BORDER_MAP[detail.color];

  const cancelCopy = detail.viewer_booking
    ? buildCancelCopy(detail.viewer_booking, withinWindow, detail.studio.drop_in_price)
    : null;

  function refetchAfterCancel() {
    setIsCancelSheetOpen(false);
    onBookingCancelled?.();
    onClose();
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden border-2 bg-white",
        borderClass,
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij"
          className="shrink-0 rounded-full p-1.5 hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Udostępnij"
          className="shrink-0 rounded-full p-1.5 hover:bg-gray-100"
        >
          <Share2 className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {isCancelled && <CancelledBanner />}
      {isBooked && !isCancelled && <BookedBanner booking={detail.viewer_booking} />}
      {isBooked && !isCancelled && changeVisible && (
        <ChangedNoticeBanner
          showTimeChange={showTimeChange}
          showInstructorChange={showInstructorChange}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <ModalHeader
          detail={detail}
          isBooked={isBooked}
          showTimeChange={showTimeChange}
          showInstructorChange={showInstructorChange}
          isCancelled={isCancelled}
        />

        {!isBooked && !isCancelled && (
          <div className="px-2">
            <CancellationStrip
              deadline={detail.free_cancellation_deadline}
              withinWindow={withinWindow}
              booking={null}
            />
          </div>
        )}

        <div className="mt-2 divide-y divide-gray-100 border-t border-gray-100">
          <ProwadziSection detail={detail} />
          <OZajeciachSection detail={detail} />
          <CennikSection detail={detail} />
        </div>
        <LokalizacjaSection detail={detail} />
      </div>

      <div className="border-t bg-white px-4 py-3 pb-6 shadow-[0_-4px_16px_0_rgba(0,0,0,0.06)]">
        <CtaZone
          detail={detail}
          isCancelled={isCancelled}
          isFull={isFull}
          isBooked={isBooked}
          withinWindow={withinWindow}
          onBook={() => router.push(`/book/class/${detail.id}`)}
          onOpenCancelSheet={() => setIsCancelSheetOpen(true)}
        />
      </div>

      {detail.viewer_booking && cancelCopy && (
        <CancelSheet
          open={isCancelSheetOpen}
          onOpenChange={setIsCancelSheetOpen}
          bookingId={detail.viewer_booking.id}
          copy={cancelCopy}
          onCancelled={refetchAfterCancel}
        />
      )}
    </div>
  );
}
