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
 * Public-schedule-only day strip (brief §2.3). Forked from the owner-dashboard DayStrip
 * because the two surfaces' today/selected visual rules diverge (green marker + weekend
 * tinting here vs. ring/fill-only there) — not a parameterization of the shared component.
 */
export const DayStrip = forwardRef<DayStripHandle, DayStripProps>(function DayStrip(
  { weekStart, sessionCounts, selectedIndex, isLoading, onSelectDay, onShiftWeek },
  ref,
) {
  return (
    <div className="flex flex-col gap-1">
      <LabelRow weekStart={weekStart} todayStr={toDateStr(new Date())} />
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
