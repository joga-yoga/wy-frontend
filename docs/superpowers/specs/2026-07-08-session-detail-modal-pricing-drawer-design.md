# Session Detail Modal — Cennik row + pricing drawer

## Context

The Session Detail Modal (`src/app/(public)/studio/[slug]/schedule/SessionDetailModal.tsx`) currently shows pricing as an inline-collapsible "Cennik i dostęp" section (`PricingSection`, expands in place via local `isOpen` state). This change replaces that with a compact navigation row in the hero fact-cluster that opens the full pricing as a bottom-sheet drawer over the modal. Nothing else in the modal changes.

## Row placement

`PricingRow` (new) renders inside `ModalHeader`, as the last item, after the optional "Zastępstwo" (instructor-change) banner. It's gated on the same `hasPricing || hasSportCards` check the old `PricingSection` used. A top divider (`border-t border-gray-100` + padding) separates it from the static fact rows above it, marking it as an action row rather than an info row. Because `ModalHeader` always renders before `CancellationStrip`/`CtaZone`, this placement satisfies "below Wolne miejsca, above the cancellation strip" in every booking state.

## Row anatomy

Tappable button, full width:
- Wallet icon (lucide `Wallet`) in a 44px `rounded-2xl bg-gray-100 text-gray-500` tile — same tile convention as `IconRow`.
- Title: `Cennik` (normal weight) + `· od {price}` (small, muted, `formatMoney(studio.drop_in_price, studio.currency)`) — omitted entirely when there's no drop-in price.
- Subtitle: `Sprawdź karnety i karty sportowe` (muted, always shown when the row shows at all).
- `ChevronRight` (`h-5 w-5 text-gray-300`) as the only element in the right zone.

## Price anchor rule

`{min}` = `studio.drop_in_price` only. No fallback to a computed per-entry karnet rate, and no comparison against pass prices. If `drop_in_price` is `null`/`undefined`, the `· od {price}` fragment is omitted and the row title is plain `Cennik`. This replaces the current `minPrice()` helper (deleted — no longer used).

## Drawer

Opened by `PricingRow`'s own local `isOpen` state (self-contained, not lifted to the modal root — same pattern as `ExpandableDescription`).

- Custom header (not the default centered `DrawerHeader`): a flex row with `DrawerTitle` "Cennik i dostęp" on the left and an explicit × close button (calls `setIsOpen(false)`) on the right.
- Body: the existing expanded-body JSX from today's `PricingSection` moves in unchanged — drop-in row, pass rows (`LightPassTile`, `perEntry`, `discountPercent`, `formatMoney`), "Pokaż wszystkie karnety (+N)" show-more, and the sport-cards sub-block. Wrapped in `overflow-y-auto` since `DrawerContent` caps at `max-h-[80vh]` but doesn't scroll children by default.
- Dismiss via ×, scrim tap, and swipe-down — all provided by the existing `Drawer`/`DrawerContent` (vaul) primitive, same as `CancelSheet` elsewhere in this file.

## Edge cases

- No pricing at all (`!hasPricing && !hasSportCards`): row doesn't render (same guard as today).
- No drop-in, only passes: row title is plain `Cennik`; drawer still lists the passes.
- No sport cards accepted: drawer omits that sub-block (unchanged existing behavior).

## Non-goals

- No change to any other modal section (header facts, instructor, language, description, location, CTA, states, cancellation flow).
- No rebuilding of pricing components — the pass/discount/sport-card rendering logic is reused verbatim, just moved into the drawer.
- Booking flow unaffected.
