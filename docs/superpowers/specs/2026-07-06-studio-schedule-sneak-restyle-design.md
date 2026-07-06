# Restyle the "Grafik zajęć" preview section with the new schedule/session card style

## Context

The main public studio page (`/studio/[slug]`, rendered by `src/components/page-contents/studio/StudioPageContent.tsx`) has a "Grafik zajęć" preview section, implemented as a locally-defined, unexported component `StudioScheduleSneak` (not shared with anything else). It:

- Fetches the current week's schedule client-side from `/public/studios/{studioId}/schedule`.
- Shows up to 3 sessions for **today** if today has any; otherwise falls back to the **next day this week with at least one session** (labeled "Jutro" or a weekday name); otherwise shows a "Brak zajęć w tym tygodniu" empty state.
- Renders each session with a bespoke inline `sessionRow` button (time, title, room/instructor line) — not the shared `SessionCard` component used by the full `/studio/[slug]/grafik` page.
- Opens the shared `SessionDetailModal` on row click (already shared with the full grafik page).
- Ends with a "Zobacz pełny grafik" link to `/studio/{slug}/grafik`.

This iteration brings the visual style already built for the full grafik page (session cards) into this preview, without adding the swipeable `DayStrip` week navigation — this stays a single-day, auto-picked preview, not a mini version of the full page.

## Changes

### 1. Use `SessionCard` instead of the bespoke row

Import `SessionCard` from `@/app/(public)/studio/[slug]/grafik/components/SessionCard` (the same import path style already used for `SessionDetailModal` and the grafik `types` in this file). Replace the `sessionRow` function and its usages (`nextSessions.map(sessionRow)`, `todaySessions.slice(0, 3).map(sessionRow)`) with:

```tsx
<SessionCard key={occ.id} occ={occ} onClick={setSelectedOcc} />
```

This is a drop-in replacement — `SessionCard` takes `occ: PublicOccurrence` and an optional `onClick`, and is entirely self-contained (its own status colors, capacity/full/cancelled/past badges, booked footer, instructor avatar). No other prop wiring changes.

### 2. Always show a day-label header

Today, a header only appears in the fallback-to-next-day branch (an uppercase tracking-wide label reading "Jutro" or a weekday name) and in the whole-week-empty branch ("Dziś · {label} · brak zajęć"). When today itself has sessions, no header renders at all before the cards.

Add a `formatSneakDayHeader(dateStr: string, todayStr: string): string` helper (local to `StudioPageContent.tsx`, colocated with the other small helpers already there like `formatDateShort`/`todayLabelPL`) that returns:

- `"Dziś, {day} {month}"` if `dateStr === todayStr`
- `"Jutro, {day} {month}"` if `dateStr` is exactly one day after `todayStr`
- `"{Weekday}, {day} {month}"` otherwise (capitalized weekday, Polish locale, no year — this section only ever shows a day within the current week)

Render this header (styled the same as the existing uppercase tracking-wide label already used for the next-day case) above the card list in **both** the today-has-sessions and the fallback-to-next-day branches. The whole-week-empty branch keeps its own distinct empty-state text (no change there).

### 3. Unchanged

- The 3-session cap (`.slice(0, 3)`).
- `StudioScheduleSneak`'s own client-side fetch of the current week — no dependency on the full grafik page's data flow.
- The "today vs. next day with sessions" fallback logic and the whole-week-empty state text.
- The "Zobacz pełny grafik" link.
- `SessionDetailModal` wiring (`selectedOcc` state, `onClose`).
- No `DayStrip` / swipe navigation is added to this section.

## Testing

`formatSneakDayHeader` is pure and easily tested — add `formatSneakDayHeader.test.ts` colocated next to `StudioPageContent.tsx` (or exported for testability if simpler), following the existing `node:assert` + `npx tsx` convention used by `dayStripUtils.test.ts` and `offerConfig.test.ts`. Cover: today, tomorrow, a later weekday, and a month-boundary date.

Beyond that, this is a presentational change with no new business logic — verify manually in the browser (mobile viewport) across three cases: today has sessions, today is empty but a later day this week has some, and the whole week is empty.
