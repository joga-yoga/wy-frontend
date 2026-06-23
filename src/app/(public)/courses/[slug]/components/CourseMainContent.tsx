import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  CreditCard,
  GraduationCap,
  Laptop,
  MapPin,
  Receipt,
  Shuffle,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { EventLocation } from "@/app/(public)/retreats/[slug]/components/EventLocation";
import { formatMultiLineText } from "@/app/(public)/retreats/[slug]/helpers";
import { WyImage } from "@/components/custom/WyImage";
import { getCurrencySymbol } from "@/lib/currency";

import { BALANCE_METHOD_SHORT, formatPolishDate } from "../helpers";
import { CourseEventDetail } from "../types";
import { ExpandableDescription } from "./ExpandableDescription";

// ─── helpers ────────────────────────────────────────────────────────────────

// Use brand colors from globals.css
const AVATAR_COLORS = [
  "bg-brand-aqua/20 text-brand-aqua",
  "bg-brand-blue/20 text-brand-blue",
  "bg-brand-green/20 text-brand-green",
  "bg-brand-yellow/20 text-brand-yellow",
  "bg-brand-pink/20 text-brand-pink",
  "bg-brand-red/20 text-brand-red",
];

function getAvatarColor(name: string) {
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatProgramDateTitle(start?: string | null, end?: string | null): string {
  if (!start) return "";
  const startDate = parseISO(start);
  if (Number.isNaN(startDate.getTime())) return "";

  const endDate = end ? parseISO(end) : null;
  if (!endDate || Number.isNaN(endDate.getTime()) || end === start) {
    return format(startDate, "d MMMM yyyy", { locale: pl });
  }

  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();
  if (sameMonth) {
    return `${format(startDate, "d", { locale: pl })}–${format(endDate, "d MMMM yyyy", { locale: pl })}`;
  }
  if (sameYear) {
    return `${format(startDate, "d MMMM", { locale: pl })} – ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
  }
  return `${format(startDate, "d MMMM yyyy", { locale: pl })} – ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
}

const CERT_DESIGNATION_LABELS: Record<string, string> = {
  RYT_200: "RYT 200",
  RYT_300: "RYT 300",
  RYT_500: "RYT 500",
  RYS: "RYS",
  YACEP: "YACEP",
};

// ─── component ──────────────────────────────────────────────────────────────

interface CourseMainContentProps {
  event: CourseEventDetail;
  eventSlug?: string;
}

export const CourseMainContent: React.FC<CourseMainContentProps> = ({ event, eventSlug }) => {
  const formatBadge = (() => {
    if (event.is_online && event.is_onsite) return { label: "Hybrydowo", Icon: Shuffle };
    if (event.is_online) return { label: "Online", Icon: Laptop };
    if (event.is_onsite) return { label: "Stacjonarnie", Icon: MapPin };
    return null;
  })();

  const dateBadge = formatProgramDateTitle(event.start_date, event.end_date);
  const locationBadge = event.location ? event.location.city || event.location.title || null : null;

  const hasInstructors = event.instructors && event.instructors.length > 0;
  const hasDates = !!event.start_date;
  const hasProgram = !!event.program && event.program.length > 0;
  const hasGoals = event.goals && event.goals.length > 0;
  const hasModules = event.modules && event.modules.length > 0;
  const hasCertification = event.certification != null;
  const hasIncludes = event.includes && event.includes.length > 0;
  const hasPrerequisites = !!event.prerequisites;
  const hasPayment =
    event.deposit_amount != null ||
    (event.balance_payment_methods && event.balance_payment_methods.length > 0) ||
    !!event.payment_terms;
  const hasCancellation = !!event.cancellation_policy;
  const hasImportantInfo = !!event.important_info;

  const fromPrefix = "/kursy";

  return (
    <div className="space-y-0 pb-24 lg:pb-0">
      {/* Tags */}
      {(event.is_teacher_training ||
        formatBadge ||
        dateBadge ||
        locationBadge ||
        event.total_hours != null) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {event.is_teacher_training && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              Kurs nauczycielski
            </span>
          )}
          {formatBadge && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              <formatBadge.Icon className="w-3.5 h-3.5" />
              {formatBadge.label}
            </span>
          )}
          {dateBadge && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              <Calendar className="w-3.5 h-3.5" />
              {dateBadge}
            </span>
          )}
          {locationBadge && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              <MapPin className="w-3.5 h-3.5" />
              {locationBadge}
            </span>
          )}
          {event.total_hours != null && event.total_hours > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              {event.total_hours} godzin
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {event.description && (
        <div className="mt-4">
          <ExpandableDescription text={event.description} />
        </div>
      )}

      {/* Instructors */}
      {hasInstructors && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Prowadzący</h2>
          <div className="space-y-5">
            {event.instructors!.map((instructor) => {
              const initials = getInitials(instructor.name);
              const avatarColor = getAvatarColor(instructor.name);
              const instructorHref =
                instructor.slug && eventSlug
                  ? `/instruktor/${instructor.slug}?from=${fromPrefix}/${eventSlug}`
                  : instructor.slug
                    ? `/instruktor/${instructor.slug}`
                    : null;

              const avatar = instructor.image_id ? (
                <div className="w-12 h-12 rounded-full overflow-hidden relative shrink-0">
                  <WyImage
                    src={instructor.image_id}
                    alt={instructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold shrink-0 ${avatarColor}`}
                >
                  {initials}
                </div>
              );

              const row = (
                <div className="flex items-center gap-3">
                  {avatar}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 leading-tight">{instructor.name}</p>
                    {instructor.short_bio && (
                      <p className="text-sm text-gray-500 leading-tight mt-0.5">
                        {instructor.short_bio}
                      </p>
                    )}
                  </div>
                  {instructorHref && <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />}
                </div>
              );

              return (
                <div key={instructor.id}>
                  {instructorHref ? <Link href={instructorHref}>{row}</Link> : row}
                  {/* {displayBio && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 leading-relaxed">{displayBio}</p>
                      {isLongBio && instructorHref && (
                        <Link
                          href={instructorHref}
                          className="text-sm text-brand-green mt-1 inline-block hover:underline"
                        >
                          Czytaj więcej →
                        </Link>
                      )}
                    </div>
                  )} */}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terminy i zapisy */}
      {hasDates && (
        <div className="lg:hidden">
          <hr className="mt-6" />
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-4">
              {event.enrollment_closes ? "Terminy i zapisy" : "Terminy"}
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Początek</span>
                <span className="text-gray-900 font-medium">
                  {formatPolishDate(event.start_date)}
                </span>
              </div>
              {event.end_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Koniec</span>
                  <span className="text-gray-900 font-medium">
                    {formatPolishDate(event.end_date)}
                  </span>
                </div>
              )}
              {event.enrollment_closes && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Zapisy do</span>
                  <span className="text-gray-900 font-medium">
                    {formatPolishDate(event.enrollment_closes)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Harmonogram */}
      {hasProgram && (
        <>
          <hr className="mt-6" />
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Harmonogram</h2>
            <div className="space-y-6">
              {event.program!.map((block, index) => {
                const title = formatProgramDateTitle(block.start_date, block.end_date);
                return (
                  <div key={index} className="flex items-start gap-4">
                    {block.imageId && (
                      <div className="relative w-20 h-20 md:w-28 md:h-28 shrink-0">
                        <WyImage
                          src={block.imageId}
                          alt={title || `Blok ${index + 1}`}
                          fill
                          className="object-cover rounded-2xl"
                        />
                      </div>
                    )}
                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {title || `Blok ${index + 1}`}
                      </h3>
                      {block.description && (
                        <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {formatMultiLineText(block.description)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Czego się nauczysz */}
      {hasGoals && (
        <>
          <hr className="mt-6" />
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Czego się nauczysz</h2>
            <ul className="space-y-3">
              {event.goals!.map((goal, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">
                    <Check className="w-4 h-4 text-brand-green stroke-[2.5px]" />
                  </span>
                  <span className="text-gray-700">{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Program kursu */}
      {hasModules && (
        <>
          <hr className="mt-6" />
          <div className="pt-6">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-xl font-semibold">Program kursu</h2>
              <span className="text-sm text-gray-500">
                {event.modules!.length > 0 &&
                  `· ${event.modules!.length} moduł${event.modules!.length === 1 ? "" : event.modules!.length < 5 ? "y" : "ów"}`}
                {event.total_hours != null && event.total_hours > 0 && ` · ${event.total_hours}h`}
              </span>
            </div>
            <div className="space-y-4">
              {event.modules!.map((module, i) => (
                <div key={i} className="border-l-[3px] border-brand-green pl-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{module.title}</h3>
                    {module.hours != null && module.hours > 0 && (
                      <span className="text-sm text-gray-500 shrink-0">{module.hours}h</span>
                    )}
                  </div>
                  {module.description && (
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {module.description}
                    </p>
                  )}
                  {module.topics && module.topics.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {module.topics.map((topic, j) => (
                        <li
                          key={j}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >
                          {topic}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Certyfikat */}
      {hasCertification && (
        <>
          <hr className="mt-6" />
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Certyfikat</h2>
            <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-4 flex items-start gap-3">
              <GraduationCap className="w-8 h-8 text-brand-green shrink-0 mt-0.5" />
              <div className="min-w-0">
                {(() => {
                  const cert = event.certification!;
                  const hasDesignation = !!cert.designation;
                  const primaryLine = hasDesignation
                    ? [
                        CERT_DESIGNATION_LABELS[cert.designation!] ?? cert.designation,
                        cert.issuing_body,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : (cert.name ?? cert.issuing_body ?? "");

                  const secondaryLine = hasDesignation
                    ? (cert.name ?? null)
                    : cert.issuing_body && cert.issuing_body !== primaryLine
                      ? cert.issuing_body
                      : null;

                  return (
                    <>
                      <p className="font-semibold text-gray-900">{primaryLine}</p>
                      {cert.type === "recognized" && (
                        <p className="text-sm text-brand-green mt-0.5">
                          Rozpoznany format certyfikatu
                        </p>
                      )}
                      {secondaryLine && (
                        <p className="text-sm text-gray-500 mt-1">{secondaryLine}</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            {event.certification!.hours != null && (
              <p className="text-sm text-gray-500 mt-3">
                Godziny certyfikacji: {event.certification!.hours}h
              </p>
            )}
          </div>
        </>
      )}

      {/* Co otrzymasz */}
      {hasIncludes && (
        <>
          <hr className="mt-6" />
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Co otrzymasz</h2>
            <ul className="space-y-2">
              {event.includes!.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green shrink-0 mt-[7px]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Wymagania */}
      {hasPrerequisites && (
        <>
          <hr className="mt-6" />
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-3">Wymagania</h2>
            <div className="text-gray-600 leading-relaxed">
              {formatMultiLineText(event.prerequisites!)}
            </div>
          </div>
        </>
      )}

      {/* Płatność */}
      {hasPayment && event.price != null && (
        <div className="lg:hidden">
          <hr className="mt-6" />
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Płatność</h2>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4">
                <span className="text-gray-700">Cena całkowita</span>
                <span className="text-2xl font-bold text-gray-900">
                  {event.price.toLocaleString("pl-PL")} {getCurrencySymbol(event.currency)}
                </span>
              </div>
              {(event.deposit_amount != null ||
                (event.balance_payment_methods && event.balance_payment_methods.length > 0) ||
                event.payment_terms) && (
                <>
                  <div className="border-t border-gray-200 mx-4" />
                  <div className="px-4 py-4 space-y-3">
                    {event.deposit_amount != null && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Zadatek (rezerwuje miejsce)</span>
                        <span className="font-medium text-gray-900 text-sm">
                          {event.deposit_amount.toLocaleString("pl-PL")}{" "}
                          {getCurrencySymbol(event.currency)}
                        </span>
                      </div>
                    )}
                    {event.balance_payment_methods && event.balance_payment_methods.length > 0 && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Receipt className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                        <span>
                          Pozostała kwota:{" "}
                          {event.balance_payment_methods
                            .map((m) => BALANCE_METHOD_SHORT[m] ?? m)
                            .join(" lub ")}
                        </span>
                      </div>
                    )}
                    {event.payment_terms && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <CreditCard className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                        <span>{event.payment_terms}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Polityka rezygnacji */}
      {hasCancellation && (
        <>
          <hr className="mt-6" />
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-3">Polityka rezygnacji</h2>
            <div className="text-gray-600 leading-relaxed">
              {formatMultiLineText(event.cancellation_policy!)}
            </div>
          </div>
        </>
      )}

      {/* Ważne informacje */}
      {hasImportantInfo && (
        <>
          <hr className="mt-6" />
          <div className="pt-6">
            <h2 className="text-xl font-semibold mb-3">Ważne informacje</h2>
            <div className="text-gray-600 leading-relaxed">
              {formatMultiLineText(event.important_info!)}
            </div>
          </div>
        </>
      )}

      {/* Lokalizacja — always last */}
      {event.location && (
        <>
          <hr className="mt-6" />
          <div className="pt-6">
            <EventLocation location={event.location} title={event.title} />
          </div>
        </>
      )}
    </div>
  );
};
