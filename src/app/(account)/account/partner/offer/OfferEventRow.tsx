"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { IoChevronForward } from "react-icons/io5";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateRange } from "@/lib/formatDateRange";
import { cn } from "@/lib/utils";

import type { DashboardItem } from "./offerConfig";

/** Per-type tile tint, reusing the existing class-colour tokens rather than new literals. */
const KIND_TILE: Record<DashboardItem["kind"], string> = {
  retreat: "bg-class-teal-500/15 text-class-teal-700",
  workshop: "bg-class-sand-500/25 text-class-sand-700",
  course: "bg-class-lavender-500/20 text-class-lavender-700",
  class: "bg-class-green-500/15 text-class-green-700",
};

const KIND_LOGO: Record<DashboardItem["kind"], string> = {
  retreat: "/images/logo/logo-retreats.png",
  workshop: "/images/logo/logo-workshops.png",
  course: "/images/logo/logo-courses.png",
  class: "/images/logo/logo-workshops.png",
};

export function eventStatusLabel(event: DashboardItem): { text: string; className: string } {
  if (!event.is_public) return { text: "Szkic", className: "text-gray-500" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = event.end_date ? new Date(event.end_date) : null;
  if (end && end < today) return { text: "Minęło", className: "text-b2b-amber-text" };
  return { text: "Opublikowany", className: "text-gray-900" };
}

export function editLink(item: DashboardItem) {
  if (item.kind === "workshop") return `/konto/partner/wydarzenia/${item.id}/edit`;
  if (item.kind === "class") return `/konto/partner/zajecia/${item.id}/edit`;
  if (item.kind === "course") return `/konto/partner/kursy/${item.id}/edit`;
  return `/konto/partner/wyjazdy/${item.id}/edit`;
}

export function publicLink(item: DashboardItem): string | null {
  if (item.kind === "workshop") return `/wydarzenia/${item.slug}`;
  if (item.kind === "class") return `/zajecia/${item.slug}`;
  if (item.kind === "course") return null;
  return `/wyjazdy/${item.slug}`;
}

/**
 * One offer row (mockup A3): tinted type tile, title, a wrapping meta line, the "jako:" organizer
 * chip, then the actions.
 *
 * Replaces an image-led card. A3 has no cover image — at this size the photo carried no
 * information the title didn't, and dropping it is what lets several events fit on screen.
 *
 * **Deviation from A3**: the mockup shows only a chevron. The kebab menu is kept beside it because
 * Duplikuj / Ukryj / Usuń live nowhere else — deleting the only route to them would be a
 * functional regression, not a visual simplification. It is muted so the chevron stays primary.
 */
export function OfferEventRow({
  event,
  onDelete,
  onHide,
  onDuplicate,
  itemToDelete,
  isDeleting,
  onDeleteConfirm,
  onDeleteCancel,
  organizerLabel,
}: {
  event: DashboardItem;
  onDelete: (e: DashboardItem) => void;
  onHide: (e: DashboardItem) => void;
  onDuplicate: (e: DashboardItem) => void;
  itemToDelete: DashboardItem | null;
  isDeleting: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  /** "jako: X" — only passed when the partner has 2+ organizing entities (spec-b2b §4). */
  organizerLabel?: string;
}) {
  const status = eventStatusLabel(event);
  const isPast = status.text === "Minęło";

  return (
    <div className={cn("relative", isPast && "opacity-60")}>
      <Link
        href={editLink(event)}
        className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50"
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            KIND_TILE[event.kind],
          )}
        >
          <img src={KIND_LOGO[event.kind]} className="h-[18px] w-[18px]" alt="" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-gray-900">
            {event.title}
          </span>
          {/* One wrapping meta sentence, as drawn: date · status. A3 also shows a reservation
           * count, which no offer endpoint returns today — omitted rather than fabricated. */}
          <span className="mt-0.5 block text-[13px] text-gray-500">
            {event.start_date && <>{formatDateRange(event.start_date, event.end_date)} · </>}
            <span className={cn("font-medium", status.className)}>{status.text}</span>
          </span>
          {organizerLabel && (
            <span className="mt-1.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
              jako: {organizerLabel}
            </span>
          )}
        </span>

        <span className="flex shrink-0 items-center self-center pl-8 text-gray-300">
          <IoChevronForward className="h-5 w-5" />
        </span>
      </Link>

      {/* Sits above the row link rather than inside it, so opening the menu never navigates. */}
      <div className="absolute right-9 top-1/2 -translate-y-1/2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Więcej akcji"
              className="h-7 w-7 p-0 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={editLink(event)}>Edytuj</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(event)} className="cursor-pointer">
              Duplikuj
            </DropdownMenuItem>
            {publicLink(event) && (
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href={publicLink(event)!} target="_blank" rel="noopener noreferrer">
                  Zobacz stronę publiczną
                </Link>
              </DropdownMenuItem>
            )}
            {event.is_public && (
              <DropdownMenuItem onClick={() => onHide(event)} className="cursor-pointer">
                Ukryj
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(event)}
              className="cursor-pointer text-b2b-red-solid focus:bg-b2b-red-bg focus:text-b2b-red-solid"
            >
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {itemToDelete?.id === event.id && (
        <AlertDialog open onOpenChange={(open) => !open && onDeleteCancel()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
              <AlertDialogDescription>
                Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie &quot;
                <strong>{event.title}</strong>&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={onDeleteConfirm}
                className="bg-b2b-red-solid hover:bg-b2b-red-solid/90"
              >
                {isDeleting ? "Usuwanie..." : "Tak, usuń"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
