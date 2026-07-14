# Roll out PhotoGallery to Workshops/Retreats/Courses/Classes — design

## Context

`PhotoGallery` (`src/components/custom/PhotoGallery.tsx`) was built by extracting and modernizing Studio's hero gallery (see `2026-07-14-photo-gallery-component-design.md`), replacing fixed-overlay modals with a `Drawer`, and later gaining `variant="grid"` plus micro-animations. The public Events pages (retreats, workshops, courses, classes) still use an older, separate `ImageGallery` component (`src/app/(public)/retreats/[slug]/components/ImageGallery.tsx`) with a `Dialog`-based grid/lightbox. This change replaces `ImageGallery` with `PhotoGallery` across all four pages and retires the old component.

## Goals

- Replace `ImageGallery` with `PhotoGallery` (`variant="grid"`) on all four consumers: `retreats/[slug]/page.tsx`, `workshops/[slug]/page.tsx`, `courses/[slug]/page.tsx`, `classes/[slug]/page.tsx`.
- Fix `PhotoGalleryGridPreview`'s tile sizing so it doesn't become oversized inside the wide, padded `container-wy` layout these pages use (unlike Studio's full-bleed hero).
- Remove `ImageGallery.tsx` and its barrel export once unused.

## Non-goals

- Reproducing `ImageGallery`'s richer desktop layout (large featured image + 4 thumbnails) or its separate "all photos" masonry grid mode. Per explicit direction: accept `PhotoGallery`'s current mobile-first behavior everywhere, with only the minimal desktop fix described below — not a full desktop redesign.
- Changing `PhotoGallery`'s API, the Studio integration, or any other consumer.

## Consumers (confirmed, all identical prop shape)

| File | Gallery line | Import source |
|---|---|---|
| `src/app/(public)/retreats/[slug]/page.tsx` | line 84 | `./components` |
| `src/app/(public)/workshops/[slug]/page.tsx` | line 88 | `@/app/(public)/retreats/[slug]/components` |
| `src/app/(public)/courses/[slug]/page.tsx` | line 84 | `@/app/(public)/retreats/[slug]/components` |
| `src/app/(public)/classes/[slug]/page.tsx` | line 88 | `@/app/(public)/retreats/[slug]/components` |

All four currently render `<ImageGallery title={event.title} image_ids={event.image_ids || []} />` inside a `<div className="container-wy mx-auto p-4 pb-3 md:p-8">` wrapper (a padded, max-width-capped container — `container-wy` tops out at `72rem`/1152px — not full-bleed like Studio's `HeroSection`). `event` is typed via the shared `EventDetail` interface (`retreats/[slug]/types.ts`): `title: string`, `image_ids?: string[] | null` — directly assignable to `PhotoGallery`'s `alt: string` and `images: (string | null | undefined)[] | null | undefined` props, no adapter needed. No other file imports `ImageGallery` beyond these four pages and the barrel (`retreats/[slug]/components/index.ts:6`).

## Grid preview desktop sizing fix

`PhotoGalleryGridPreview`'s tiles are currently `aspect-square`, with no cap on the outer container. Inside `container-wy` at its widest (1152px), a 2-column grid of square tiles would be ~570px tall per row — much taller than `ImageGallery`'s old fixed `min-h-[340px]` desktop height, and visually oversized.

Fix: add a fixed desktop tile height directly on the tile (`md:aspect-auto md:h-[168px]`, keeping `aspect-square` for mobile), rather than constraining the outer container's aspect ratio. Two rows of 168px tiles plus the 1px gap land close to `ImageGallery`'s old 340px desktop height. This is deliberately a per-tile fix, not a container-level `aspect-ratio` + forced `grid-rows-2`: a fixed-row container would leave phantom empty grid cells whenever an event has fewer than 4 photos (a real case for newly created listings), since CSS grid still allocates the declared row/column structure regardless of how many children exist. Capping tile height directly lets the grid keep its natural auto-flow (1 row for 1-2 images, 2 rows for 3-4), so fewer photos yield a proportionally shorter preview instead of empty space — mobile is unaffected since the `md:` fix only applies at that breakpoint.

## Migration steps (per page)

1. Drop `ImageGallery` from the page's existing import (barrel or cross-domain import).
2. Add `import { PhotoGallery } from "@/components/custom/PhotoGallery";`.
3. Replace `<ImageGallery title={event.title} image_ids={event.image_ids || []} />` with `<PhotoGallery images={event.image_ids} alt={event.title} variant="grid" />` (the `|| []` fallback is dropped — `PhotoGallery` already dedupes/filters `null`/`undefined` internally).

No other JSX in these pages changes — `EventHeader`, the sidebar/main-content grid, `PublicLocation`, `CourseBottomBar`, etc. are untouched.

## Cleanup

Once all four consumers are migrated, delete `src/app/(public)/retreats/[slug]/components/ImageGallery.tsx` and remove its `export * from "./ImageGallery";` line from `src/app/(public)/retreats/[slug]/components/index.ts`.

## Testing

- `yarn lint` / `yarn build` after each page migration and after the final cleanup deletion (to confirm no dangling imports).
- Manual browser check on at least one page (e.g. a workshop or retreat detail page) at a mobile viewport and a wide desktop viewport (~1152px+), confirming: grid preview renders at a reasonable size on both, tapping a tile opens the drawer, grid-of-all-photos and zoomed swiper both work (swipe, chevron/X header, animations) exactly as already verified on Studio.
