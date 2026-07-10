# DayStrip Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in/out cross-fade animation to the selected-day indicator and make the public schedule page's day-number row swipeable between weeks, both on `/studio/[slug]/grafik`.

**Architecture:** Split the existing `DayStrip` component into a static weekday-label row and a separately draggable numbers row backed by a `motion` (`motion/react`) drag gesture over 3 precomputed week-panels (prev/current/next), so the numbers live-follow the finger and snap to whole-week increments; the selected-day circle becomes a per-button `AnimatePresence` cross-fade. Pure date/week/class-name logic is extracted into a tested utility module; the drag/animation code itself is verified manually (no unit-test harness exists for component rendering in this repo).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, `motion` (`motion/react`, already a dependency, already used for this exact class of animation in `src/components/layout/BottomTabBar.tsx`). No new dependencies.

## Global Constraints

- Scope is the public schedule page only: `src/app/(public)/studio/[slug]/grafik/`. The dashboard's own `DayStrip` fork (`src/app/profile/(dashboard)/schedule/components/DayStrip.tsx`) is untouched — the existing code comment already documents these as intentionally separate components.
- No new dependencies — use `motion` (`^12.40.0`), already installed.
- Adjacent-week session dots are NOT prefetched; they render blank on preview panels and only populate once the parent's post-commit `fetchWeek()` resolves (per approved design).
- Chevron buttons and swipe gestures must trigger the identical animated transition.
- Drag must work with both touch and mouse (motion's `drag` default — no extra wiring).
- This repo has no component-rendering test harness (no Jest/Vitest/RTL configured). The one existing test convention is plain `node:assert` scripts run via `npx tsx <file>.test.ts` (see `src/app/profile/(dashboard)/offer/offerConfig.test.ts`). Follow that convention for any pure-logic tests in this plan.
- Full design detail lives in `docs/superpowers/specs/2026-07-06-daystrip-animations-design.md` — consult it if a task's context feels incomplete.

---

### Task 1: Extract and test pure day/week utilities

**Files:**
- Create: `src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.ts`
- Create: `src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.test.ts`

**Interfaces:**
- Produces (used by every later task in this plan):
  - `interface DayInfo { date: string; dayNumber: number; dayLabel: string; hasSessions: boolean; isWeekend: boolean; isToday: boolean; isPast: boolean; }`
  - `toDateStr(d: Date): string`
  - `addDays(d: Date, days: number): Date`
  - `buildWeekDays(weekStart: Date, sessionCounts: number[], todayStr: string): DayInfo[]`
  - `getLabelColorClass(day: DayInfo): string`
  - `getNumberColorClass(day: DayInfo, isSelected: boolean): string`
  - `getCircleBackgroundClass(day: DayInfo): string`
  - `shouldCommitSwipe(offsetX: number, velocityX: number, width: number): boolean`

- [ ] **Step 1: Write the failing test**

Create `src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.test.ts`:

```ts
import assert from "node:assert/strict";

import {
  addDays,
  buildWeekDays,
  getCircleBackgroundClass,
  getLabelColorClass,
  getNumberColorClass,
  shouldCommitSwipe,
  toDateStr,
} from "./dayStripUtils";

// toDateStr
assert.equal(toDateStr(new Date(2026, 6, 6)), "2026-07-06");
assert.equal(toDateStr(new Date(2026, 0, 1)), "2026-01-01");

// addDays
assert.equal(toDateStr(addDays(new Date(2026, 6, 27), 7)), "2026-08-03");
assert.equal(toDateStr(addDays(new Date(2026, 6, 6), -7)), "2026-06-29");

// buildWeekDays: 2026-07-06 is a Monday, todayStr is Wednesday 2026-07-08
const monday = new Date(2026, 6, 6);
const days = buildWeekDays(monday, [2, 0, 1, 0, 0, 0, 3], "2026-07-08");

assert.equal(days.length, 7);
assert.deepEqual(
  days.map((d) => d.date),
  ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12"],
);
assert.deepEqual(
  days.map((d) => d.dayLabel),
  ["PN", "WT", "ŚR", "CZ", "PT", "SO", "ND"],
);
assert.deepEqual(
  days.map((d) => d.hasSessions),
  [true, false, true, false, false, false, true],
);
assert.deepEqual(
  days.map((d) => d.isWeekend),
  [false, false, false, false, false, true, true],
);
assert.deepEqual(
  days.map((d) => d.isPast),
  [true, true, false, false, false, false, false],
);
assert.deepEqual(
  days.map((d) => d.isToday),
  [false, false, true, false, false, false, false],
);

// buildWeekDays crossing a month boundary
const daysAcrossMonth = buildWeekDays(new Date(2026, 6, 27), [], "2026-07-08");
assert.deepEqual(
  daysAcrossMonth.map((d) => d.dayNumber),
  [27, 28, 29, 30, 31, 1, 2],
);
assert.deepEqual(
  daysAcrossMonth.map((d) => d.date),
  ["2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01", "2026-08-02"],
);

// buildWeekDays: sessionCounts shorter than 7 entries defaults missing days to no sessions
const sparse = buildWeekDays(monday, [1], "2026-07-08");
assert.deepEqual(
  sparse.map((d) => d.hasSessions),
  [true, false, false, false, false, false, false],
);

// getLabelColorClass
assert.equal(getLabelColorClass({ ...days[0], isPast: true, isWeekend: false }), "text-gray-300");
assert.equal(getLabelColorClass({ ...days[0], isPast: false, isWeekend: true }), "text-brand-red");
assert.equal(getLabelColorClass({ ...days[0], isPast: false, isWeekend: false }), "text-gray-500");

// getNumberColorClass
assert.equal(getNumberColorClass({ ...days[0], isToday: true }, true), "text-white");
assert.equal(getNumberColorClass({ ...days[0], isToday: true }, false), "text-brand-green-700");
assert.equal(getNumberColorClass({ ...days[0], isToday: false }, true), "text-white");
assert.equal(getNumberColorClass({ ...days[0], isToday: false, isPast: true }, false), "text-gray-300");
assert.equal(getNumberColorClass({ ...days[0], isToday: false, isPast: false }, false), "text-gray-900");

// getCircleBackgroundClass
assert.equal(getCircleBackgroundClass({ ...days[0], isToday: true }), "bg-brand-green-700");
assert.equal(getCircleBackgroundClass({ ...days[0], isToday: false }), "bg-gray-900");

// shouldCommitSwipe
assert.equal(shouldCommitSwipe(-50, 0, 300), false);
assert.equal(shouldCommitSwipe(-100, 0, 300), true);
assert.equal(shouldCommitSwipe(-10, -600, 300), true);
assert.equal(shouldCommitSwipe(10, 0, 0), false);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx "src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.test.ts"`
Expected: FAIL — `Cannot find module './dayStripUtils'` (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.ts`:

```ts
const DAY_LABELS = ["PN", "WT", "ŚR", "CZ", "PT", "SO", "ND"];
const WEEKEND_INDICES = new Set([5, 6]); // SO, ND

export interface DayInfo {
  date: string;
  dayNumber: number;
  dayLabel: string;
  hasSessions: boolean;
  isWeekend: boolean;
  isToday: boolean;
  isPast: boolean;
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export function buildWeekDays(weekStart: Date, sessionCounts: number[], todayStr: string): DayInfo[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = toDateStr(d);
    return {
      date: dateStr,
      dayNumber: d.getDate(),
      dayLabel: DAY_LABELS[i],
      hasSessions: (sessionCounts[i] ?? 0) > 0,
      isWeekend: WEEKEND_INDICES.has(i),
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
    };
  });
}

export function getLabelColorClass(day: DayInfo): string {
  if (day.isPast) return "text-gray-300";
  if (day.isWeekend) return "text-brand-red";
  return "text-gray-500";
}

export function getNumberColorClass(day: DayInfo, isSelected: boolean): string {
  if (day.isToday) return isSelected ? "text-white" : "text-brand-green-700";
  if (isSelected) return "text-white";
  if (day.isPast) return "text-gray-300";
  return "text-gray-900";
}

export function getCircleBackgroundClass(day: DayInfo): string {
  return day.isToday ? "bg-brand-green-700" : "bg-gray-900";
}

export function shouldCommitSwipe(offsetX: number, velocityX: number, width: number): boolean {
  if (width <= 0) return false;
  const DISTANCE_RATIO = 0.3;
  const VELOCITY_THRESHOLD = 500;
  return Math.abs(offsetX) > width * DISTANCE_RATIO || Math.abs(velocityX) > VELOCITY_THRESHOLD;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx "src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.test.ts"`
Expected: no output, exit code 0 (matches the silent-on-success convention of the existing `offerConfig.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.ts" "src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.test.ts"
git commit -m "Extract DayStrip date/week/class-name logic into tested utilities"
```

---

### Task 2: `DayNumberCircle` — cross-fade selection circle (Feature 1)

**Files:**
- Create: `src/app/(public)/studio/[slug]/grafik/components/DayNumberCircle.tsx`

**Interfaces:**
- Consumes: `DayInfo`, `getCircleBackgroundClass`, `getNumberColorClass` from `./dayStripUtils` (Task 1).
- Produces: `DayNumberCircle({ day, isSelected, showDot, onClick }: { day: DayInfo; isSelected: boolean; showDot: boolean; onClick: () => void }): JSX.Element` — used by `NumbersTrack` (Task 4).

- [ ] **Step 1: Write the component**

Create `src/app/(public)/studio/[slug]/grafik/components/DayNumberCircle.tsx`:

```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

import { getCircleBackgroundClass, getNumberColorClass, type DayInfo } from "./dayStripUtils";

interface DayNumberCircleProps {
  day: DayInfo;
  isSelected: boolean;
  showDot: boolean;
  onClick: () => void;
}

export function DayNumberCircle({ day, isSelected, showDot, onClick }: DayNumberCircleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[40px] flex-col items-center gap-1 px-1.5 py-1"
    >
      <span
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full text-base font-semibold transition-colors duration-150",
          day.isToday && "shadow-[inset_0_0_0_2px_var(--brand-green-700)]",
          getNumberColorClass(day, isSelected),
        )}
      >
        <AnimatePresence initial={false}>
          {isSelected && (
            <motion.span
              className={cn("absolute inset-0 rounded-full", getCircleBackgroundClass(day))}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
        <span className="relative z-10">{day.dayNumber}</span>
      </span>
      <span
        className={cn("h-1 w-1 rounded-full", showDot && day.hasSessions ? "bg-gray-400" : "bg-transparent")}
      />
    </button>
  );
}
```

This preserves the original `DayStrip.tsx`'s exact visual rules (ring on today regardless of selection; green background when today+selected, black otherwise; white text when selected, green-700 when today-not-selected, gray-300 when past, gray-900 default) — only the background circle now mounts/unmounts through `AnimatePresence` instead of a static class.

- [ ] **Step 2: Type-check**

Run: `yarn build`
Expected: build succeeds (this component isn't wired into the app yet, but must type-check cleanly).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/studio/[slug]/grafik/components/DayNumberCircle.tsx"
git commit -m "Add DayNumberCircle with cross-fade selection animation"
```

---

### Task 3: `LabelRow` — static weekday-label row

**Files:**
- Create: `src/app/(public)/studio/[slug]/grafik/components/LabelRow.tsx`

**Interfaces:**
- Consumes: `buildWeekDays`, `getLabelColorClass` from `./dayStripUtils` (Task 1).
- Produces: `LabelRow({ weekStart, todayStr }: { weekStart: Date; todayStr: string }): JSX.Element` — used by `DayStrip` (Task 5).

- [ ] **Step 1: Write the component**

Create `src/app/(public)/studio/[slug]/grafik/components/LabelRow.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";

import { buildWeekDays, getLabelColorClass } from "./dayStripUtils";

interface LabelRowProps {
  weekStart: Date;
  todayStr: string;
}

export function LabelRow({ weekStart, todayStr }: LabelRowProps) {
  const days = buildWeekDays(weekStart, [], todayStr);

  return (
    <div className="flex justify-between gap-1">
      {days.map((day) => (
        <span
          key={day.date}
          className={cn(
            "min-w-[40px] px-1.5 text-center text-xs font-medium uppercase",
            getLabelColorClass(day),
          )}
        >
          {day.dayLabel}
        </span>
      ))}
    </div>
  );
}
```

This row's text and horizontal position never move — only its per-day color can snap (no animation) when `weekStart` changes, reflecting the new week's past/weekend status. It renders outside the draggable track entirely.

- [ ] **Step 2: Type-check**

Run: `yarn build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/studio/[slug]/grafik/components/LabelRow.tsx"
git commit -m "Add static LabelRow for DayStrip"
```

---

### Task 4: `NumbersTrack` — draggable swipeable week track (Feature 2 core)

**Files:**
- Create: `src/app/(public)/studio/[slug]/grafik/components/NumbersTrack.tsx`

**Interfaces:**
- Consumes: `addDays`, `buildWeekDays`, `shouldCommitSwipe`, `toDateStr`, `DayInfo` from `./dayStripUtils` (Task 1); `DayNumberCircle` from `./DayNumberCircle` (Task 2).
- Produces:
  - `interface DayStripHandle { goToPreviousWeek: () => void; goToNextWeek: () => void; }`
  - `NumbersTrack` — a `forwardRef<DayStripHandle, NumbersTrackProps>` component, where
    `interface NumbersTrackProps { weekStart: Date; sessionCounts: number[]; selectedIndex: number; isLoading: boolean; onSelectDay: (index: number) => void; onShiftWeek: (deltaDays: number) => void; }`
  - Used by `DayStrip` (Task 5).

- [ ] **Step 1: Write the component**

Create `src/app/(public)/studio/[slug]/grafik/components/NumbersTrack.tsx`:

```tsx
"use client";

import { animate, motion, useMotionValue, type PanInfo } from "motion/react";
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import { addDays, buildWeekDays, shouldCommitSwipe, toDateStr, type DayInfo } from "./dayStripUtils";
import { DayNumberCircle } from "./DayNumberCircle";

export interface DayStripHandle {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
}

interface NumbersTrackProps {
  weekStart: Date;
  sessionCounts: number[];
  selectedIndex: number;
  isLoading: boolean;
  onSelectDay: (index: number) => void;
  onShiftWeek: (deltaDays: number) => void;
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 42 };

export const NumbersTrack = forwardRef<DayStripHandle, NumbersTrackProps>(function NumbersTrack(
  { weekStart, sessionCounts, selectedIndex, isLoading, onSelectDay, onShiftWeek },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const isAnimating = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keeps the "current" panel centered in the viewport (rest position is -width, since the
  // track renders [prev, current, next] and the current panel must sit in the visible slot).
  // Runs before paint (not a plain effect) so that whenever `weekStart` changes — whether
  // from our own committed swipe/chevron-tap or an external jump like "Dzis" — the transform
  // snaps back to rest in the same frame the new week's numbers render, instead of one frame
  // later where the stale transform would briefly show the wrong panel.
  useLayoutEffect(() => {
    x.set(-width);
  }, [weekStart, width, x]);

  function commit(direction: 1 | -1) {
    if (isAnimating.current || width === 0) return;
    isAnimating.current = true;
    const target = -width - direction * width;
    animate(x, target, {
      ...SPRING,
      onComplete: () => {
        onShiftWeek(direction * 7);
        isAnimating.current = false;
      },
    });
  }

  function cancel() {
    animate(x, -width, SPRING);
  }

  useImperativeHandle(ref, () => ({
    goToPreviousWeek: () => commit(-1),
    goToNextWeek: () => commit(1),
  }));

  const todayStr = toDateStr(new Date());
  const currentDays = buildWeekDays(weekStart, sessionCounts, todayStr);
  const prevDays = buildWeekDays(addDays(weekStart, -7), [], todayStr);
  const nextDays = buildWeekDays(addDays(weekStart, 7), [], todayStr);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <motion.div
        className="flex"
        style={{ x, width: "300%" }}
        drag={width > 0 ? "x" : false}
        dragConstraints={{ left: -2 * width, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_event, info: PanInfo) => {
          if (shouldCommitSwipe(info.offset.x, info.velocity.x, width)) {
            commit(info.offset.x < 0 ? 1 : -1);
          } else {
            cancel();
          }
        }}
      >
        <WeekPanel days={prevDays} width={width} selectedIndex={-1} showDots={false} onSelectDay={() => {}} />
        <WeekPanel
          days={currentDays}
          width={width}
          selectedIndex={selectedIndex}
          showDots={!isLoading}
          onSelectDay={onSelectDay}
        />
        <WeekPanel days={nextDays} width={width} selectedIndex={-1} showDots={false} onSelectDay={() => {}} />
      </motion.div>
    </div>
  );
});

function WeekPanel({
  days,
  width,
  selectedIndex,
  showDots,
  onSelectDay,
}: {
  days: DayInfo[];
  width: number;
  selectedIndex: number;
  showDots: boolean;
  onSelectDay: (index: number) => void;
}) {
  return (
    <div className="flex shrink-0 justify-between gap-1" style={{ width: width || "33.3333%" }}>
      {days.map((day, i) => (
        <DayNumberCircle
          key={day.date}
          day={day}
          isSelected={i === selectedIndex}
          showDot={showDots}
          onClick={() => onSelectDay(i)}
        />
      ))}
    </div>
  );
}
```

Key mechanics: rest position is `x = -width` (the middle of 3 panels). Dragging right (`x` toward `0`) reveals the prev-week panel; dragging left (`x` toward `-2*width`) reveals the next-week panel. `onDragEnd` uses `shouldCommitSwipe` (Task 1) to decide whether to finish the transition (`commit`) or spring back (`cancel`). `commit` animates the rest of the way, then calls `onShiftWeek` — the actual `weekStart` update (and refetch) happens in the parent exactly as it does today via the existing `shiftWeek` function; `useLayoutEffect` then snaps `x` back to `-width` before the browser paints the newly-rendered (now-current) week, so there's no visible jump. Adjacent panels never render session dots (`showDots={false}`), and the current panel hides dots while `isLoading` so a stale week's dot pattern never briefly overlays the new week's numbers.

- [ ] **Step 2: Type-check**

Run: `yarn build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/studio/[slug]/grafik/components/NumbersTrack.tsx"
git commit -m "Add draggable NumbersTrack for swipeable week navigation"
```

---

### Task 5: Rewire `DayStrip` and `StudioSchedulePage`

**Files:**
- Modify: `src/app/(public)/studio/[slug]/grafik/components/DayStrip.tsx` (full rewrite)
- Modify: `src/app/(public)/studio/[slug]/grafik/StudioSchedulePage.tsx:105-347`

**Interfaces:**
- Consumes: `LabelRow` (Task 3), `NumbersTrack` + `DayStripHandle` (Task 4), `toDateStr` (Task 1).
- Produces: `DayStrip` — a `forwardRef<DayStripHandle, DayStripProps>` component where
  `interface DayStripProps { weekStart: Date; sessionCounts: number[]; selectedIndex: number; isLoading: boolean; onSelectDay: (index: number) => void; onShiftWeek: (deltaDays: number) => void; }`

- [ ] **Step 1: Rewrite `DayStrip.tsx`**

Replace the entire contents of `src/app/(public)/studio/[slug]/grafik/components/DayStrip.tsx` with:

```tsx
"use client";

import { forwardRef } from "react";

import { toDateStr } from "./dayStripUtils";
import { LabelRow } from "./LabelRow";
import { NumbersTrack, type DayStripHandle } from "./NumbersTrack";

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
```

- [ ] **Step 2: Wire up `StudioSchedulePage.tsx`**

In `src/app/(public)/studio/[slug]/grafik/StudioSchedulePage.tsx`, add the import (alongside the existing `DayStrip` import around line 13):

```ts
import { DayStrip } from "./components/DayStrip";
import type { DayStripHandle } from "./components/DayStrip";
```

Add a new ref alongside the existing refs (near `headerRef`/`sectionRefs`, around line 116-120):

```ts
const dayStripRef = useRef<DayStripHandle>(null);
```

Replace the chevron buttons block (currently):

```tsx
<button onClick={() => shiftWeek(-7)} className="rounded p-1 hover:bg-gray-100">
  <ChevronLeft size={24} />
</button>
<button onClick={() => shiftWeek(7)} className="rounded p-1 hover:bg-gray-100">
  <ChevronRight size={24} />
</button>
```

with:

```tsx
<button
  onClick={() => dayStripRef.current?.goToPreviousWeek()}
  className="rounded p-1 hover:bg-gray-100"
>
  <ChevronLeft size={24} />
</button>
<button
  onClick={() => dayStripRef.current?.goToNextWeek()}
  className="rounded p-1 hover:bg-gray-100"
>
  <ChevronRight size={24} />
</button>
```

Replace the `<DayStrip />` usage (currently):

```tsx
<DayStrip
  weekStart={weekStart}
  sessionCounts={sessionCounts}
  selectedIndex={selectedIndex}
  onSelectDay={handleSelectDay}
/>
```

with:

```tsx
<DayStrip
  ref={dayStripRef}
  weekStart={weekStart}
  sessionCounts={sessionCounts}
  selectedIndex={selectedIndex}
  isLoading={isLoading}
  onSelectDay={handleSelectDay}
  onShiftWeek={shiftWeek}
/>
```

No other changes to `StudioSchedulePage.tsx` — `shiftWeek`, `weekStart`, `isLoading`, `fetchWeek`, and all scroll-sync logic are unchanged; the chevrons and the swipe gesture now both funnel into the exact same `shiftWeek` call.

- [ ] **Step 3: Type-check**

Run: `yarn build`
Expected: build succeeds with no type errors.

- [ ] **Step 4: Run the Task 1 utility test again (regression check)**

Run: `npx tsx "src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.test.ts"`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/studio/[slug]/grafik/components/DayStrip.tsx" "src/app/(public)/studio/[slug]/grafik/StudioSchedulePage.tsx"
git commit -m "Wire swipeable DayStrip into StudioSchedulePage"
```

---

### Task 6: Manual verification in the browser

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `yarn dev` (from `wy-frontend/`)
Expected: server starts on `http://localhost:3000`.

- [ ] **Step 2: Open the public schedule page on a mobile viewport**

Navigate to `http://localhost:3000/studio/<any-existing-studio-slug>/grafik` with the browser set to a mobile device viewport (per this project's established convention of testing public pages at mobile width).

- [ ] **Step 3: Verify Feature 1 — cross-fade selection**

Tap several different days in the strip in sequence (adjacent and non-adjacent). Confirm:
- The previously-selected day's circle fades and shrinks out in place.
- The newly-selected day's circle fades and grows in in place.
- No circle visibly slides across the gap between two days.
- The "today" ring and text colors still look correct (matching current production behavior).

- [ ] **Step 4: Verify Feature 2 — swipeable numbers row**

- Drag the numbers row left with a finger/mouse, partway, then release before it looks like it's about to commit: confirm it springs back to the original week with the weekday labels never having moved.
- Drag/flick the numbers row left past roughly a third of its width: confirm it commits to the next week, the day list below scrolls to that week's Monday, and the numbers stay live-following the drag the whole time (no jump/flash at release).
- Repeat dragging right to go to the previous week.
- Tap the chevron buttons: confirm they play the same animated transition as a swipe.
- Confirm session dots for the newly-active week appear shortly after the swipe/tap settles (not instantly, not stale from the previous week).
- Rapidly tap a chevron several times in a row: confirm `weekStart` and the visual track never desync (no numbers frozen on the wrong week).

- [ ] **Step 5: Record a performance trace**

Use Chrome DevTools' Performance panel to record a few seconds of dragging the numbers row. Confirm the frame rate stays at/near 60fps during the drag (no long tasks or layout thrashing in the trace).

- [ ] **Step 6: Report results**

Summarize pass/fail for each of steps 3-5. If anything fails, fix it in the relevant component file from Tasks 2-5 and re-verify before considering this plan complete.
