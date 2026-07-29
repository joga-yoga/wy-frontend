"use client";

import { forwardRef } from "react";

import { toDateStr } from "./dayStripUtils";
import { LabelRow } from "./LabelRow";
import { type DayStripHandle, NumbersTrack } from "./NumbersTrack";

export type { DayStripHandle };

interface DayStripProps {
  weekStart: Date;
  sessionCounts: number[];
  selectedIndex: number;
  isLoading: boolean;
  onSelectDay: (index: number) => void;
  onShiftWeek: (deltaDays: number) => void;
}

/**
 * Swipeable week day-strip — copied verbatim from the public studio schedule
 * (`(public)/studio/[slug]/schedule/components/`), which owns the canonical version.
 * No public-booking-specific logic lives here (pure date/UI), so Grafik reuses it as-is
 * rather than maintaining a second, visually-diverging implementation.
 */
export const DayStrip = forwardRef<DayStripHandle, DayStripProps>(function DayStrip(
  { weekStart, sessionCounts, selectedIndex, isLoading, onSelectDay, onShiftWeek },
  ref,
) {
  return (
    <div className="flex flex-col gap-0">
      <LabelRow
        weekStart={weekStart}
        todayStr={toDateStr(new Date())}
        sessionCounts={sessionCounts}
        isLoading={isLoading}
      />
      <NumbersTrack
        ref={ref}
        weekStart={weekStart}
        sessionCounts={sessionCounts}
        selectedIndex={selectedIndex}
        isLoading={isLoading}
        onSelectDay={onSelectDay}
        onShiftWeek={onShiftWeek}
      />
    </div>
  );
});
