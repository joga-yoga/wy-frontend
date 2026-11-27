"use client";

import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

import type { InstructorPublicSchedulePreviewResponse } from "@/app/(public)/instructor/[slug]/schedule/types";
import { SessionCard } from "@/app/(public)/studio/[slug]/schedule/components/SessionCard";
import {
  LinkedSessionDetailDrawer,
  openSessionDetails,
} from "@/app/(public)/studio/[slug]/schedule/LinkedSessionDetailDrawer";
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
  const occurrences = preview?.occurrences ?? [];
  const groups = groupOccurrencesByDay(occurrences);
  const todayStr = formatWarsawDateShort(new Date());

  const drawer = <LinkedSessionDetailDrawer surface={{ instructor_slug: instructorSlug }} />;
  if (groups.length === 0) return drawer;

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
                  onClick={(clicked) => openSessionDetails(clicked.id)}
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

      {drawer}
    </section>
  );
}
