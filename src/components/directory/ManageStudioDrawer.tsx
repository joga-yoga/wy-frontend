"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { StudioDirectoryItem } from "@/types/studio";

/**
 * The entry into claiming a directory studio, or asking to be removed from it.
 *
 * Exactly two things, and the balance between them is the design. **Claiming is the outcome
 * we want**, so it takes the brand fill and the first position. **Removal is never hidden
 * behind it** — it is a peer, one tap away, on a page about a business that did not ask to
 * be here. A takedown buried under a growth action is a dark pattern, however well-meant.
 *
 * ⚠ **Both links are keyed by `external_id`, never by slug.** A recessed card's studio has no
 * slug — that is what makes it recessed — so `/studio/{slug}/przejmij` rendered as
 * `/studio//przejmij` and 404'd on every single row the drawer is attached to.
 *
 * The control that opens this sits on recessed cards only. A studio that has its own page
 * carries its claim entry there, where there is room for it — and a button nested inside a
 * card that is itself a link is invalid markup, so the rule avoids that by construction.
 */
export function ManageStudioDrawer({
  studio,
  onOpenChange,
}: {
  studio: StudioDirectoryItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={studio !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-1">
          <DrawerTitle>To Twoje studio?</DrawerTitle>
          <DrawerDescription>{studio?.name}</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-2.5 px-4 pt-4">
          {/* Plain links rather than DrawerClose wrappers: both navigate away, which
              unmounts the drawer, so an explicit close would only race the navigation. */}
          <DrawerAction
            href={`/studia/przejmij/${studio?.external_id ?? ""}`}
            title="To moje studio"
            description="Przejmij profil i zarządzaj nim samodzielnie."
            emphasis
          />
          <DrawerAction
            href={`/studia/usun-dane/${studio?.external_id ?? ""}`}
            title="Poproś o usunięcie danych"
            description="Wyślemy Twoją prośbę do zespołu joga.yoga."
          />
        </div>

        <div className="px-4 pb-6 pt-4">
          <DrawerClose className="text-m-header w-full rounded-lg py-3 text-gray-600 hover:bg-gray-100">
            Anuluj
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * One choice in the drawer. Both are **outlined cards with a chevron**, not one filled block
 * and one outline.
 *
 * The primary used to be a solid brand-green fill, and it read as a *state* rather than an
 * action — which is exactly what that colour means everywhere else in this product: selected,
 * active, confirmed. A filled green panel at the top of a sheet looks like the option already
 * chosen, so the thing we most want tapped was the thing least likely to be tapped.
 *
 * Precedence now comes from the border and the chevron rather than from a fill, which is the
 * same idiom the toggle selectors and the style filter already use — a brand-green-700 border
 * marks the emphasised choice while both remain obviously the same kind of control. Removal is
 * a peer, one tap away, never hidden behind the growth action.
 */
function DrawerAction({
  href,
  title,
  description,
  emphasis = false,
}: {
  href: string;
  title: string;
  description: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors",
        // 2px on the emphasised choice, 1.5px on the peer. The extra half-pixel is the whole
        // of the precedence now that neither is filled — at 1.5px both read as the same
        // weight and the green was doing the work alone.
        emphasis
          ? "border-2 border-brand-green-700 hover:bg-b2b-green-bg/50"
          : "border-[1.5px] border-gray-200 hover:border-gray-400",
      )}
    >
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "text-m-header block font-semibold",
            emphasis ? "text-b2b-green-strong" : "text-gray-900",
          )}
        >
          {title}
        </span>
        <span className="text-m-sunscript-font mt-0.5 block text-gray-500">{description}</span>
      </span>
      <ChevronRight
        className={cn("size-5 shrink-0", emphasis ? "text-b2b-green-strong" : "text-gray-400")}
        aria-hidden
      />
    </Link>
  );
}
