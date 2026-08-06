"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { cn } from "@/lib/utils";

/** Sentinel value for `?studio_id=` that means "show my own instructor schedule"
 * instead of a real studio — one page (`schedule/page.tsx`), one route, mode picked
 * by the query param rather than a second page component. */
export const INSTRUCTOR_VIEW_PARAM = "instructor";

/**
 * Grafik is a single-context workspace (spec-b2b §3) — chips appear only once there
 * are 2+ schedule sources. Each managed studio is its own source; every accepted
 * teaching link collapses into one read-only "Mój grafik" source, since the
 * existing read-only instructor view already aggregates across all of them and this
 * task reuses it rather than rebuilding it per-studio.
 */
export function GrafikContextChips() {
  const { capabilities } = usePartnerCapabilities();
  const searchParams = useSearchParams();

  if (!capabilities) return null;

  const hasTeaching = capabilities.teachingStudios.length > 0;
  const sourceCount = capabilities.managedStudios.length + (hasTeaching ? 1 : 0);
  if (sourceCount < 2) return null;

  const activeParam = searchParams.get("studio_id") || capabilities.managedStudios[0]?.id;
  const isInstructorView = activeParam === INSTRUCTOR_VIEW_PARAM;

  return (
    <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
      {capabilities.managedStudios.map((studio) => {
        const isActive = !isInstructorView && studio.id === activeParam;
        return (
          <Link
            key={studio.id}
            href={`/account/partner/schedule?studio_id=${studio.id}`}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            )}
          >
            {studio.name}
          </Link>
        );
      })}
      {hasTeaching && (
        <Link
          href={`/account/partner/schedule?studio_id=${INSTRUCTOR_VIEW_PARAM}`}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            isInstructorView
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
          )}
        >
          Mój grafik
        </Link>
      )}
    </div>
  );
}
