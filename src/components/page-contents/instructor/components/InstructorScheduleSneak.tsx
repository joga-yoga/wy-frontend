"use client";

import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { InstructorPublicSchedulePreviewResponse } from "@/app/(public)/instructor/[slug]/schedule/types";
import { SessionCard } from "@/app/(public)/studio/[slug]/schedule/components/SessionCard";
import { SessionDetailDrawer } from "@/app/(public)/studio/[slug]/schedule/SessionDetailDrawer";
import {
  formatSneakDayHeader,
  formatWarsawDateShort,
  groupOccurrencesByDay,
} from "@/components/page-contents/studio/scheduleSneakUtils";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InstructorScheduleSneakProps {
  instructorSlug: string;
  preview?: InstructorPublicSchedulePreviewResponse | null;
}

export function InstructorScheduleSneak({ instructorSlug, preview }: InstructorScheduleSneakProps) {
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
  const occurrences = preview?.occurrences ?? [];
  const groups = groupOccurrencesByDay(occurrences);
  const todayStr = formatWarsawDateShort(new Date());

  // Mirrors StudioScheduleSneak's pathname-reset effect: the client router cache can keep
  // this component instance (and its state) alive across an away-and-back navigation, so a
  // stale selectedOccurrenceId could reopen the drawer with data from a previous visit.
  const pathname = usePathname();
  const isFirstPathnameEffect = useRef(true);
  useEffect(() => {
    if (isFirstPathnameEffect.current) {
      isFirstPathnameEffect.current = false;
      return;
    }
    setSelectedOccurrenceId(null);
  }, [pathname]);

  if (groups.length === 0) return null;

  return (
    <section id="schedule" className="mx-auto max-w-5xl px-4 py-5 scroll-mt-16">
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
                  context="instructor"
                  onClick={(clicked) => setSelectedOccurrenceId(clicked.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Link
        href={`/instruktor/${instructorSlug}/grafik`}
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
