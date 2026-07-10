# Studio page: standardize on flat list style

## Problem

The public studio page (and its child pages: dedicated classes list, dedicated
schedule, class detail page) mix two visual styles for list rows:

- **Flat rows** (Instructors, Sport Cards sections): no border/background/rounded
  box around each row; items sit directly on the white page.
- **Bordered "card" rows** (Schedule preview, Passes/Cennik, ClassCard used in
  both the studio-page preview and the dedicated `/classes` page, dedicated
  schedule page, and the "Studio" link-card on the class detail page): each
  row wrapped in `rounded-xl border border-gray-200 bg-white`.

The bordered rows add visual weight without adding information — the border is
decorative UI-for-UI's-sake. The goal is to standardize all list rows on the
flat pattern already used by Instructors/Sport Cards.

## Reference pattern

Rows sit directly on the page background (white). Adjacent rows are separated
by a hairline `border-t border-gray-100` divider (no divider before the first
row). No hover background. Thumbnails/avatars keep their own small rounded
shape — that's content, not card chrome. Trailing content is either a
meaningful value (price, fee) or a `ChevronRight`/`ArrowRight` icon when the
row links elsewhere.

This is implemented today via the `i > 0 ? "border-t border-gray-100" : ""`
per-item pattern in `SportCardsSection`, or equivalently a `divide-y
divide-gray-100` wrapper around the row list (used already by the schedule
preview's outer container, minus its bordered box).

## Scope

Six call sites converted from bordered-card rows to the flat reference
pattern, all in `wy-frontend`:

1. **Schedule preview** — `src/components/page-contents/studio/StudioPageContent.tsx`,
   `StudioScheduleSneak`. Remove the `overflow-hidden divide-y divide-gray-100
   rounded-xl border border-gray-200 bg-white` wrapper div; keep `divide-y
   divide-gray-100` behavior but drop `rounded-xl border border-gray-200
   bg-white`. Remove `hover:bg-gray-50` / `transition-colors` from
   `sessionRow`.

2. **Dedicated schedule page** — `src/app/(public)/studio/[slug]/grafik/StudioSchedulePage.tsx`.
   The per-session `<button>` rows currently use `rounded-xl border bg-white
   px-4 py-3 ... hover:bg-gray-50`. Wrap the row list (`selectedDay.occurrences.map`)
   in a `divide-y divide-gray-100` container and reduce each row to flat
   `flex w-full items-center gap-3 px-0 py-3 text-left` (no border/bg/hover).

3. **`ClassCard.tsx`** — `src/app/(public)/studio/[slug]/classes/components/ClassCard.tsx`.
   Shared by the studio-page preview (`ZajeciaPreviewSection`, compact variant)
   and the dedicated `/classes` list page (list variant). Remove `rounded-xl
   border bg-white p-3 ... hover:bg-gray-50` from the `<Link>`; use vertical
   padding only (`py-3`), no horizontal padding (parent sections already have
   their own horizontal padding), no border/bg/hover. Keep the trailing
   `ChevronRight` — the row has no other trailing content to signal
   interactivity. Both call sites (`ZajeciaPreviewSection`'s `space-y-2` div
   and `StudioClassesPage`'s `space-y-2` div) change their wrapper from
   `space-y-2` to `divide-y divide-gray-100`.

4. **Passes list** — `src/components/page-contents/studio/StudioPageContent.tsx`,
   `PricingSection`. The drop-in and per-pass `<button>` rows currently use
   `rounded-xl border border-gray-200 bg-white p-2 pr-4`. Change the
   `space-y-3` wrapper to `divide-y divide-gray-100`, and each row to flat
   `flex w-full items-center gap-4 py-3 text-left` (no border/bg). Keep no
   horizontal padding on the row itself (the wrapper already has none), same
   as the other converted rows.

5. **"Studio" link-card** — `src/app/(public)/studio/[slug]/classes/[classSlug]/ClassLandingPage.tsx`,
   `StudioCardSection`. Remove `rounded-xl border p-3 ... hover:bg-gray-50`
   from the Link; remove the `border border-gray-100` ring around the logo
   thumbnail (keep `rounded-xl bg-white` on the thumbnail itself). Row layout
   otherwise unchanged — matches the Instructor row pattern used higher on the
   same page.

6. **Sport cards / Instructors** — no change; these are the reference.

## Explicitly out of scope

- Amenities pills, Location section — not mentioned, already plain/consistent.
- "View all" / "show more" CTA buttons (`Zobacz pełny grafik`, `Zobacz
  wszystkie zajęcia`, `Pokaż wszystkie karnety`, `Pokaż wszystkie karty`) —
  stay as bordered pill buttons. They're actions, not content rows; the
  border distinguishes "tap to do something" from "this is a list item."

## Non-goals

- No change to data fetching, routing, or component props/interfaces beyond
  className adjustments.
- No change to the Drawer/modal content triggered by these rows.
- No change to spacing between *sections* (only within-section row styling).
