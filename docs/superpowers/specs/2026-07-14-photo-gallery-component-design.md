# PhotoGallery component extraction — design

## Context

`StudioPageContent.tsx`'s `HeroSection` currently owns an inline photo gallery: an embedded Swiper with a slide counter, plus two custom fixed full-screen overlays (`GalleryGridModal` for a 2-col thumbnail grid, `GalleryLightbox` for a single zoomed swipeable photo). This logic is Studio-specific today but is needed, largely unchanged, for Events (workshops/retreats/courses) soon. The overlays also predate the shared `Drawer` primitive (`src/components/ui/drawer.tsx`, Base UI) that the rest of the app has since adopted for sheet-style UI (e.g. `SessionDetailDrawer`).

This change extracts the gallery into a standalone, domain-agnostic component and replaces the two fixed-overlay modals with a single `Drawer`.

## Goals

- Extract a `PhotoGallery` component with no dependency on Studio types, reusable later by Events.
- Preserve the existing embedded swiper + counter behavior exactly (already considered good).
- Replace `GalleryGridModal` + `GalleryLightbox` (fixed `inset-0` overlays) with one `Drawer`, styled like the pricing/session drawer header, but with a left-aligned chevron (instead of a trailing `X`) that always closes the drawer.
- Add a `variant` prop now (`"swiper" | "grid"`, default `"swiper"`) so a future 4-image-grid initial view is purely additive — `"grid"` is typed but not rendered in this change.
- Clean up `StudioPageContent.tsx`: remove gallery-only imports/state now living in the new component.

## Non-goals

- Implementing the `variant="grid"` initial view (future work).
- Reusing this component in Events pages (future work — this change only extracts and wires it into Studio).
- Changing the click-to-open behavior (clicking the embedded swiper always opens the drawer at the grid step, not at the clicked slide's index — matches current behavior).

## Component: `src/components/custom/PhotoGallery.tsx`

Single self-contained file.

```ts
interface PhotoGalleryProps {
  images: (string | null | undefined)[] | null | undefined;
  alt: string;                    // e.g. studio.name — used for per-slide alt text
  variant?: "swiper" | "grid";    // default "swiper"; "grid" reserved for future use, not rendered yet
  className?: string;             // overrides the embedded view's default aspect/rounding classes
}
```

The component dedupes/filters `images` internally (`Array.from(new Set(images.filter(Boolean)))`), matching the current `HeroSection` logic, so callers can pass a raw `image_ids` field directly.

### Default embedded view (`variant="swiper"`)

Lifted verbatim from the current `HeroSection`:
- `Swiper`/`SwiperSlide` rendering each image via `WyImage`, `fetchPriority="high"` on the first slide.
- Bottom-right counter badge (`{activeIndex + 1}/{images.length}`) shown when `images.length > 1`.
- `ImageIcon` empty-state fallback when there are no images.
- Clicking anywhere on the container opens the drawer (unchanged — no index passed).
- Default container classes: `relative aspect-[4/4] cursor-pointer overflow-hidden bg-gray-100 md:aspect-[21/9]`, overridable via `className`.

### `variant="grid"`

Accepted by the type, not implemented. No rendering branch exists for it yet in this change.

## Drawer (replaces `GalleryGridModal` + `GalleryLightbox`)

One `Drawer` (`swipeDirection="down"`, `snapPoints={[1]}`, `showSwipeHandle` — same full-height-sheet configuration as `SessionDetailDrawer`) with internal state:

```ts
const [view, setView] = useState<"grid" | "zoomed">("grid");
const [zoomedIndex, setZoomedIndex] = useState(0);
```

**Header** — custom row inside `DrawerContent` (`flex items-center justify-between px-4 py-3 border-b`, styled like the pricing/session drawer header), with the leading control changed from a trailing `X`/`DrawerClose` to a left-aligned `ChevronLeft` button. The chevron always closes the drawer entirely (regardless of `view`) and resets `view` back to `"grid"` on close, so reopening starts fresh at the grid. Title text:
- `view === "grid"` → `"Zdjęcia · {count}"`
- `view === "zoomed"` → `"{zoomedIndex + 1}/{count}"`

**Body:**
- `grid`: 2-col thumbnail grid (from `GalleryGridModal`). Tapping a thumbnail sets `zoomedIndex` to that index and `view = "zoomed"`.
- `zoomed`: single-image `Swiper` (from `GalleryLightbox`) with `initialSlide={zoomedIndex}`, `onSlideChange` updating `zoomedIndex` so the header counter tracks swipes.

No background color change between the two views — only the body content swaps within the same sheet.

## `StudioPageContent.tsx` changes

- `HeroSection` drops `GalleryLightbox`, `GalleryGridModal`, the `galleryOpen` state, and the images dedupe `useMemo`, replacing them with:
  ```tsx
  <PhotoGallery images={studio.image_ids} alt={studio.name} className="aspect-[4/4] md:aspect-[21/9]" />
  ```
  inside the existing container div — the avatar/name/address/description block below is untouched.
- Remove now-unused imports: `import "swiper/css"`, `Swiper`/`SwiperSlide`/`SwiperType`, `ChevronLeft`, `ImageIcon` (all now live in `PhotoGallery.tsx`).
- No other section of `StudioPageContent.tsx` changes.

## Testing

- `yarn build` / `yarn lint` to catch unused-import and type errors after moving code.
- Manual check in-browser (mobile viewport) on a studio page with photos: embedded swiper + counter unchanged, tap opens drawer at grid, tap thumbnail zooms with swipeable counter updating the header, chevron closes from both grid and zoomed states.
