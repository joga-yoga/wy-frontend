"use client";

import { BadgeCheck, MoreHorizontal, Phone } from "lucide-react";
import { IoChevronForward } from "react-icons/io5";

import { HashedAvatar } from "@/components/common/HashedAvatar";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import { cn } from "@/lib/utils";
import type { StudioDirectoryItem } from "@/types/studio";

/**
 * Two kinds of card, and **whether one is a destination has to be legible before it is
 * tapped**.
 *
 * The geometry is shared — a separated, rounded card with a 1.5px border, the same shape
 * every "one thing" card on this platform uses. Flat rows divided by rules inside one
 * container is the pattern the product deliberately moved away from, and reintroducing it
 * on the newest public surface would be a step backwards.
 *
 * The **fill** is what carries the affordance, not the chevron. Two identically-filled
 * cards read as one kind of thing, half of which fails to respond to a tap — which on the
 * Kraków page would be 52 of 63 rows reading as broken links. Raised and white means there
 * is somewhere to go; recessed and tinted means this is everything we know.
 */
const CARD_BASE = "rounded-xl border-[1.5px] px-3 py-3";
const CARD_RAISED = "border-gray-200 bg-white hover:bg-gray-50";
const CARD_RECESSED = "border-gray-200/70 bg-gray-50";
/** A managed studio — claimed by its owner and maintained here. Same geometry, **2px
 *  brand-green** border: the strongest row on the page, and the outcome the claim funnel
 *  exists to produce, so it should not look like every other link.
 *
 *  It was 1.5px of `b2b-green-border` (#d4e3d9), a tint meant for chip outlines — against
 *  white it was almost invisible, so the badge was carrying the distinction alone. This is
 *  now the same treatment the claim drawer gives its emphasised option: one weight, one
 *  colour, wherever the product says "this is the important one". */
const CARD_MANAGED = "border-2 border-brand-green-700 bg-white hover:bg-b2b-green-bg/40";

/** ⚠ Says the **owner** verified a phone number and claimed this profile — which the claim
 *  endpoint enforces via `partner.phone_verified`. It does **not** say anybody inspected the
 *  business, and the copy must never imply that: this is a page about a third party. */
function ManagedBadge() {
  return (
    <span className="text-m-sunscript-font text-b2b-green-strong inline-flex items-center gap-1">
      <BadgeCheck className="size-3.5" aria-hidden />
      Zweryfikowane
    </span>
  );
}

/**
 * The same 48px id-hashed tile the shared `StudioCard` uses, so a studio looks like a studio
 * everywhere on this product — on `/studia`, on an instructor's "teaches at" list, and here.
 *
 * **A managed studio shows its own logo**; everything else gets the id-hashed initials. That
 * split is not a preference — a logo is an asset the partner uploaded here, while a directory
 * listing has no image we may publish at all. `image_id` is `null` on every unmanaged row by
 * construction on the backend, so this component cannot show the wrong kind even if it tried.
 *
 * ⚠ **Recessed cards get a muted tile.** A full-strength hashed colour is the most
 * eye-catching thing on the card, and putting it on a row that cannot be tapped works
 * directly against the one distinction this page has to make. Desaturated and dimmed, it
 * still gives the row its rhythm and its initials without advertising itself as a
 * destination.
 */
function StudioTile({ studio, muted = false }: { studio: StudioDirectoryItem; muted?: boolean }) {
  return (
    <div className="w-12 shrink-0">
      <HashedAvatar
        seed={studio.external_id}
        name={studio.name}
        imageId={studio.image_id}
        imageFit="contain"
        size={48}
        className={cn(
          "rounded-xl",
          // A logo is letterboxed on white; the initials fallback keeps its hashed fill.
          studio.image_id && "bg-white",
          muted && "opacity-55 saturate-50",
        )}
      />
    </div>
  );
}

function StyleChips({ styles }: { styles: string[] }) {
  if (styles.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {styles.slice(0, 2).map((style) => (
        <span
          key={style}
          className="text-filter-subtitle rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"
        >
          {style}
        </span>
      ))}
      {/* A count, never truncated text — the same choice the instructor card records. */}
      {styles.length > 2 && (
        <span className="text-filter-subtitle px-1 py-0.5 text-gray-500">+{styles.length - 2}</span>
      )}
    </div>
  );
}

/**
 * A studio with its own page. The whole card is the link, as on the instructor card.
 *
 * There is deliberately no ⋯ here: a button nested inside an anchor is invalid, and the
 * claim entry for a studio that has a page belongs on that page, where there is room for
 * it. The rule "actions only on recessed cards" avoids the problem by construction.
 */
export function RaisedStudioCard({ studio }: { studio: StudioDirectoryItem }) {
  return (
    <li>
      <DetailPageLink
        href={`/studio/${studio.slug}`}
        className={cn(
          CARD_BASE,
          studio.is_managed ? CARD_MANAGED : CARD_RAISED,
          "flex items-center gap-3",
        )}
      >
        <StudioTile studio={studio} />
        <div className="min-w-0 flex-1">
          {studio.is_managed && <ManagedBadge />}
          {/* Wraps to two lines rather than truncating: the page's job is naming studios,
              and the real data includes a 119-character name. */}
          <p className="text-m-header line-clamp-2 text-gray-900">{studio.name}</p>
          {studio.address && (
            <p className="text-m-sunscript-font mt-0.5 truncate text-gray-500">{studio.address}</p>
          )}
          <StyleChips styles={studio.styles} />
        </div>
        <IoChevronForward className="size-5 shrink-0 text-gray-500" aria-hidden />
      </DetailPageLink>
    </li>
  );
}

/**
 * A studio with no page. The name is inert, because there is nowhere to go.
 *
 * The phone is an **explicit bordered button** rather than a plain tel: link, so the one
 * thing that can be tapped looks like the one thing that can be tapped. Nothing on the card
 * is ever blank: a field is present, or it is absent.
 */
export function RecessedStudioCard({
  studio,
  onManage,
}: {
  studio: StudioDirectoryItem;
  onManage: () => void;
}) {
  return (
    <li className={cn(CARD_BASE, CARD_RECESSED)}>
      <div className="flex items-start gap-3">
        <StudioTile studio={studio} muted />
        <div className="min-w-0 flex-1">
          <p className="text-m-header line-clamp-2 text-gray-900">{studio.name}</p>
          {studio.address && (
            <p className="text-m-sunscript-font mt-0.5 text-gray-500">{studio.address}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onManage}
          aria-label={`Zarządzaj studiem ${studio.name}`}
          className="-mr-1 shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </button>
      </div>
      {studio.phone && (
        <a
          href={`tel:${studio.phone.replace(/\s/g, "")}`}
          className="text-m-header mt-2.5 ml-[60px] inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 hover:border-gray-400"
        >
          <Phone className="size-4" aria-hidden />
          {studio.phone}
        </a>
      )}
    </li>
  );
}
