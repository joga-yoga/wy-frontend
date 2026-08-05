"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { IoChevronForward } from "react-icons/io5";

import { WyImage } from "@/components/custom/WyImage";
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

import { EVENT_KIND } from "./eventKind";
import type { DashboardItem } from "./offerConfig";

export function eventStatusLabel(event: DashboardItem): { text: string; className: string } {
  if (!event.is_public) return { text: "Szkic", className: "text-gray-500" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = event.end_date ? new Date(event.end_date) : null;
  if (end && end < today) return { text: "Minęło", className: "text-b2b-amber-text" };
  return { text: "Opublikowany", className: "text-gray-900" };
}

export function editLink(item: DashboardItem) {
  if (item.kind === "workshop") return `/account/partner/workshops/${item.id}/edit`;
  if (item.kind === "course") return `/account/partner/courses/${item.id}/edit`;
  return `/account/partner/retreats/${item.id}/edit`;
}

export function publicLink(item: DashboardItem): string | null {
  if (item.kind === "workshop") return `/wydarzenia/${item.slug}`;
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
  const kind = EVENT_KIND[event.kind];
  const coverId = event.image_ids?.[0] ?? event.image_id ?? null;

  return (
    <div className={cn("relative", isPast && "opacity-60")}>
      <Link
        href={editLink(event)}
        className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50"
      >
        {/* The event's own photo, which the user calls critical: a partner scanning their
            offer recognises the picture before the title. The coloured type tile is the
            fallback for events that have none, not the default. */}
        {coverId ? (
          <WyImage
            src={coverId}
            alt=""
            width={92}
            height={92}
            className="h-[46px] w-[46px] shrink-0 rounded-[14px] object-cover"
          />
        ) : (
          <span
            className={cn(
              "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]",
              kind.tile,
            )}
          >
            <kind.Icon size={22} />
          </span>
        )}

        <span className="min-w-0 flex-1">
          {/* Two lines maximum. Event titles are user-written and some run very long;
              a four-line title pushes its own metadata off the row it belongs to. */}
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">
            {event.title}
          </span>
          {/* One wrapping meta sentence, as drawn: date · status. A3 also shows a reservation
           * count, which no offer endpoint returns today — omitted rather than fabricated. */}
          <span className="mt-0.5 block text-[13px] text-gray-500">
            {event.start_date && <>{formatDateRange(event.start_date, event.end_date)} · </>}
            <span className={cn("font-medium", status.className)}>{status.text}</span>
          </span>
          {/* With the per-type sections gone, the row has to carry its own type. The tile
              behind a photo is invisible, so the badge is what actually guarantees it. */}
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[11px] font-bold",
                kind.badge,
              )}
            >
              {kind.label}
            </span>
            {organizerLabel && (
              <span className="inline-block max-w-[55%] truncate rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                jako: {organizerLabel}
              </span>
            )}
          </span>
        </span>
      </Link>

      {/* Sits above the row link rather than inside it, so opening the menu never navigates. */}
      <div className="absolute right-2 top-3">
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
