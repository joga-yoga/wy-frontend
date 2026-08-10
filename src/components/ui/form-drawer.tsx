"use client";

import { X } from "lucide-react";
import * as React from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * A full-height drawer that can only be dismissed from its header or its X button.
 *
 * Forms inside a default drawer are miserable on mobile: the sheet is auto-height, so
 * it resizes every time the on-screen keyboard opens or an async list changes length,
 * and swipe-to-dismiss stays live over every input — a drag while scrolling the body
 * throws the whole form away.
 *
 * Two existing primitives fix both, and `PhotoGalleryDrawer` already proves them:
 *  - `snapPoints={[1]}` makes `DrawerContent` resolve `--drawer-content-height` to
 *    `100dvh` (see the `data-snap-points` rule in `ui/drawer.tsx`), so the height is
 *    fixed up front and nothing can animate it.
 *  - `data-base-ui-swipe-ignore` on the scroll region — a real Base UI feature
 *    (`DrawerViewport` does `target.closest(...)` against it) — makes swipe handling
 *    skip that subtree. The header is left outside it, so dragging the header still
 *    dismisses.
 *
 * Codified here rather than copy-pasted so the pass drawer, the add-participant drawer,
 * and whatever comes third all behave identically.
 *
 * Deliberately does not auto-focus anything. A field focused as the sheet opens summons
 * the mobile keyboard over a form the user has not looked at yet, and the `autoFocus`
 * attribute additionally fires mid-animation, which leaves iOS scrolled to the field's
 * in-flight position. Let the user tap what they want.
 */
function FormDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()} snapPoints={[1]}>
      {children}
    </Drawer>
  );
}

/** Full-viewport-height shell. Its children are a `FormDrawerHeader`, a
 *  `FormDrawerBody`, and optionally a `DrawerFooter`. */
function FormDrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerContent>) {
  return (
    <DrawerContent className={cn("flex flex-col", className)} {...props}>
      {children}
    </DrawerContent>
  );
}

/**
 * Title row with the close control. Deliberately *outside* the swipe-ignore region:
 * this is the one surface a drag may dismiss from.
 */
function FormDrawerHeader({
  title,
  className,
  children,
}: {
  title: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <DrawerHeader className={cn("pb-0", className)}>
      <div className="flex items-center justify-between gap-2">
        <DrawerTitle className="text-left">{title}</DrawerTitle>
        <DrawerClose
          aria-label="Zamknij"
          className="-mr-1 shrink-0 rounded-md p-1 text-gray-500 hover:text-gray-900"
        >
          <X className="size-5" />
        </DrawerClose>
      </div>
      {children}
    </DrawerHeader>
  );
}

/**
 * The scrollable form body. Carries `data-base-ui-swipe-ignore` so dragging or
 * scrolling in here never starts a dismiss gesture, and `min-h-0 flex-1` so it
 * absorbs the fixed height rather than growing the sheet.
 *
 * `pt-6` is the shared gap below the header — both consumers of this pattern use it,
 * so the first field never sits flush against the title.
 */
function FormDrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-base-ui-swipe-ignore=""
      className={cn("min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-4", className)}
      {...props}
    />
  );
}

export { FormDrawer, FormDrawerBody, FormDrawerContent, FormDrawerHeader };
