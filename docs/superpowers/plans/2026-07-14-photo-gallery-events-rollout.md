# PhotoGallery Events Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the older `ImageGallery` component with `PhotoGallery` (`variant="grid"`) across the retreats, workshops, courses, and classes detail pages, then retire `ImageGallery`.

**Architecture:** A one-line desktop-sizing fix to `PhotoGalleryGridPreview`'s tiles, then a mechanical `ImageGallery` → `PhotoGallery` swap in four page components (identical props, no adapter needed), then deletion of the now-unused `ImageGallery.tsx` and its barrel export.

**Tech Stack:** Next.js 16 App Router (async server components), TypeScript, Tailwind CSS v4.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-14-photo-gallery-events-rollout-design.md` — every requirement in it must be covered.
- No other JSX in the four pages changes — only the gallery import and render line.
- `PhotoGallery`'s `images` prop already handles `null`/`undefined` internally (`dedupeImages`), so `event.image_ids || []` becomes plain `event.image_ids`.
- Same testing convention as the rest of this component's work: `yarn lint` + `yarn build` per task, plus a manual browser check at the end (no component-test framework in this repo).

---

### Task 1: Fix `PhotoGalleryGridPreview` desktop tile sizing

**Files:**
- Modify: `src/components/custom/PhotoGallery.tsx:196` (tile `className`)

**Interfaces:**
- No signature changes — purely a Tailwind class change on the existing tile `motion.button`.

- [ ] **Step 1: Add the desktop tile height override**

Before:
```tsx
          className={cn(
            "relative aspect-square cursor-pointer overflow-hidden bg-gray-100",
            GRID_TILE_CORNER_CLASSES[i],
          )}
```

After:
```tsx
          className={cn(
            "relative aspect-square cursor-pointer overflow-hidden bg-gray-100 md:aspect-auto md:h-[168px]",
            GRID_TILE_CORNER_CLASSES[i],
          )}
```

This is the only change in this file for this task. Mobile (`aspect-square`) is unchanged; at `md:` and up, tiles get a fixed 168px height instead of scaling with column width, so two rows land close to `ImageGallery`'s old 340px desktop height regardless of how many of the 1–4 preview tiles are actually present (no forced row template, so no empty phantom cells when an event has fewer than 4 photos).

- [ ] **Step 2: Lint and type-check**

Run: `yarn lint`
Expected: no errors.

Run: `yarn build`
Expected: build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/custom/PhotoGallery.tsx
git commit -m "Cap PhotoGalleryGridPreview tile height on desktop"
```

---

### Task 2: Migrate the four Events pages to `PhotoGallery`

**Files:**
- Modify: `src/app/(public)/retreats/[slug]/page.tsx:13,84`
- Modify: `src/app/(public)/workshops/[slug]/page.tsx:6-11,88`
- Modify: `src/app/(public)/courses/[slug]/page.tsx:6,84`
- Modify: `src/app/(public)/classes/[slug]/page.tsx:6-11,88`

**Interfaces:**
- Consumes: `PhotoGallery` from `@/components/custom/PhotoGallery` — `{ images: string[] | null | undefined; alt: string; variant?: "swiper" | "grid" }` (existing component, unchanged by Task 1).

- [ ] **Step 1: `retreats/[slug]/page.tsx`**

Before (lines 6–14):
```tsx
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { JsonLd } from "@/components/seo/JsonLd";
import { isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";
import { getRetreat } from "@/lib/api/getRetreat";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildEventJsonLd, buildPageMetadata } from "@/lib/seo";

import { EventHeader, EventMainContent, EventSidebar, ImageGallery } from "./components";
import { isMultiDayEvent } from "./helpers";
```

After:
```tsx
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { PhotoGallery } from "@/components/custom/PhotoGallery";
import { JsonLd } from "@/components/seo/JsonLd";
import { isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";
import { getRetreat } from "@/lib/api/getRetreat";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildEventJsonLd, buildPageMetadata } from "@/lib/seo";

import { EventHeader, EventMainContent, EventSidebar } from "./components";
import { isMultiDayEvent } from "./helpers";
```

Before (line 84):
```tsx
        <ImageGallery title={event.title} image_ids={event.image_ids || []} />
```

After:
```tsx
        <PhotoGallery images={event.image_ids} alt={event.title} variant="grid" />
```

- [ ] **Step 2: `workshops/[slug]/page.tsx`**

Before (lines 6–18):
```tsx
import {
  EventHeader,
  EventMainContent,
  EventSidebar,
  ImageGallery,
} from "@/app/(public)/retreats/[slug]/components";
import { isMultiDayEvent } from "@/app/(public)/retreats/[slug]/helpers";
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { JsonLd } from "@/components/seo/JsonLd";
import { isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";
import { getWorkshop } from "@/lib/api/getWorkshop";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildEventJsonLd, buildPageMetadata } from "@/lib/seo";
```

After:
```tsx
import {
  EventHeader,
  EventMainContent,
  EventSidebar,
} from "@/app/(public)/retreats/[slug]/components";
import { isMultiDayEvent } from "@/app/(public)/retreats/[slug]/helpers";
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { PhotoGallery } from "@/components/custom/PhotoGallery";
import { JsonLd } from "@/components/seo/JsonLd";
import { isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";
import { getWorkshop } from "@/lib/api/getWorkshop";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildEventJsonLd, buildPageMetadata } from "@/lib/seo";
```

Before (line 88):
```tsx
        <ImageGallery title={event.title} image_ids={event.image_ids || []} />
```

After:
```tsx
        <PhotoGallery images={event.image_ids} alt={event.title} variant="grid" />
```

- [ ] **Step 3: `courses/[slug]/page.tsx`**

Before (line 6):
```tsx
import { EventHeader, ImageGallery } from "@/app/(public)/retreats/[slug]/components";
```

After:
```tsx
import { EventHeader } from "@/app/(public)/retreats/[slug]/components";
import { PhotoGallery } from "@/components/custom/PhotoGallery";
```

Before (line 84):
```tsx
          <ImageGallery title={event.title} image_ids={event.image_ids || []} />
```

After:
```tsx
          <PhotoGallery images={event.image_ids} alt={event.title} variant="grid" />
```

Note the indentation here is one level deeper than the other three pages (this line sits inside the `<div className="flex flex-col gap-4">` wrapper alongside `EventHeader`, per `courses/[slug]/page.tsx:83-86`) — preserve that indentation, don't flatten it to match the other pages.

- [ ] **Step 4: `classes/[slug]/page.tsx`**

Before (lines 6–18):
```tsx
import {
  EventHeader,
  EventMainContent,
  EventSidebar,
  ImageGallery,
} from "@/app/(public)/retreats/[slug]/components";
import { isMultiDayEvent } from "@/app/(public)/retreats/[slug]/helpers";
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { JsonLd } from "@/components/seo/JsonLd";
import { isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";
import { getClass } from "@/lib/api/getClass";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildEventJsonLd, buildPageMetadata } from "@/lib/seo";
```

After:
```tsx
import {
  EventHeader,
  EventMainContent,
  EventSidebar,
} from "@/app/(public)/retreats/[slug]/components";
import { isMultiDayEvent } from "@/app/(public)/retreats/[slug]/helpers";
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { PhotoGallery } from "@/components/custom/PhotoGallery";
import { JsonLd } from "@/components/seo/JsonLd";
import { isEventDetailNotFoundError } from "@/lib/api/eventDetailFetch";
import { getClass } from "@/lib/api/getClass";
import { getOgImageUrl } from "@/lib/imageHelpers";
import { buildEventJsonLd, buildPageMetadata } from "@/lib/seo";
```

Before (line 88):
```tsx
        <ImageGallery title={event.title} image_ids={event.image_ids || []} />
```

After:
```tsx
        <PhotoGallery images={event.image_ids} alt={event.title} variant="grid" />
```

- [ ] **Step 5: Lint and type-check**

Run: `yarn lint`
Expected: no errors (import order matters here — ESLint's `import/order` rule will flag a misplaced `PhotoGallery` import if it lands in the wrong alphabetical group; the before/after blocks above already place it correctly).

Run: `yarn build`
Expected: build succeeds. `ImageGallery` is still exported from the barrel at this point (removed in Task 3), so no dangling-import errors are expected yet.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(public\)/retreats/\[slug\]/page.tsx src/app/\(public\)/workshops/\[slug\]/page.tsx src/app/\(public\)/courses/\[slug\]/page.tsx src/app/\(public\)/classes/\[slug\]/page.tsx
git commit -m "Use PhotoGallery instead of ImageGallery on Events detail pages"
```

---

### Task 3: Remove `ImageGallery` and do final verification

**Files:**
- Delete: `src/app/(public)/retreats/[slug]/components/ImageGallery.tsx`
- Modify: `src/app/(public)/retreats/[slug]/components/index.ts:6`

**Interfaces:**
- None — this only removes now-dead code. Confirmed in the spec's research that no file other than the four migrated pages and this barrel imports `ImageGallery`.

- [ ] **Step 1: Remove the barrel export**

Before (`src/app/(public)/retreats/[slug]/components/index.ts`, full file):
```ts
export * from "./CancellationPolicySection";
export * from "./EventHeader";
export * from "./EventMainContent";
export * from "./EventReservation";
export * from "./EventSidebar";
export * from "./ImageGallery";
export * from "./InstructorSection";
export * from "./OrganizerSection";
```

After:
```ts
export * from "./CancellationPolicySection";
export * from "./EventHeader";
export * from "./EventMainContent";
export * from "./EventReservation";
export * from "./EventSidebar";
export * from "./InstructorSection";
export * from "./OrganizerSection";
```

- [ ] **Step 2: Delete the component file**

```bash
git rm src/app/\(public\)/retreats/\[slug\]/components/ImageGallery.tsx
```

- [ ] **Step 3: Lint and type-check**

Run: `yarn lint`
Expected: no errors, and no more references to `ImageGallery` anywhere (`grep -rn "ImageGallery" src` should return nothing).

Run: `yarn build`
Expected: build succeeds — this is the step that would catch any missed `ImageGallery` reference in a fifth consumer that wasn't found during research.

- [ ] **Step 4: Manual browser verification**

Start the dev server if not already running (`yarn dev`) and check at least one page — e.g. `/wyjazdy/<a-retreat-slug>` or `/wydarzenia/<a-workshop-slug>` — at both a mobile viewport and a wide desktop viewport (~1152px+):
1. The grid preview renders at a reasonable size on both (not oversized on desktop).
2. Tapping a tile opens the drawer to the grid-of-all-photos view, with the `X`/chevron header from the Studio work.
3. Tapping a thumbnail zooms in; swiping between photos and the tap/stagger animations work exactly as already verified on the Studio page.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(public\)/retreats/\[slug\]/components/index.ts
git commit -m "Remove unused ImageGallery component"
```
