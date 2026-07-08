"use client";

import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  Clock,
  ClockAlert,
  DoorOpen,
  Flower2,
  Languages,
  Share2,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoChevronForward, IoLanguage, IoLanguageOutline } from "react-icons/io5";

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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

// Older events store ISO 639-1 codes rather than the full Polish word.
const LANGUAGE_CODE_TO_NAME: Record<string, string> = {
  pl: "polski",
  en: "angielski",
  uk: "ukraiński",
  de: "niemiecki",
  fr: "francuski",
  es: "hiszpański",
  ru: "rosyjski",
  it: "włoski",
};

function languageName(language: string): string {
  return LANGUAGE_CODE_TO_NAME[language.toLowerCase()] ?? language;
}

function instrumental(language: string): string {
  const name = languageName(language);
  return LANGUAGE_INSTRUMENTAL[name.toLowerCase()] ?? name;
}

function joinPolish(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} i ${items[items.length - 1]}`;
}

function buildLanguageLines(
  sessionLanguage: string | null | undefined,
  instructor: OccurrenceDetailInstructor | null | undefined,
): { sessionLanguageInstrumental: string; extra: string | null } | null {
  if (!sessionLanguage) return null;
  const sessionLanguageInstrumental = instrumental(sessionLanguage);
  const sessionLanguageName = languageName(sessionLanguage).toLowerCase();
  const extraLanguages = (instructor?.languages ?? []).filter(
    (l) => languageName(l).toLowerCase() !== sessionLanguageName,
  );
  if (extraLanguages.length === 0 || !instructor) {
    return { sessionLanguageInstrumental, extra: null };
  }
  const firstName = instructor.name.split(" ")[0];
  const joined = joinPolish(extraLanguages.map(instrumental));
  return {
    sessionLanguageInstrumental,
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
  neutral: "bg-gray-100 text-gray-700",
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
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
          TILE_TONE_CLASSES[tone],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className={cn("text-base font-semibold", VALUE_TONE_CLASSES[tone])}>
          {value}
          {hint && <span className="ml-1 font-normal text-gray-500">· {hint}</span>}
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
  withinWindow,
}: {
  detail: OccurrenceDetail;
  isBooked: boolean;
  showTimeChange: boolean;
  showInstructorChange: boolean;
  isCancelled: boolean;
  withinWindow: boolean;
}) {
  const fillTone = computeFillTone(detail.spots_remaining, isBooked);
  const showRoom = detail.studio.room_count >= 2 && !!detail.room_name;
  const duration = formatDurationMinutes(detail.start_time, detail.end_time);

  return (
    <div className="space-y-4 px-4 pt-4">
      <h1
        className={cn(
          "text-2xl font-bold text-gray-900",
          isCancelled && "text-gray-400 line-through",
        )}
      >
        {detail.template_title}
      </h1>

      <IconRow
        icon={<Calendar className="h-5 w-5" />}
        label="Termin"
        value={<span className="capitalize">{formatDayHeader(detail.calendar_date)}</span>}
        tone={isCancelled ? "neutral" : "neutral"}
      />

      <IconRow
        icon={<Clock className="h-5 w-5" />}
        label={showTimeChange ? "Godzina · zmieniona" : "Godzina"}
        value={
          <>
            {showTimeChange && detail.previous_start_time && (
              <span className="mr-1.5 text-gray-400 line-through">
                {formatTime(detail.previous_start_time)}
              </span>
            )}
            {formatTime(detail.start_time)} – {formatTime(detail.end_time)}
          </>
        }
        hint={`${duration} min`}
        tone={showTimeChange ? "amber" : "neutral"}
      />

      {showRoom && (
        <IconRow icon={<DoorOpen className="h-5 w-5" />} label="Sala" value={detail.room_name} />
      )}

      {detail.capacity != null && (
        <IconRow
          icon={<Users className="h-5 w-5" />}
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
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
          <span>Zastępstwo na tych zajęciach</span>
        </div>
      )}

      <PricingRow studio={detail.studio} />
      {!isBooked && !isCancelled && (
        <CancellationStrip
          deadline={detail.free_cancellation_deadline}
          withinWindow={withinWindow}
          booking={null}
        />
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
      <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">
        <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-emerald-600" />
        <span>
          {deadline ? (
            <>
              Bezpłatne odwołanie do{" "}
              <strong className="font-semibold">{formatDeadline(deadline)}</strong>
            </>
          ) : (
            "Bezpłatne odwołanie w dowolnym momencie"
          )}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">
      <ClockAlert className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gray-400" />
      <span>
        Bezpłatny termin odwołania minął{deadline ? ` o ${formatDeadline(deadline)}` : ""}. Możesz
        nadal odwołać, ale {lateCancelCostClause(booking)}.
      </span>
    </div>
  );
}

// ── Instructor section (T06) ───────────────────────────────────────────

function InstructorSection({ detail }: { detail: OccurrenceDetail }) {
  const instructor = detail.instructor;
  if (!instructor) return null;
  const languageLines = buildLanguageLines(detail.language, instructor);
  const href = instructor.slug ? `/instruktor/${instructor.slug}` : null;

  const row = (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-amber-50">
        {instructor.image_id ? (
          <WyImage src={instructor.image_id} alt={instructor.name} fill className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-base font-semibold text-amber-800">
            {initials(instructor.name)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-gray-900">{instructor.name}</p>
        {instructor.short_bio && (
          <p className="truncate text-sm text-gray-500">{instructor.short_bio}</p>
        )}
      </div>
      {href && <IoChevronForward className="h-5 w-5 shrink-0 text-gray-500" />}
    </div>
  );

  return (
    <section className="flex flex-col gap-3 px-4 py-4">
      <p className="text-[18px] font-semibold text-[#222222]">Instruktor</p>
      {href ? <Link href={href}>{row}</Link> : row}
      {languageLines && (
        <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm leading-relaxed text-gray-600">
          <IoLanguage className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gray-500" />
          <span>
            Zajęcia prowadzone po{" "}
            <strong className="font-semibold text-gray-900">
              {languageLines.sessionLanguageInstrumental}
            </strong>
            .{languageLines.extra && <> {languageLines.extra}</>}
          </span>
        </div>
      )}
    </section>
  );
}

// ── About-class section (T06) ─────────────────────────────────────────

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight);
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={cn(
          "whitespace-pre-line text-base leading-[1.65] text-gray-700",
          !expanded && "line-clamp-3",
        )}
      >
        {text}
      </p>
      {!expanded && isClamped && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-sm font-medium text-gray-500 underline underline-offset-2"
        >
          Pokaż więcej
        </button>
      )}
    </div>
  );
}

function AboutClassSection({ detail }: { detail: OccurrenceDetail }) {
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
      <p className="text-[18px] font-semibold text-[#222222]">O zajęciach</p>
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

// ── Pricing row + drawer (T07) ─────────────────────────────────

function PricingRow({ studio }: { studio: OccurrenceDetail["studio"] }) {
  const [showAllPasses, setShowAllPasses] = useState(false);
  const hasDropIn = studio.drop_in_price != null;
  const hasPricing = hasDropIn || studio.passes.length > 0;
  const hasSportCards = studio.accepts_sport_cards != null;
  if (!hasPricing && !hasSportCards) return null;

  const passLimit = hasDropIn ? 2 : 3;
  const visiblePasses = showAllPasses ? studio.passes : studio.passes.slice(0, passLimit);
  const hiddenPassCount = studio.passes.length - passLimit;

  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger className="flex w-full items-center gap-3 text-left">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            TILE_TONE_CLASSES.neutral,
          )}
        >
          <Wallet className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Cennik
            {hasDropIn && (
              <span className="ml-1 text-sm font-normal text-gray-500">
                · od {formatMoney(studio.drop_in_price, studio.currency)}
              </span>
            )}
          </p>
          <p className="text-base text-gray-500">Sprawdź karnety i karty sportowe</p>
        </div>
        <IoChevronForward className="h-5 w-5 shrink-0 text-gray-500" />
      </DrawerTrigger>

      <DrawerContent>
        <div className="flex items-center justify-between px-4 pb-3 pt-2">
          <DrawerTitle className="text-lg font-semibold text-gray-900">Cennik i dostęp</DrawerTitle>
          <DrawerClose
            aria-label="Zamknij"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm"
          >
            <X className="h-5 w-5" />
          </DrawerClose>
        </div>

        <div className="overflow-y-auto px-4 pb-6">
          <div className="space-y-4">
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ── Studio section (T07) ───────────────────────────────────────────────

function StudioSection({ studio }: { studio: OccurrenceDetail["studio"] }) {
  const href = studio.slug ? `/studio/${studio.slug}` : null;

  const row = (
    <div className="flex items-center gap-3">
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
      {href && <IoChevronForward className="h-5 w-5 shrink-0 text-gray-500" />}
    </div>
  );

  return (
    <section className="space-y-3 px-4 py-4">
      <p className="text-[18px] font-semibold text-[#222222]">Studio</p>
      {href ? <Link href={href}>{row}</Link> : row}
    </section>
  );
}

// ── Location section (T07) ─────────────────────────────────────────

function LocationSection({ detail }: { detail: OccurrenceDetail }) {
  const { studio } = detail;
  const location = studio.location;
  const hasLatLng = location?.latitude != null && location?.longitude != null;
  if (!studio.address && !hasLatLng) return null;

  const mapsHref = googleMapsUrl(studio.address);

  return (
    <section className="border-t border-gray-100 px-4 pt-4 pb-8">
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
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <div className="px-4 pb-6 pt-2">
          {copy.showPositiveIcon && (
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#4F8A62]/10">
              <Check className="h-6 w-6" style={{ color: BRAND_GREEN }} />
            </div>
          )}
          <p className="text-center text-sm font-medium uppercase tracking-wide text-gray-400">
            {copy.stateLabel}
          </p>
          <DrawerTitle className="mt-1 text-center text-xl font-semibold text-gray-900">
            Odwołać rezerwację?
          </DrawerTitle>
          <DrawerDescription className="mt-2 text-center text-base text-gray-600">
            {copy.body}
          </DrawerDescription>
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
            <DrawerClose
              render={<Button variant="secondary" className="w-full" size="cta" />}
              disabled={isSubmitting}
            >
              Zostaw rezerwację
            </DrawerClose>
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
      <Button disabled className="w-full" variant="green" size="cta">
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
        <Button disabled className="w-full" variant="green" size="cta">
          Brak miejsc
        </Button>
        <p className="text-center text-sm text-gray-500">Zajęcia są w pełni obłożone</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-gray-500">
        {detail.free_cancellation_deadline
          ? `Bezpłatne odwołanie do ${formatDeadline(detail.free_cancellation_deadline)}`
          : "Bezpłatne odwołanie w dowolnym momencie"}
      </p>
      <Button className="w-full" size="cta" variant="green" onClick={onBook}>
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

interface SessionDetailDrawerProps {
  occurrenceId: string | null;
  onClose: () => void;
  /** Called after a successful in-drawer cancellation so the parent can refetch the week. */
  onBookingCancelled?: () => void;
}

export function SessionDetailDrawer({
  occurrenceId,
  onClose,
  onBookingCancelled,
}: SessionDetailDrawerProps) {
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

  const isReady = !isLoading && !!detail;
  const isCancelled = detail?.status === "cancelled";
  const isBooked = !!detail?.viewer_booking && detail.viewer_booking.status === "booked";
  const isFull = isReady && !isBooked && !isCancelled && detail.spots_remaining === 0;
  const now = new Date();
  const withinWindow =
    !detail?.free_cancellation_deadline ||
    now.getTime() <= new Date(detail.free_cancellation_deadline).getTime();
  const changeVisible = isReady && !isCancelled && isChangeVisible(detail, isBooked, now);
  const showTimeChange = changeVisible && !!detail?.previous_start_time;
  const showInstructorChange = changeVisible && !!detail?.previous_instructor_name;

  const borderClass =
    !detail || isCancelled || !detail.color ? DEFAULT_BORDER : COLOR_BORDER_MAP[detail.color];

  const cancelCopy = detail?.viewer_booking
    ? buildCancelCopy(detail.viewer_booking, withinWindow, detail.studio.drop_in_price)
    : null;

  function refetchAfterCancel() {
    setIsCancelSheetOpen(false);
    onBookingCancelled?.();
    onClose();
  }

  return (
    <Drawer
      open={!!occurrenceId}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      snapPoints={[1]}
      showSwipeHandle
    >
      <DrawerContent className={cn("border-2", borderClass)}>
        <DrawerTitle className="sr-only">{detail?.template_title ?? "Szczegóły zajęć"}</DrawerTitle>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-3">
            <DrawerClose
              aria-label="Zamknij"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm"
            >
              <X className="h-5 w-5" />
            </DrawerClose>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Udostępnij"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {isReady && detail ? (
            <>
              <div className="flex min-h-0 flex-1 flex-col pt-2">
                {isCancelled && <CancelledBanner />}
                {isBooked && !isCancelled && <BookedBanner booking={detail.viewer_booking} />}
                {isBooked && !isCancelled && changeVisible && (
                  <ChangedNoticeBanner
                    showTimeChange={showTimeChange}
                    showInstructorChange={showInstructorChange}
                  />
                )}

                <div className="min-h-0 flex-1 overflow-y-auto pt-12">
                  <ModalHeader
                    detail={detail}
                    isBooked={isBooked}
                    showTimeChange={showTimeChange}
                    showInstructorChange={showInstructorChange}
                    isCancelled={isCancelled}
                    withinWindow={withinWindow}
                  />

                  <div className="mt-2 divide-y divide-gray-100 border-t border-gray-100">
                    <InstructorSection detail={detail} />
                    <AboutClassSection detail={detail} />
                    <StudioSection studio={detail.studio} />
                  </div>
                  <LocationSection detail={detail} />
                </div>
              </div>

              <div className="shrink-0 border-t bg-white p-4 pt-3 shadow-[0_-4px_16px_0_rgba(0,0,0,0.06)]">
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
            </>
          ) : (
            <div className="min-h-0 flex-1" />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
