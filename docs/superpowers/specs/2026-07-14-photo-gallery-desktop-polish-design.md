# PhotoGallery desktop polish — design

## Context

`PhotoGallery` currently uses the same mobile-first layout (2×2 grid or single-swiper preview, square-cropped drawer grid) at every breakpoint. Now that it's live on Studio and all four Events pages, real desktop usage shows it's too plain compared to the old `ImageGallery` it replaced: no featured desktop layout, no arrow-button navigation, and a square-cropped "all photos" grid instead of a real-aspect-ratio masonry layout. This change reintroduces those three pieces of `ImageGallery`'s desktop behavior into `PhotoGallery`, plus a file-structure split since the component is about to roughly double in size.

## Goals

1. **Desktop featured preview layout** for `variant="grid"`: at `md:` and up, 1 large image + a 2×2 sub-grid of the next 4 thumbnails (mirrors `ImageGallery`'s old desktop grid). Mobile (`<md`) is unchanged (today's 2×2 grid of the first 4 images).
2. **Chevron prev/next arrow buttons** on both `PhotoGallerySwiperPreview` and the drawer's zoomed `Swiper`.
3. **Masonry "all photos" grid** in the drawer: real image aspect ratios (no square cropping) distributed into a responsive column count (1–5, by screen width), replacing the current square-cropped 2-column grid — at every breakpoint, not just desktop.
4. **Split `PhotoGallery.tsx`** into a folder of focused files, since it's about to cover four largely-independent concerns.

## Non-goals

- No change to click-to-open behavior: every preview tile (mobile grid, desktop featured layout, swiper) still opens the drawer at the grid step, never zoomed to a specific index. This keeps one predictable rule across every variant, even though the desktop featured layout makes each tile feel more like "this specific photo."
- No change to `variant="swiper"`'s embedded counter badge, or to any Events-page call site (`retreats`/`workshops`/`courses`/`classes` already render `<PhotoGallery ... variant="grid" />` and need no changes).
- Not reproducing `ImageGallery`'s fixed `min-h-[340px]` — the new desktop featured layout sizes the hero via `aspect-[3/2]` (see section 1) instead of a hardcoded pixel height, consistent with how the rest of `PhotoGallery` avoids fixed heights.

## File structure

Convert `src/components/custom/PhotoGallery.tsx` into a folder — `@/components/custom/PhotoGallery` resolves identically for every existing consumer (Studio, retreats, workshops, courses, classes), so no call site changes.

```
src/components/custom/PhotoGallery/
  index.tsx                    — exports PhotoGallery (the public component), unchanged public API
  PhotoGalleryDrawer.tsx        — the Drawer: header, grid-of-all-photos (masonry), zoomed swiper (+ chevrons)
  PhotoGalleryGridPreview.tsx   — variant="grid" preview: mobile 2x2 + desktop featured layout
  PhotoGallerySwiperPreview.tsx — variant="swiper" preview (+ chevrons)
  variants.ts                   — gridContainerVariants / gridTileVariants (shared Motion variants)
```

`dedupeImages` moves into `index.tsx` (only used there). `GRID_TILE_CORNER_CLASSES` moves into `PhotoGalleryGridPreview.tsx` (only used there, for the mobile 2×2 grid — the new desktop featured layout uses its own fixed corner classes per position, see below).

## 1. Desktop featured preview layout

`PhotoGalleryGridPreview` renders two sibling blocks, one hidden per breakpoint (matching `ImageGallery`'s own `hidden md:grid` / `md:hidden` split):

```tsx
{/* Mobile: existing 2x2 grid, unchanged (mobile-only now — the md:aspect-auto md:h-[168px]
    override added for the old single-block layout is dropped, since md:hidden makes it moot) */}
<div className={cn("grid grid-cols-2 gap-1 md:hidden", className)}>
  {/* first 4 images, aspect-square, GRID_TILE_CORNER_CLASSES — unchanged from today */}
</div>

{/* Desktop: featured layout */}
<div className={cn("hidden md:grid md:grid-cols-2 md:gap-3", className)}>
  <button
    type="button"
    onClick={onOpen}
    className="relative aspect-[3/2] overflow-hidden rounded-l-[22px] rounded-r-[4px] bg-gray-100"
  >
    <WyImage src={previewImages[0]} alt={`${alt} 1`} fill className="object-cover" sizes="50vw" />
  </button>
  <div className="grid grid-cols-2 gap-2">
    {previewImages.slice(1, 5).map((image, i) => (
      <button
        key={`${image}-${i}`}
        type="button"
        onClick={onOpen}
        className={cn(
          "relative overflow-hidden bg-gray-100",
          i === 0 ? "rounded-tr-[22px] rounded-b-[4px]" : i === 2 ? "rounded-br-[22px] rounded-t-[4px]" : "rounded-[4px]",
        )}
      >
        <WyImage src={image} alt={`${alt} ${i + 2}`} fill className="object-cover" sizes="25vw" />
      </button>
    ))}
  </div>
</div>
```

The hero gets an explicit `aspect-[3/2]` (a landscape ratio, closer to `ImageGallery`'s old fixed-340px-tall-vs-~570px-wide hero than a square would be) since `fill` requires a sized ancestor. The 4 thumbnails deliberately have **no** aspect class: they're a sibling grid item in the same `grid-cols-2` row as the hero, so CSS Grid's default `align-items: stretch` makes the thumbnail sub-grid's `div` exactly as tall as the hero automatically; each thumbnail then gets an implicit height of half that (from its own nested `grid-cols-2` row split), reproducing `ImageGallery`'s original mechanism (which relied on the same stretch behavior under its `min-h-[340px]` parent) without a hardcoded pixel height. Motion stagger/tap animations (`gridContainerVariants`/`gridTileVariants`) apply to both the mobile and desktop blocks the same way they do today.

Since fewer than 4 additional thumbnails may exist (an event with 1–4 total photos), `previewImages.slice(1, 5)` naturally yields 0–4 items — the sub-grid just shows however many exist, same "graceful degradation" reasoning as the existing mobile grid.

## 2. Chevron arrows

Both `PhotoGallerySwiperPreview` and the drawer's zoomed view get a `swiperRef` (the drawer already has one; the preview needs a new one) and two buttons:

```tsx
{images.length > 1 && (
  <>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        swiperRef.current?.slidePrev();
      }}
      aria-label="Poprzednie zdjęcie"
      className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md"
    >
      <ChevronLeft className="h-5 w-5 text-gray-700" />
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        swiperRef.current?.slideNext();
      }}
      aria-label="Następne zdjęcie"
      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md"
    >
      <ChevronRight className="h-5 w-5 text-gray-700" />
    </button>
  </>
)}
```

`stopPropagation()` matters only in the preview (its container has an `onClick={() => onOpen()}`); harmless to include in both for symmetry. Icons: `ChevronLeft`/`ChevronRight` from `lucide-react`, matching the icon family already used for the drawer's back button (not `ArrowLeft`/`ArrowRight`, which `ImageGallery` used — no reason to introduce a second icon family).

## 3–4. Masonry "all photos" grid

Replaces the drawer's current `<div className="grid grid-cols-2 gap-1.5">` block. Uses the existing `useWindowWidth` hook (`src/hooks/useWindowWidth`, default export) and the existing `DynamicCloudinaryImage` component (`src/components/custom/DynamicCloudinaryImage`, already used elsewhere in the codebase for responsive real-aspect-ratio images via `width={0} height={0}` + `className="w-full h-auto object-cover"`):

```tsx
const windowWidth = useWindowWidth();
const columns = useMemo(() => {
  if (images.length === 0) return 0;
  let responsive = 1;
  if (windowWidth > 1920) responsive = 5;
  else if (windowWidth > 1200) responsive = 4;
  else if (windowWidth > 950) responsive = 3;
  else if (windowWidth > 768) responsive = 2;
  return Math.min(responsive, images.length);
}, [windowWidth, images.length]);
```

Same breakpoints and column caps as `ImageGallery`. Rendering:

```tsx
<motion.div className="flex flex-row gap-1.5" variants={gridContainerVariants} initial="hidden" animate="show">
  {Array.from({ length: columns }).map((_, columnIndex) => (
    <div key={columnIndex} className="flex flex-1 flex-col gap-1.5">
      {images.map((image, i) =>
        i % columns === columnIndex ? (
          <motion.button
            key={`${image}-${i}`}
            type="button"
            onClick={() => { setZoomedIndex(i); setView("zoomed"); }}
            variants={gridTileVariants}
            whileTap={{ scale: 0.95 }}
            className="relative w-full overflow-hidden rounded-lg bg-gray-100"
          >
            <DynamicCloudinaryImage imageId={image} alt={`${alt} ${i + 1}`} width={0} height={0} sizes="33vw" className="rounded-lg" />
          </motion.button>
        ) : null,
      )}
    </div>
  ))}
</motion.div>
```

`flex-1` on each column div (rather than `ImageGallery`'s fixed `w-1/N` classes) achieves the same equal-width columns via Tailwind's flexbox utilities without needing a lookup table keyed by column count. The Motion stagger still works: `gridContainerVariants`/`gridTileVariants` orchestrate through `variants` regardless of the extra column-`div` nesting, since Motion's orchestration walks the render tree, not a flat sibling list.

## Testing

- `yarn lint` / `yarn build` after each file is added/edited.
- Manual browser check (mobile + desktop viewport, on a page with 5+ photos, e.g. the workshop page used for the Events rollout check): desktop featured layout renders correctly, drawer's masonry grid shows natural-aspect images with the right column count at a few different viewport widths, chevrons navigate the swiper in both the preview and the zoomed drawer view without also triggering the "open drawer" click, tap/stagger animations still play.
