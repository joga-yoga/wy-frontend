# DayStrip animations: cross-fade selection + swipeable week stripe

## Context

`src/app/(public)/studio/[slug]/grafik/` is the public studio schedule page (`/studio/[slug]/grafik`). Its `DayStrip` component renders the week's 7 day buttons (label, number circle, session-indicator dot). Today the selected-day highlight is a static class swap with no animation, and the week can only be changed via chevron buttons in the parent (`StudioSchedulePage.tsx`) that call `shiftWeek(deltaDays)`, which resets `selectedIndex`/`pendingScrollIndex` and sets `weekStart`.

This iteration adds two purely presentational features, scoped to the public schedule page only (the dashboard's `DayStrip` fork at `src/app/profile/(dashboard)/schedule/components/DayStrip.tsx` is explicitly a separate component per existing code comment and is out of scope).

Reference behavior: iOS Calendar's day-selection cross-fade and week-swipe gestures (user-provided screen captures).

## Feature 1 — Cross-fade selection circle

**Current behavior:** number circle background is `isSelected && "bg-gray-900"`, applied/removed instantly.

**New behavior:** the old day's circle fades + shrinks out in place while the new day's circle fades + grows in in place — no shared element slides across the gap between days.

**Implementation:**
- Number text (and the "today" ring) stay always-rendered, unchanged, `z-10`.
- Add a `motion.span` absolutely positioned behind the number, mounted only when that specific day `isSelected`, wrapped in its own `AnimatePresence initial={false}` (one instance per day button, so each day's mount/unmount animates independently).
- Motion values: `initial={{ opacity: 0, scale: 0.5 }}`, `animate={{ opacity: 1, scale: 1 }}`, `exit={{ opacity: 0, scale: 0.5 }}`, `transition={{ duration: 0.18, ease: "easeOut" }}`.
- Text color swap (white vs. gray/green) keeps its existing instant/CSS-transition behavior — only the circle background gets the `motion` treatment.

## Feature 2 — Swipeable numbers row

**Current behavior:** chevron buttons in `StudioSchedulePage` call `shiftWeek(±7)` directly; the strip re-renders instantly with the new week's numbers.

**New behavior:** the numbers row (not the weekday-label row) is drag-swipeable, live-following the finger like a native calendar, snapping to whole-week increments; chevron taps play the identical animated transition.

**Component split:** `DayStrip` renders two independently-composed rows:
1. **Label row** — static `M T W T F S S` text, pure function of day-of-week, never re-renders on week change.
2. **Numbers track** — the swipeable element, described below.

**Numbers track internals:**
- Renders 3 week-panels in a horizontal flex track: prev week / current week / next week, each panel just 7 number-circles. Panel dates are pure date math (`weekStart ± 7`) — no backend dependency for numbers.
- Only the **current** panel renders session dots, sourced from the existing `sessionCounts` prop. Prev/next preview panels render bare numbers (no dots) — adjacent-week session data is intentionally not prefetched; dots for the new current week appear once the normal post-commit `fetchWeek()` resolves.
- The **selection circle from Feature 1** only ever renders in the current panel (selection is meaningless on preview panels).
- Container width is measured via `ResizeObserver` (updates across viewport/orientation changes) and used for drag constraints and the commit threshold.
- `drag="x"` on the track, `dragConstraints={{ left: -width, right: width }}`, with elastic resistance past the edges (`dragElastic` ~0.15).
- `onDragEnd`: commits (animates the rest of the way to `∓width`) if `|offset.x| > 0.3 * width` or `|velocity.x|` exceeds a flick threshold (~500px/s); otherwise springs back to `0`.
- On commit: calls `onShiftWeek(∓7)` (parent's existing `shiftWeek`, logic unchanged) then instantly resets the track's internal offset to `0` — invisible to the user because the panel that becomes "current" already showed the same numbers during the preview drag.
- Exposes an imperative handle via `forwardRef` + `useImperativeHandle`: `{ goToPreviousWeek(): void; goToNextWeek(): void }`. Each animates the track programmatically through the same commit path used by drag (so chevron and swipe feel identical), then calls `onShiftWeek`.

**Component API changes:**
```ts
interface DayStripProps {
  weekStart: Date;
  sessionCounts: number[];
  selectedIndex: number;
  onSelectDay: (index: number) => void;
  onShiftWeek: (deltaDays: number) => void; // new — called once a swipe/chevron transition commits
}

interface DayStripHandle {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
}

export const DayStrip = forwardRef<DayStripHandle, DayStripProps>(...)
```

**`StudioSchedulePage.tsx` changes:**
- Add `const dayStripRef = useRef<DayStripHandle>(null)`.
- Chevron `onClick` handlers switch from `shiftWeek(-7)`/`shiftWeek(7)` to `dayStripRef.current?.goToPreviousWeek()` / `goToNextWeek()`.
- Pass `ref={dayStripRef}` and `onShiftWeek={shiftWeek}` to `<DayStrip />`. `shiftWeek` itself is unchanged — still the single place that updates `weekStart`, resets `selectedIndex`, and arms `pendingScrollIndex`.

**Data flow / error handling:** No changes to `weekStart` state ownership, `fetchWeek()`, `pendingScrollIndex`, or scroll-sync logic — the animation is a presentation layer in front of the existing, already-error-handled `shiftWeek` → `fetchWeek` path. A swipe either commits (same path as a chevron tap today) or cancels (pure client-side spring-back with no state change, nothing to fail).

**Input support:** `motion`'s `drag` works with both touch and mouse pointer events by default — no extra handling needed for desktop.

**Dependencies:** none new — `motion` (`^12.40.0`) is already installed and already used for this exact class of animation (`BottomTabBar.tsx`'s sliding pill).

## Testing

No meaningful unit-test surface for gesture/animation behavior. Verification is manual, on a mobile viewport:
- Tap different days → circle cross-fades in place, no sliding artifact.
- Drag the numbers row left/right, partial drag → live finger-following preview, release before threshold → springs back.
- Drag past threshold / flick → commits to adjacent week, list below scrolls to Monday of new week (existing `pendingScrollIndex` behavior), dots for the new week appear shortly after (not instantly).
- Chevron taps play the same animated transition as a swipe.
- Rapid repeated swipes/taps don't desync `weekStart` from the visual track position.
- Record a performance trace (Chrome DevTools) during drag to confirm the interaction stays at 60fps.
