# Grafik Zajęć Preview Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the "Grafik zajęć" preview section on the main public studio page (`/studio/[slug]`) to use the shared `SessionCard` component and a consistent day-label header, instead of its current bespoke row markup and inconsistent header logic.

**Architecture:** `StudioScheduleSneak` (an unexported component inside `src/components/page-contents/studio/StudioPageContent.tsx`) keeps its own data-fetching and today/next-day fallback logic unchanged. Its rendering swaps in `SessionCard` (already used by the full `/studio/[slug]/grafik` page) for each session, and a new pure `formatSneakDayHeader` helper (extracted to its own testable file, since `StudioPageContent.tsx` imports `swiper/css` and other browser-only assets that would break a plain Node test runner) supplies a header shown consistently across the today-has-sessions and fallback-to-next-day cases.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4. No new dependencies — `SessionCard` already exists at `src/app/(public)/studio/[slug]/grafik/components/SessionCard.tsx`.

## Global Constraints

- Scope is only `StudioScheduleSneak` inside `src/components/page-contents/studio/StudioPageContent.tsx`. No other section of that file (HeroSection, PricingSection, InstructorsSection, `ZajeciaPreviewSection`, etc.) changes.
- No changes to the full `/studio/[slug]/grafik` page, `SessionCard`, or `SessionDetailModal` — this plan only adds a new *consumer* of `SessionCard`.
- No `DayStrip` / swipe navigation is added to this section — it stays a single-day, auto-picked preview (today, or the next day this week with sessions).
- The 3-session cap, the whole-week-empty state text, and the "Zobacz pełny grafik" link are unchanged.
- This repo has no component-rendering test harness (no Jest/Vitest/RTL). Pure-logic tests follow the existing `node:assert` + `npx tsx <file>.test.ts` convention (see `src/app/(public)/studio/[slug]/grafik/components/dayStripUtils.test.ts`).
- Full design detail lives in `docs/superpowers/specs/2026-07-06-studio-schedule-sneak-restyle-design.md`.

---

### Task 1: `scheduleSneakUtils.ts` — tested day-header formatter

**Files:**
- Create: `src/components/page-contents/studio/scheduleSneakUtils.ts`
- Create: `src/components/page-contents/studio/scheduleSneakUtils.test.ts`

**Interfaces:**
- Produces: `formatSneakDayHeader(dateStr: string, todayStr: string): string` — used by Task 2. `dateStr`/`todayStr` are `YYYY-MM-DD` strings (matching the format `formatDateShort` already produces elsewhere in `StudioPageContent.tsx`).

- [ ] **Step 1: Write the failing test**

Create `src/components/page-contents/studio/scheduleSneakUtils.test.ts`:

```ts
import assert from "node:assert/strict";

import { formatSneakDayHeader } from "./scheduleSneakUtils";

// today
assert.equal(formatSneakDayHeader("2026-07-08", "2026-07-08"), "Dziś, 8 lipca");

// tomorrow
assert.equal(formatSneakDayHeader("2026-07-09", "2026-07-08"), "Jutro, 9 lipca");

// a later weekday this week (2026-07-11 is a Saturday)
assert.equal(formatSneakDayHeader("2026-07-11", "2026-07-08"), "Sobota, 11 lipca");

// month boundary: today is 2026-07-30, target is two days later (not "tomorrow"), crossing into August
assert.equal(formatSneakDayHeader("2026-08-01", "2026-07-30"), "Sobota, 1 sierpnia");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx "src/components/page-contents/studio/scheduleSneakUtils.test.ts"`
Expected: FAIL — `Cannot find module './scheduleSneakUtils'` (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/components/page-contents/studio/scheduleSneakUtils.ts`:

```ts
function formatDayMonthPL(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatSneakDayHeader(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return `Dziś, ${formatDayMonthPL(dateStr)}`;
  if (dateStr === addDaysStr(todayStr, 1)) return `Jutro, ${formatDayMonthPL(dateStr)}`;
  const weekday = new Date(dateStr + "T00:00:00").toLocaleDateString("pl-PL", { weekday: "long" });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday}, ${formatDayMonthPL(dateStr)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx "src/components/page-contents/studio/scheduleSneakUtils.test.ts"`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/page-contents/studio/scheduleSneakUtils.ts src/components/page-contents/studio/scheduleSneakUtils.test.ts
git commit -m "Add tested day-header formatter for the Grafik zajec preview"
```

---

### Task 2: Restyle `StudioScheduleSneak` with `SessionCard`

**Files:**
- Modify: `src/components/page-contents/studio/StudioPageContent.tsx:23-27` (imports), `:70-73` (remove dead helper), `:92-190` (`StudioScheduleSneak`)

**Interfaces:**
- Consumes: `formatSneakDayHeader` from `./scheduleSneakUtils` (Task 1); `SessionCard` from `@/app/(public)/studio/[slug]/grafik/components/SessionCard` (existing, unchanged — takes `{ occ: PublicOccurrence; onClick?: (occ: PublicOccurrence) => void; now?: Date }`).

- [ ] **Step 1: Add the new imports**

In `src/components/page-contents/studio/StudioPageContent.tsx`, the import block currently reads (around line 20-27):

```ts
import { EventLocation } from "@/app/(public)/retreats/[slug]/components/EventLocation";
import { ClassCard } from "@/app/(public)/studio/[slug]/classes/components/ClassCard";
import type { ClassTemplateListResponse } from "@/app/(public)/studio/[slug]/classes/types";
import { SessionDetailModal } from "@/app/(public)/studio/[slug]/grafik/SessionDetailModal";
import type {
  PublicOccurrence,
  PublicScheduleWeekResponse,
} from "@/app/(public)/studio/[slug]/grafik/types";
```

Add the `SessionCard` import (alphabetically before `SessionDetailModal`) and a new import of `formatSneakDayHeader` alongside the other `@/components/...` imports further down. The full corrected block:

```ts
import { EventLocation } from "@/app/(public)/retreats/[slug]/components/EventLocation";
import { ClassCard } from "@/app/(public)/studio/[slug]/classes/components/ClassCard";
import type { ClassTemplateListResponse } from "@/app/(public)/studio/[slug]/classes/types";
import { SessionCard } from "@/app/(public)/studio/[slug]/grafik/components/SessionCard";
import { SessionDetailModal } from "@/app/(public)/studio/[slug]/grafik/SessionDetailModal";
import type {
  PublicOccurrence,
  PublicScheduleWeekResponse,
} from "@/app/(public)/studio/[slug]/grafik/types";
import { WyImage } from "@/components/custom/WyImage";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { getCurrencySymbol } from "@/lib/currency";
import type { StudioPass, StudioPublic, StudioSportCardAcceptance } from "@/types/studio";

import { formatSneakDayHeader } from "./scheduleSneakUtils";
```

(The new `./scheduleSneakUtils` import goes last, after the `@/...` aliased imports, matching this file's existing import grouping of alias imports before relative ones — there are no other relative imports yet in this file, so it's the only one in that group.)

- [ ] **Step 2: Remove the now-unused `formatTimePL` helper**

Currently at lines 70-73:

```ts
function formatTimePL(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

```

Delete this whole function. It was only used by the `sessionRow` renderer being removed in Step 3 — `SessionCard` does its own time formatting internally. (Do not remove `initials`, `todayLabelPL`, or `formatDateShort`/`getMondayOf` — those are still used elsewhere in this file or within `StudioScheduleSneak`.)

- [ ] **Step 3: Replace `StudioScheduleSneak`'s body**

The current full component (lines 92-190):

```tsx
function StudioScheduleSneak({ studioId, studioSlug }: { studioId: string; studioSlug: string }) {
  const [days, setDays] = useState<PublicScheduleWeekResponse["days"] | null>(null);
  const [selectedOcc, setSelectedOcc] = useState<PublicOccurrence | null>(null);

  useEffect(() => {
    const weekStart = formatDateShort(getMondayOf(new Date()));
    axiosInstance
      .get<PublicScheduleWeekResponse>(`/public/studios/${studioId}/schedule`, {
        params: { week_start: weekStart },
      })
      .then((r) => setDays(r.data.days))
      .catch(() => setDays([]));
  }, [studioId]);

  if (days === null) return null;

  const todayStr = formatDateShort(new Date());
  const todayDay = days.find((d) => d.date === todayStr);
  const todaySessions = todayDay?.occurrences ?? [];
  const todayEmpty = todaySessions.length === 0;

  const nextDay = days.find((d) => d.date > todayStr && d.session_count > 0) ?? null;
  const nextSessions = nextDay?.occurrences.slice(0, 3) ?? [];

  const wholeWeekEmpty = days.every((d) => d.session_count === 0);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateShort(tomorrow);

  const sessionRow = (occ: PublicOccurrence) => (
    <button
      key={occ.id}
      type="button"
      onClick={() => setSelectedOcc(occ)}
      className="flex w-full items-center gap-3 py-3 text-left"
    >
      <div className="w-12 shrink-0 font-mono text-sm text-gray-500">
        {formatTimePL(occ.start_time)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{occ.template_title}</p>
        {(occ.room_name || occ.instructor_name) && (
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {[occ.room_name, occ.instructor_name].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </button>
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Grafik zajęć</h2>

      {wholeWeekEmpty ? (
        <p className="text-sm text-[#717171]">Brak zajęć w tym tygodniu.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {todayEmpty ? (
            <div className="py-3">
              <p className="text-xs text-[#717171]">
                Dziś · {todayLabelPL(new Date())} · brak zajęć
              </p>
            </div>
          ) : null}

          {todayEmpty && nextDay ? (
            <>
              <div className="pb-1 pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-[#717171]">
                  {nextDay.date === tomorrowStr
                    ? "Jutro"
                    : new Date(nextDay.date + "T00:00:00").toLocaleDateString("pl-PL", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                </p>
              </div>
              {nextSessions.map(sessionRow)}
            </>
          ) : null}

          {!todayEmpty ? todaySessions.slice(0, 3).map(sessionRow) : null}
        </div>
      )}

      <Link
        href={`/studio/${studioSlug}/grafik`}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-[#222222] transition-colors hover:bg-gray-50"
      >
        Zobacz pełny grafik
        <ArrowRight className="h-4 w-4" />
      </Link>

      <SessionDetailModal occ={selectedOcc} onClose={() => setSelectedOcc(null)} />
    </section>
  );
}
```

Replace it with:

```tsx
function StudioScheduleSneak({ studioId, studioSlug }: { studioId: string; studioSlug: string }) {
  const [days, setDays] = useState<PublicScheduleWeekResponse["days"] | null>(null);
  const [selectedOcc, setSelectedOcc] = useState<PublicOccurrence | null>(null);

  useEffect(() => {
    const weekStart = formatDateShort(getMondayOf(new Date()));
    axiosInstance
      .get<PublicScheduleWeekResponse>(`/public/studios/${studioId}/schedule`, {
        params: { week_start: weekStart },
      })
      .then((r) => setDays(r.data.days))
      .catch(() => setDays([]));
  }, [studioId]);

  if (days === null) return null;

  const todayStr = formatDateShort(new Date());
  const todayDay = days.find((d) => d.date === todayStr);
  const todaySessions = todayDay?.occurrences ?? [];
  const todayEmpty = todaySessions.length === 0;

  const nextDay = days.find((d) => d.date > todayStr && d.session_count > 0) ?? null;
  const nextSessions = nextDay?.occurrences.slice(0, 3) ?? [];

  const wholeWeekEmpty = days.every((d) => d.session_count === 0);

  return (
    <section className="mx-auto max-w-5xl px-4 py-5">
      <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Grafik zajęć</h2>

      {wholeWeekEmpty ? (
        <p className="text-sm text-[#717171]">Brak zajęć w tym tygodniu.</p>
      ) : (
        <div className="space-y-2">
          {todayEmpty ? (
            <p className="pb-1 text-xs text-[#717171]">
              Dziś · {todayLabelPL(new Date())} · brak zajęć
            </p>
          ) : null}

          {todayEmpty && nextDay ? (
            <>
              <p className="pb-1 text-xs font-medium uppercase tracking-wide text-[#717171]">
                {formatSneakDayHeader(nextDay.date, todayStr)}
              </p>
              {nextSessions.map((occ) => (
                <SessionCard key={occ.id} occ={occ} onClick={setSelectedOcc} />
              ))}
            </>
          ) : null}

          {!todayEmpty ? (
            <>
              <p className="pb-1 text-xs font-medium uppercase tracking-wide text-[#717171]">
                {formatSneakDayHeader(todayStr, todayStr)}
              </p>
              {todaySessions.slice(0, 3).map((occ) => (
                <SessionCard key={occ.id} occ={occ} onClick={setSelectedOcc} />
              ))}
            </>
          ) : null}
        </div>
      )}

      <Link
        href={`/studio/${studioSlug}/grafik`}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-[#222222] transition-colors hover:bg-gray-50"
      >
        Zobacz pełny grafik
        <ArrowRight className="h-4 w-4" />
      </Link>

      <SessionDetailModal occ={selectedOcc} onClose={() => setSelectedOcc(null)} />
    </section>
  );
}
```

Notes on the changes: the outer `divide-y divide-gray-100` wrapper (a hairline-divider list style) is replaced with `space-y-2` (a gapped list), since `SessionCard` already renders its own bordered, rounded card — a divider line butted against a bordered card would look wrong. The `tomorrow`/`tomorrowStr` locals and the inline next-day weekday `toLocaleDateString` call are gone, replaced by `formatSneakDayHeader`. A header now renders in the `!todayEmpty` branch too (previously absent).

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `yarn lint`
Expected: no errors (auto-fixable formatting issues, if any, are applied automatically — re-run `npx tsc --noEmit -p tsconfig.json` afterward if lint touched the file, to confirm it still type-checks).

- [ ] **Step 6: Commit**

```bash
git add src/components/page-contents/studio/StudioPageContent.tsx
git commit -m "Restyle Grafik zajec preview with SessionCard and consistent day header"
```

---

### Task 3: Manual verification in the browser

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `yarn dev` (from `wy-frontend/`), unless already running.

- [ ] **Step 2: Case — today has sessions**

Open `http://localhost:3000/studio/<slug-with-sessions-today>` on a mobile viewport. Scroll to "Grafik zajęć". Confirm:
- A header reading "Dziś, {day} {month}" appears above the cards.
- Sessions render as `SessionCard`s (bordered, rounded, with time/title/instructor, status badges where applicable) — not the old plain rows.
- Clicking a card opens `SessionDetailModal` as before.
- At most 3 cards show even if more sessions exist today.

- [ ] **Step 3: Case — today empty, a later day this week has sessions**

Find or navigate to a studio/week where today has 0 sessions but a later day this week has some (e.g. via the backend: `curl -s "http://localhost:8000/public/studios/<studio-id>/schedule?week_start=<monday>"` and inspect `session_count` per day). Confirm:
- The "Dziś · {label} · brak zajęć" note still appears.
- Below it, a header reading "Jutro, {day} {month}" (if the next day with sessions is tomorrow) or "{Weekday}, {day} {month}" appears, followed by up to 3 `SessionCard`s for that day.

- [ ] **Step 4: Case — whole week empty**

Find or navigate to a studio/week with zero sessions on every day (e.g. `t02-test-studio-defaults` per this repo's seed data, or a far-future week). Confirm the "Brak zajęć w tym tygodniu." text still shows, with no header or cards.

- [ ] **Step 5: Report results**

Summarize pass/fail for each case. If anything fails, fix it in `StudioPageContent.tsx` or `scheduleSneakUtils.ts` and re-verify before considering this plan complete.
