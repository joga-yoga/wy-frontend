# dialog

2026-07-08. Strategy: transformation engine (legacy `new-york`-family style — the
project's actual wrapper code matches the `new-york-v4` shadcn convention, but
no `base-new-york-v4` registry exists (confirmed 404), so the golden-pair CLI
path was unavailable; the user's own file was hand-transformed instead).
Verdict: migrated cleanly, full typecheck/lint/build pass, no regressions.

Note: `Drawer` was requested alongside `Dialog` but is built on **vaul**, not
Radix — per the skill's hard rule it was left untouched (see "Left alone").

## Changed

- `src/components/ui/dialog.tsx` — rewritten in place (via a `dialog-base.tsx`
  intermediate, strangler-fig style, now finalized under the original name).
  - Import: `import * as DialogPrimitive from "@radix-ui/react-dialog"` →
    `import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"`.
  - Part rename (internal only; all public wrapper names — `Dialog`,
    `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`,
    `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`,
    `DialogDescription` — are unchanged, so no consumer had to learn new
    names): `DialogPrimitive.Overlay` → `DialogPrimitive.Backdrop`,
    `DialogPrimitive.Content` → `DialogPrimitive.Popup`. Centered modal: no
    Positioner (per overlays.md, dialog `Content`→`Popup` has no
    Positioner).
  - Types: `React.ComponentProps<typeof DialogPrimitive.Part>` →
    `DialogPrimitive.Part.Props` everywhere (Root, Trigger, Portal, Close,
    Backdrop, Popup, Title, Description).
  - Class-string rewrite (class-mapping.md, mechanical, applied everywhere
    `data-[state=open]:`/`data-[state=closed]:` appeared, including on the
    Close button icon which references the popup's own transient
    open/closed presence): `data-[state=open]:` → `data-open:`,
    `data-[state=closed]:` → `data-closed:`. Kept the existing
    `animate-in`/`fade-in-0`/`zoom-in-95`/etc. (tw-animate-css) utility
    classes as-is rather than restating with `data-starting-style`/
    `data-ending-style` transitions — verified against
    `node_modules/@base-ui/react/internals/useAnimationsFinished.js`, which
    detects animation completion via the Web Animations API
    (`element.getAnimations()`), so it unmounts correctly with either
    keyframe-`animation`-based or `transition`-based exit animations. No
    visual behavior change.
  - All other classes (background, spacing, border, shadow, custom
    `bg-secondary rounded-full` close-button styling — this project's
    customization vs. the stock registry, which uses a plain
    `rounded-xs` icon button) preserved exactly.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/dialog.tsx`
    → clean.

- `src/components/ui/command.tsx` — `CommandDialog`'s prop type changed from
  `React.ComponentProps<typeof Dialog> & {...}` to
  `Omit<React.ComponentProps<typeof Dialog>, "children"> & { ...; children?: React.ReactNode }`.
  Base UI's `Dialog.Root` widens `children` to
  `React.ReactNode | PayloadChildRenderFunction<Payload>` (for the
  handle/multi-trigger payload feature); `CommandDialog` only ever passes
  plain nodes through to `cmdk`'s `Command`, whose children type is a plain
  `ReactNode`, so the wider inherited type had to be narrowed back down at
  this call site. No runtime behavior change — cmdk itself is untouched.

- Consumers repointed (import path unchanged at `@/components/ui/dialog`
  throughout — this was a strangler-fig detour through `dialog-base.tsx`
  and back, not a lasting rename):
  `src/app/profile/(dashboard)/offer/page.tsx`,
  `src/app/(public)/workshops/components/filters-modal/index.tsx`,
  `src/app/(public)/retreats/components/filters-modal/index.tsx`,
  `src/app/(public)/retreats/[slug]/components/OrganizerSection.tsx`,
  `src/app/(public)/retreats/[slug]/components/ReservationModal.tsx`,
  `src/components/instructors/InstructorModal.tsx`,
  `src/components/page-contents/organizer/components/ReviewsModal.tsx`,
  `src/components/page-contents/instructor/components/CalendarSection.tsx`,
  `src/components/page-contents/instructor/components/AboutSection.tsx`,
  `src/components/page-contents/instructor/InstructorPageContent.tsx`,
  `src/components/locations/LocationModal.tsx`,
  `src/components/cookies/CookieSettingsModal.tsx`. These files had no
  `asChild`/dismiss-callback breakage — passthrough props only.

- `src/app/(public)/retreats/[slug]/components/EventLeafletMap.tsx:109` —
  `<DialogTrigger asChild><Button>...</Button></DialogTrigger>` →
  `<DialogTrigger render={<Button>...</Button>} />` (consumer-props.md,
  universal `asChild` → `render`).

- `src/app/(public)/retreats/[slug]/components/ImageGallery.tsx:191` — same
  `asChild` → `render` conversion on `DialogTrigger`.
  `ImageGallery.tsx:208` — `onOpenAutoFocus={(e) => e.preventDefault()}` on
  `DialogContent` → `initialFocus={false}` (overlays.md: Radix
  `onOpenAutoFocus` event-preventDefault idiom → Base UI declarative
  `Popup.initialFocus`; `false` means "do not move focus on open", the same
  intent as the original `preventDefault()`).

- `package.json` / `yarn.lock` — added `@base-ui/react@1.6.0`.
  `@radix-ui/react-dialog` was left in `package.json` (still used
  transitively by nothing directly, but `alert-dialog.tsx` and 15 other
  wrappers remain on Radix — see below — so no Radix package removal yet).

## Left alone

- `src/components/ui/drawer.tsx` — built on **vaul** (`import { Drawer as
  DrawerPrimitive } from "vaul"`), not Radix. Explicitly out of scope per
  the skill's hard rule: vaul is never touched during a Radix → Base UI
  migration unless the user explicitly asks for the separate vaul → Base UI
  drawer migration. The user's request named "Drawer and dialog" together,
  but Drawer has no Radix dependency to migrate away from.
- `src/components/ui/alert-dialog.tsx` — still Radix-based
  (`@radix-ui/react-alert-dialog`). Not requested; untouched. One consumer
  (`src/components/locations/LocationModal.tsx`) imports both `alert-dialog`
  and `dialog` — only its `dialog` import was repointed, `alert-dialog`
  import (`AlertDialogTrigger asChild` etc.) is unchanged.
- `src/components/ui/command.tsx`'s `cmdk` primitive itself (`Command`,
  `CommandInput`, `CommandList`, etc.) — cmdk is third-party, not Radix;
  only the `CommandDialog` wrapper's use of the `Dialog` wrapper's prop type
  needed adjustment (see Changed).
- `src/app/profile/(dashboard)/offer/page.tsx` — has unrelated
  `DropdownMenuTrigger asChild` / `DropdownMenuItem asChild` / `Button
  asChild` usages (dropdown-menu, not dialog); out of scope, untouched.
- `src/components/locations/LocationModal.tsx`'s `AlertDialogTrigger
  asChild` — belongs to `alert-dialog.tsx`, not `dialog.tsx`; untouched.
- `components.json` `style: "new-york"` was left as-is (not flipped to a
  `base-*` style) — no `base-new-york`/`base-new-york-v4` registry style
  exists, so there is nothing to flip to. Per the skill, this is flagged,
  not silently worked around: future `shadcn add <component> --overwrite`
  on this project will still deliver a Radix-based component. Migrated
  components should continue to be maintained by hand (or via this skill)
  until/unless the project switches to a `base-*`-prefixed style.

## Behavior changes

None observed or expected. The `onOpenAutoFocus` → `initialFocus={false}`
conversion in `ImageGallery.tsx` is a direct declarative equivalent of the
original imperative `preventDefault()` — both mean "don't move focus when
the dialog opens" — not a behavior delta.

## Verify by hand

- Open every dialog consumer in the browser and confirm:
  - Trigger click opens the dialog; overlay dims the background; entrance
    fade/zoom animation still plays (this now runs off `data-open`/
    `data-closed` instead of `data-[state=open/closed]`).
  - Escape key and outside-click still close the dialog (Base UI `modal`
    defaults to `true`, matching Radix's default modal behavior).
  - Close (X) button top-right still renders with the custom
    `bg-secondary rounded-full` styling and closes the dialog; exit
    animation plays before unmount.
  - Focus returns to the trigger element on close (default Base UI
    `finalFocus` behavior, unchanged from Radix's default).
  - `EventLeafletMap.tsx` (mobile map fullscreen trigger) and
    `ImageGallery.tsx` (gallery fullscreen trigger, both the button-render
    trigger and the grid/single view toggle) — confirm the button trigger
    still looks and behaves identically post `asChild` → `render` swap.
  - `ImageGallery.tsx` specifically: opening the dialog should NOT
    auto-focus any element inside (verify no visible focus ring jumps
    into the gallery content on open — this is what `initialFocus={false}`
    preserves from the original `preventDefault()`).
  - Command palette (`CommandDialog` in `command.tsx`, if wired up anywhere)
    opens/closes normally and the search input still receives focus as
    before.

**16 wrappers remain on Radix**: `alert-dialog.tsx`, `avatar.tsx`,
`badge.tsx`, `button.tsx`, `checkbox.tsx`, `dropdown-menu.tsx`, `form.tsx`,
`label.tsx`, `popover.tsx`, `progress.tsx`, `scroll-area.tsx`, `select.tsx`,
`separator.tsx`, `switch.tsx`, `toast.tsx`, `tooltip.tsx` (derived via
`grep -rl "radix-ui" src/components/ui/*.tsx`, 2026-07-08).
