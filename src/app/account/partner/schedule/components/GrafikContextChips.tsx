"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { cn } from "@/lib/utils";

const INSTRUCTOR_PATH = "/account/partner/schedule/instructor";

/**
 * Grafik is a single-context workspace (spec-b2b §3) — chips appear only once there
 * are 2+ schedule sources. Each managed studio is its own source; every accepted
 * teaching link collapses into one read-only "Prowadzę zajęcia" source, since the
 * existing read-only instructor view (`schedule/instructor/page.tsx`) already
 * aggregates across all of them and this task reuses it rather than rebuilding it
 * per-studio.
 */
export function GrafikContextChips() {
  const { capabilities } = usePartnerCapabilities();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!capabilities) return null;

  const hasTeaching = capabilities.teachingStudios.length > 0;
  const sourceCount = capabilities.managedStudios.length + (hasTeaching ? 1 : 0);
  if (sourceCount < 2) return null;

  const isInstructorRoute = pathname === INSTRUCTOR_PATH;
  const activeStudioId = searchParams.get("studio_id") || capabilities.managedStudios[0]?.id;

  return (
    <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
      {capabilities.managedStudios.map((studio) => {
        const isActive = !isInstructorRoute && studio.id === activeStudioId;
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
          href={INSTRUCTOR_PATH}
          className={cn(
            "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            isInstructorRoute
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
          )}
        >
          Prowadzisz <Lock size={12} className="opacity-70" />
        </Link>
      )}
    </div>
  );
}
