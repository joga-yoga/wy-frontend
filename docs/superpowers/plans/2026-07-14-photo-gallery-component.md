# PhotoGallery Component Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the Studio hero's photo gallery (embedded swiper + grid/lightbox overlays) into a standalone `PhotoGallery` component reusable later by Events, replacing the two fixed-overlay modals with one shadcn `Drawer`.

**Architecture:** A single new file, `src/components/custom/PhotoGallery.tsx`, exports `PhotoGallery` (public) — an embedded `Swiper` with a counter badge — plus an internal `PhotoGalleryDrawer` holding `view: "grid" | "zoomed"` state, replacing `GalleryGridModal`/`GalleryLightbox`. `StudioPageContent.tsx`'s `HeroSection` is then updated to render `<PhotoGallery>` instead of its inline gallery code, and the now-dead gallery functions/imports are removed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI `Drawer`), `swiper`/`swiper/react`, `lucide-react` icons.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-14-photo-gallery-component-design.md` — every requirement in it must be covered.
- `PhotoGalleryProps.images` accepts `(string | null | undefined)[] | null | undefined` and the component dedupes/filters internally (`Array.from(new Set(images.filter(Boolean)))`).
- `variant` prop: `"swiper" | "grid"`, default `"swiper"`. `"grid"` is typed only — no rendering branch in this change (future work).
- Drawer config: `snapPoints={[1]}`, `showSwipeHandle`, matching `SessionDetailDrawer`'s full-height-sheet pattern.
- Chevron (`ChevronLeft`, left-aligned) always closes the drawer entirely and resets `view` back to `"grid"`, regardless of which view is showing or how the close was triggered (chevron, swipe, backdrop, Esc).
- No component-test framework exists in this repo (only Playwright e2e via `test:e2e`, and a couple of `node:test` unit tests for pure helper functions — no React Testing Library or component-render tests anywhere, including for the existing Drawer-based components this design mirrors). Per "follow established patterns," this plan verifies each task with `yarn lint`, `yarn build` (type-check), and manual browser verification instead of introducing new component-test tooling.
- Never touch the unrelated, already-uncommitted WIP changes present in `StudioPageContent.tsx` (a schedule heading string change, removed yoga-styles chips block, removed `passDetailLines` helper) — they are pre-existing in the working tree and out of scope for this plan. Note: this WIP change already left `styles` (line 365) and `showAllStyles`/`setShowAllStyles` (line 366) in `HeroSection` unused — a pre-existing lint complaint unrelated to this plan's changes. Don't fix it as part of this work.

---

### Task 1: Create the `PhotoGallery` component

**Files:**
- Create: `src/components/custom/PhotoGallery.tsx`

**Interfaces:**
- Produces: `export function PhotoGallery(props: PhotoGalleryProps): JSX.Element` where
  ```ts
  interface PhotoGalleryProps {
    images: (string | null | undefined)[] | null | undefined;
    alt: string;
    variant?: "swiper" | "grid";
    className?: string;
  }
  ```

- [ ] **Step 1: Write the component file**

```tsx
"use client";

import "swiper/css";

import { ChevronLeft, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper/types";

import { WyImage } from "@/components/custom/WyImage";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  images: (string | null | undefined)[] | null | undefined;
  alt: string;
  variant?: "swiper" | "grid";
  className?: string;
}

function dedupeImages(images: (string | null | undefined)[] | null | undefined): string[] {
  return Array.from(new Set(images?.filter((image): image is string => Boolean(image)) ?? []));
}

function PhotoGalleryDrawer({
  images,
  alt,
  open,
  onOpenChange,
}: {
  images: string[];
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [view, setView] = useState<"grid" | "zoomed">("grid");
  const [zoomedIndex, setZoomedIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) setView("grid");
    onOpenChange(next);
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} snapPoints={[1]} showSwipeHandle>
      <DrawerContent>
        <DrawerTitle className="sr-only">Zdjęcia</DrawerTitle>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <DrawerClose aria-label="Zamknij" className="text-gray-900">
            <ChevronLeft className="h-6 w-6" />
          </DrawerClose>
          <span className="text-sm font-semibold text-gray-900">
            {view === "grid" ? `Zdjęcia · ${images.length}` : `${zoomedIndex + 1}/${images.length}`}
          </span>
          <div className="w-6" />
        </div>

        {view === "grid" ? (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-1.5">
              {images.map((image, i) => (
                <button
                  key={`${image}-${i}`}
                  type="button"
                  onClick={() => {
                    setZoomedIndex(i);
                    setView("zoomed");
                  }}
                  className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  <WyImage
                    src={image}
                    alt={`${alt} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center">
            <Swiper
              initialSlide={zoomedIndex}
              onSwiper={(s) => (swiperRef.current = s)}
              onSlideChange={(s) => setZoomedIndex(s.activeIndex)}
              className="h-full w-full"
            >
              {images.map((image, i) => (
                <SwiperSlide key={`${image}-${i}`} className="flex items-center justify-center">
                  <div className="relative h-full w-full">
                    <WyImage
                      src={image}
                      alt={`${alt} ${i + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export function PhotoGallery({
  images: rawImages,
  alt,
  variant = "swiper",
  className,
}: PhotoGalleryProps) {
  void variant; // "grid" not implemented yet — always renders the swiper view
  const images = dedupeImages(rawImages);
  const [activeIndex, setActiveIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "relative cursor-pointer overflow-hidden bg-gray-100 aspect-[4/4] md:aspect-[21/9]",
          className,
        )}
        onClick={() => images.length > 0 && setDrawerOpen(true)}
      >
        {images.length > 0 ? (
          <Swiper onSlideChange={(s) => setActiveIndex(s.activeIndex)} className="h-full w-full">
            {images.map((image, i) => (
              <SwiperSlide key={`${image}-${i}`}>
                <div className="relative h-full w-full">
                  <WyImage
                    src={image}
                    alt={`${alt} ${i + 1}`}
                    fill
                    fetchPriority={i === 0 ? "high" : undefined}
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {images.length > 1 && (
          <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md bg-gray-800/80 px-2.5 py-1 text-xs font-semibold text-white">
            {activeIndex + 1}/{images.length}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <PhotoGalleryDrawer
          images={images}
          alt={alt}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Type-check and lint the new file**

Run: `yarn lint`
Expected: no errors reported for `src/components/custom/PhotoGallery.tsx` (pre-existing `styles`/`showAllStyles` unused-var warnings in `StudioPageContent.tsx` are expected and unrelated — see Global Constraints).

Run: `yarn build`
Expected: build completes with no new TypeScript errors attributable to `PhotoGallery.tsx`. (`PhotoGallery` isn't imported anywhere yet, so `build` only validates the file compiles standalone — Task 2 wires it in.)

- [ ] **Step 3: Commit**

```bash
git add src/components/custom/PhotoGallery.tsx
git commit -m "Add standalone PhotoGallery component with Drawer-based grid/lightbox"
```

---

### Task 2: Wire `PhotoGallery` into `HeroSection` and remove dead gallery code

**Files:**
- Modify: `src/components/page-contents/studio/StudioPageContent.tsx:1-38` (imports), `:176-280` (delete `GalleryLightbox`/`GalleryGridModal`), `:352-440` (`HeroSection`)

**Interfaces:**
- Consumes: `PhotoGallery` from `@/components/custom/PhotoGallery` — `{ images, alt, className? }` (from Task 1).

- [ ] **Step 1: Update imports at the top of `StudioPageContent.tsx`**

Remove the now-unused `"swiper/css"` import, `Swiper`/`SwiperSlide`/`SwiperType` imports, `ChevronLeft` and `ImageIcon` from the `lucide-react` import, and `useMemo` from the `react` import (it was only used by the gallery's dedupe logic, which now lives in `PhotoGallery`). Add the `PhotoGallery` import.

Before (lines 1–10):
```tsx
"use client";

import "swiper/css";

import { ArrowRight, Calendar, ChevronLeft, CreditCard, ImageIcon, MapPin } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoPersonOutline } from "react-icons/io5";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper/types";
```

After:
```tsx
"use client";

import { ArrowRight, Calendar, CreditCard, MapPin } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoPersonOutline } from "react-icons/io5";
```

Then add `PhotoGallery` to the alphabetized `@/components/...` import block (it sits between `DetailPageLink` and `Button`/`buttonVariants` alphabetically by path — `custom/PhotoGallery` after `custom/WyImage` is fine since ESLint's import/order here groups by path, matching where `WyImage` already sits):

Before (lines 20–24):
```tsx
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { WyImage } from "@/components/custom/WyImage";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import { Button, buttonVariants } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
```

After:
```tsx
import { PublicLocation } from "@/components/common/location/PublicLocation";
import { PhotoGallery } from "@/components/custom/PhotoGallery";
import { WyImage } from "@/components/custom/WyImage";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import { Button, buttonVariants } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
```

- [ ] **Step 2: Delete `GalleryLightbox` and `GalleryGridModal`**

Delete the following two functions entirely (currently at lines 176–280 in the file as read at plan-writing time — re-locate by function name if line numbers have drifted). After deletion, exactly one blank line should separate `DescriptionBlock` (the function above them) from `StudioHeader` (the function below them).

```tsx
function GalleryLightbox({
  images,
  initialIndex,
  studioName,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  studioName: string;
  onClose: () => void;
}) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={onClose} className="text-white">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium text-white">
          {activeIndex + 1}/{images.length}
        </span>
        <div className="w-6" />
      </div>
      <div className="flex min-h-0 flex-1 items-center">
        <Swiper
          initialSlide={initialIndex}
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => setActiveIndex(s.activeIndex)}
          className="h-full w-full"
        >
          {images.map((image, i) => (
            <SwiperSlide key={`${image}-${i}`} className="flex items-center justify-center">
              <div className="relative h-full w-full">
                <WyImage
                  src={image}
                  alt={`${studioName} ${i + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

function GalleryGridModal({
  images,
  studioName,
  onClose,
}: {
  images: string[];
  studioName: string;
  onClose: () => void;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (lightboxIndex != null) {
    return (
      <GalleryLightbox
        images={images}
        initialIndex={lightboxIndex}
        studioName={studioName}
        onClose={() => setLightboxIndex(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button type="button" onClick={onClose} className="text-gray-900">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="text-sm font-semibold text-gray-900">Zdjęcia · {images.length}</span>
        <div className="w-6" />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-1.5">
          {images.map((image, i) => (
            <button
              key={`${image}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
            >
              <WyImage
                src={image}
                alt={`${studioName} ${i + 1}`}
                fill
                className="object-cover"
                sizes="50vw"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `HeroSection` to use `PhotoGallery`**

Before (current `HeroSection`, lines 352–440):
```tsx
function HeroSection({ studio }: { studio: StudioPublic }) {
  const images = useMemo(() => {
    const gallery = studio.image_ids?.filter(Boolean) ?? [];
    return Array.from(new Set(gallery));
  }, [studio.image_ids]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const scrollToLocation = useCallback(() => {
    document.getElementById("location-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const styles = studio.yoga_styles ?? [];
  const [showAllStyles, setShowAllStyles] = useState(false);

  return (
    <>
      {galleryOpen && images.length > 0 && (
        <GalleryGridModal
          images={images}
          studioName={studio.name}
          onClose={() => setGalleryOpen(false)}
        />
      )}
      <section className="relative">
        <StudioHeader />
        <div
          className="relative aspect-[4/4] cursor-pointer overflow-hidden bg-gray-100 md:aspect-[21/9]"
          onClick={() => images.length > 0 && setGalleryOpen(true)}
        >
          {images.length > 0 ? (
            <Swiper onSlideChange={(s) => setActiveIndex(s.activeIndex)} className="h-full w-full">
              {images.map((image, i) => (
                <SwiperSlide key={`${image}-${i}`}>
                  <div className="relative h-full w-full">
                    <WyImage
                      src={image}
                      alt={`${studio.name} ${i + 1}`}
                      fill
                      fetchPriority={i === 0 ? "high" : undefined}
                      className="object-cover"
                      sizes="100vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-gray-300" />
            </div>
          )}
          {images.length > 1 && (
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md bg-gray-800/80 px-2.5 py-1 text-xs font-semibold text-white">
              {activeIndex + 1}/{images.length}
            </div>
          )}
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4">
          <div className="pointer-events-none relative -mt-[50px] h-[100px] w-[100px] overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm">
            {studio.image_id ? (
              <WyImage src={studio.image_id} alt={studio.name} fill className="object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xl font-bold text-gray-500">
                {initials(studio.name)}
              </div>
            )}
          </div>

          <h1 className="mt-2.5 text-xl font-bold text-gray-950 md:text-3xl">{studio.name}</h1>

          {studio.address && (
            <button
              type="button"
              onClick={scrollToLocation}
              className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{studio.address}</span>
            </button>
          )}
          {studio.description && <DescriptionBlock text={studio.description} />}
        </div>
      </section>
    </>
  );
}
```

After:
```tsx
function HeroSection({ studio }: { studio: StudioPublic }) {
  const scrollToLocation = useCallback(() => {
    document.getElementById("location-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const styles = studio.yoga_styles ?? [];
  const [showAllStyles, setShowAllStyles] = useState(false);

  return (
    <section className="relative">
      <StudioHeader />
      <PhotoGallery images={studio.image_ids} alt={studio.name} />

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <div className="pointer-events-none relative -mt-[50px] h-[100px] w-[100px] overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm">
          {studio.image_id ? (
            <WyImage src={studio.image_id} alt={studio.name} fill className="object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xl font-bold text-gray-500">
              {initials(studio.name)}
            </div>
          )}
        </div>

        <h1 className="mt-2.5 text-xl font-bold text-gray-950 md:text-3xl">{studio.name}</h1>

        {studio.address && (
          <button
            type="button"
            onClick={scrollToLocation}
            className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{studio.address}</span>
          </button>
        )}
        {studio.description && <DescriptionBlock text={studio.description} />}
      </div>
    </section>
  );
}
```

Only the top-level `<>...</>` fragment collapses to a plain `<section>` (no more sibling modal to render), and the gallery `div`/`Swiper`/counter markup is replaced by the single `<PhotoGallery>` line. Everything from the avatar `div` onward (avatar, `h1`, address button, `DescriptionBlock`) is otherwise unchanged from the original file, just re-indented one level shallower since the outer fragment is gone.

Leave `styles` / `showAllStyles` exactly as they are (pre-existing unused-var state from the unrelated WIP change — see Global Constraints; not this plan's concern).

- [ ] **Step 4: Lint and type-check**

Run: `yarn lint`
Expected: no new errors. The pre-existing `styles`/`showAllStyles` unused-var warning may still appear (unrelated WIP, not introduced by this task) — confirm no *other* new warnings (e.g. no leftover unused `ChevronLeft`/`ImageIcon`/`useMemo`/`Swiper` imports).

Run: `yarn build`
Expected: build succeeds with no type errors.

- [ ] **Step 5: Manual verification in the browser**

Start the dev server (`yarn dev`) and open a studio page that has photos (`/studio/<slug>`) at a mobile viewport. Confirm:
1. The embedded swiper + bottom-right counter render exactly as before.
2. Tapping the swiper opens the Drawer, sliding up from the bottom, showing the 2-col photo grid with header `Zdjęcia · N` and a left chevron.
3. Tapping a thumbnail switches the same drawer to the single-photo zoomed swiper, header now showing `{index+1}/N`, and swiping updates the counter.
4. The chevron closes the drawer from both the grid and the zoomed view; reopening always starts back at the grid.

- [ ] **Step 6: Commit**

```bash
git add src/components/page-contents/studio/StudioPageContent.tsx
git commit -m "Use PhotoGallery component in Studio hero section"
```
