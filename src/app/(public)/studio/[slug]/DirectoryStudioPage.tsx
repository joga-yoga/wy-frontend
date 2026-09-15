"use client";

import { useState } from "react";

import { PublicLocation } from "@/components/common/location/PublicLocation";
import { ProfileLinks } from "@/components/common/ProfileLinks";
import { DirectoryBreadcrumb } from "@/components/directory/DirectoryBreadcrumb";
import { ManageStudioDrawer } from "@/components/directory/ManageStudioDrawer";
import { PublicHeader } from "@/components/layout/Header";
import { PassList } from "@/components/page-contents/studio/PassList";
import { Button } from "@/components/ui/button";
import { getCurrencySymbol } from "@/lib/currency";
import type { DirectoryStudioDetail } from "@/types/studio";

/**
 * An unclaimed studio's page.
 *
 * **Platform voice throughout.** Public profile copy on this site is written in the owner's
 * voice — a studio page says "u nas", an instructor page says "ja". This studio has no owner
 * yet, so there is nobody to speak as, and the page speaks as the platform until somebody
 * claims it. Every studio page shipping before this one was claimed, so this is the first
 * place the distinction exists.
 *
 * **It reuses the claimed page's own sections rather than reinventing them.** `PublicLocation`
 * gives the address the same heading, map and directions button a managed studio gets;
 * `ProfileLinks` renders the website as the same chip the managed page uses for its links.
 * A directory page that looked hand-rolled would read as a lesser page — and it is not a
 * lesser page, it is the same page with less known about it.
 *
 * What is *not* here matters as much as what is: no image, no rating, no review count. All
 * three exist in the scrape and all three are Google-derived through an intermediary whose
 * host the images point at. They never reach this component, because they never reach the
 * projection that feeds it.
 */
export function DirectoryStudioPage({ listing }: { listing: DirectoryStudioDetail }) {
  const [managing, setManaging] = useState<DirectoryStudioDetail | null>(null);

  const hasLocation = Boolean(listing.address || (listing.latitude && listing.longitude));

  // `ProfileLinks` takes the shared social-link shape, so the studio's website renders as
  // the same chip every other profile on the platform uses.
  //
  // ⚠ **Only the website.** The previous source carried Facebook, Instagram, YouTube and the
  // rest; this one's `studio_external_links` holds exactly two kinds — `website` and
  // `google_maps` — and the Maps link is a search URL we already build ourselves from the
  // coordinates. So there is one chip, and the machinery that reconciled the old source's
  // two shapes and unwrapped its Google redirects is gone with it.
  const links = listing.website
    ? [
        {
          id: `${listing.external_id}-website`,
          platform: "website",
          url: listing.website,
          handle: null,
          label: "Strona studia",
          position: 0,
        },
      ]
    : [];

  return (
    <>
      {/* The layout's own PublicHeader suppresses itself on every `/studio/` path, because a
          managed studio's page carries an overlay header on its hero. This page has no hero,
          so it asks for the site header explicitly. */}
      <PublicHeader force />
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-2 px-4 pb-2 pt-5">
          {/* The city is a link when it has a page, and plain text when it does not — a
              studio in one of the towns below the three-published threshold has a real city
              name and no city URL, and linking it would 404. */}
          <DirectoryBreadcrumb
            trail={[
              { label: "Studia", href: "/studia" },
              ...(listing.city
                ? [
                    {
                      label: listing.city,
                      href: listing.city_slug ? `/${listing.city_slug}` : null,
                    },
                  ]
                : []),
              { label: listing.name },
            ]}
          />
          <h1 className="text-h-middle text-gray-900">{listing.name}</h1>
          {listing.styles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.styles.map((style) => (
                <span
                  key={style}
                  className="text-filter-subtitle rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"
                >
                  {style}
                </span>
              ))}
            </div>
          )}
        </header>

        {listing.description && (
          <section className="px-4 py-5">
            <p className="text-m-descript whitespace-pre-line text-gray-700">
              {listing.description}
            </p>
          </section>
        )}

        <PricingSection listing={listing} />

        {hasLocation && (
          // `PublicLocation` is itself a `<section>` with its own heading — wrapping it in
          // another one nested the landmarks and rendered "Lokalizacja" twice in the
          // document outline. It takes a className precisely so the caller supplies the
          // spacing instead of a wrapper.
          <PublicLocation
            id="location-section"
            className="px-4 py-5"
            location={{
              title: listing.name,
              address: listing.address,
              city: listing.city,
              latitude: listing.latitude,
              longitude: listing.longitude,
            }}
            title={listing.name}
          />
        )}

        {links.length > 0 && (
          <section className="px-4 py-5">
            <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Linki</h2>
            <ProfileLinks links={links} />
          </section>
        )}

        {/* The claim entry for a studio that *has* a page lives here rather than on the city
            row, where the card is itself a link and has no room for it.

            Full-width and brand green: this is the outcome the whole directory exists to
            produce, and as a small outline button under a grey rule it read as an
            afterthought — indistinguishable from a tertiary action. It is the only call to
            action on the page, so it gets the page's width and the brand fill. */}
        <footer className="mt-4 border-t border-gray-100 px-4 py-6">
          <p className="text-m-header text-gray-900">To Twoje studio?</p>
          <p className="text-m-sunscript-font mt-1 text-gray-500">
            Przejmij profil i zarządzaj opisem, grafikiem i cennikiem samodzielnie.
          </p>
          <Button
            variant="green"
            size="cta"
            className="mt-4 w-full"
            onClick={() => setManaging(listing)}
          >
            Zarządzaj profilem
          </Button>
        </footer>

        <ManageStudioDrawer studio={managing} onOpenChange={(open) => !open && setManaging(null)} />
      </div>
    </>
  );
}

/**
 * The price, on the studio's own page only.
 *
 * A city page shows none at all — a tag on every row turns a directory of yoga studios into a
 * price comparison. Neither that argument nor the "city range is a national number" one
 * survives on one studio's own page, where the price is simply a fact about that studio.
 *
 * **The passes reuse the studio page's own `PassList`**, tile, per-entry maths, discount badge
 * and detail sheet included — but with `purchasable={false}`. The offers were read off someone
 * else's page; there is no such pass in our database and the studio has no account here, so a
 * checkout button would be a dead link at best and an offer to sell on a stranger's behalf at
 * worst.
 *
 * ⚠ **No sport-card section, deliberately.** 834 of the source's products mention Multisport,
 * Medicover or FitProfit — but those are passes *priced for* cardholders, not the studio
 * stating that it accepts a card as payment. `SportCardList` renders acceptance and a
 * surcharge, which this source never says, and inferring it from a product name would assert
 * something about a business that cannot correct it.
 *
 * What `PassList` cannot honestly take goes to the plain list below: a name and whatever the
 * studio wrote, claiming nothing about terms the source never parsed.
 */
function PricingSection({ listing }: { listing: DirectoryStudioDetail }) {
  const dropIn = listing.drop_in_price;
  const passes = listing.passes ?? [];
  const others = listing.other_offers ?? [];

  if (dropIn == null && passes.length === 0 && others.length === 0) return null;

  const symbol = getCurrencySymbol(listing.currency);

  return (
    <section id="pricing-section" className="px-4 py-5">
      <h2 className="mb-4 text-[18px] font-semibold text-[#222222]">Cennik</h2>

      {(dropIn != null || passes.length > 0) && (
        <PassList
          passes={passes.map((pass) => ({
            ...pass,
            studio_id: listing.external_id,
            // ⚠ `0`, not `null`. In `LightPassTile`'s vocabulary a null duration means
            // **unlimited** and renders "∞ dni"; `0` means "no duration to show". Ours means
            // *unknown* — the source parsed a validity period for only 687 of 7186 pass
            // offers — so passing it through would have claimed on every other tile that the
            // pass never expires. The API keeps `null` for unknown; the sentinel is a
            // rendering concern and stays here.
            duration_days: pass.duration_days ?? 0,
          }))}
          dropInPrice={dropIn}
          currency={listing.currency}
          purchasable={false}
        />
      )}

      {others.length > 0 && (
        <div className={passes.length > 0 || dropIn != null ? "mt-5" : undefined}>
          <h3 className="text-m-sunscript-font mb-1 text-gray-500">Pozostałe ceny</h3>
          <div className="divide-y divide-gray-100">
            {others.slice(0, OTHER_OFFER_LIMIT).map((offer, index) => (
              <div
                key={`${offer.name ?? "offer"}-${index}`}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#222222]">{offer.name ?? "Oferta"}</p>
                  {offer.category && (
                    <p className="mt-0.5 text-sm text-[#717171]">{offer.category}</p>
                  )}
                </div>
                <span className="shrink-0 text-base font-semibold text-[#222222]">
                  {offer.price_text ?? (offer.amount != null ? `${offer.amount} ${symbol}` : "—")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** One studio in the source carries 60 offers. A directory page is not a price list — the
 *  drop-in and the passes are what a reader came for; the rest is context. */
const OTHER_OFFER_LIMIT = 6;
