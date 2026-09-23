import Link from "next/link";

import { RaisedStudioCard } from "@/app/(public)/[miasto]/studios/StudioCards";
import { getSimilarStudios } from "@/lib/api/getCityDirectory";
import { cityStudiosPath } from "@/lib/directoryPaths";

/**
 * "Studia jogi w pobliżu" — the block at the foot of an **unclaimed** listing's page.
 *
 * Not on a claimed studio's page: that page belongs to its owner, and listing nearby
 * alternatives on it works against the studio the platform serves.
 *
 * A **server component on purpose**: the block is internal linking as much as it is a
 * reader's next step, and its links have to be in the HTML a crawler receives. Without it an
 * unclaimed listing's page is a dead end whose only way out is the breadcrumb.
 *
 * Nearby, not alike — the ranking is the backend's (`services/similar_studios.py`): same
 * district, then distance, then shared styles, never another city.
 *
 * The cards are the city page's own raised card, so a studio looks the same here as on the
 * page this block links up to. Platform voice: an unclaimed listing has no owner to speak.
 */
export async function SimilarStudios({ slug, className }: { slug: string; className?: string }) {
  const { city, studios } = await getSimilarStudios(slug);
  if (studios.length === 0) return null;

  return (
    <section aria-labelledby="similar-studios-heading" className={className}>
      <h2 id="similar-studios-heading" className="mb-4 text-[18px] font-semibold text-[#222222]">
        Studia jogi w pobliżu
      </h2>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 [&>li>*]:h-full">
        {studios.map((studio) => (
          <RaisedStudioCard key={studio.external_id} studio={studio} />
        ))}
      </ul>
      {/* One more way up to the city page, and the natural next step after six studios. The
          locative is stored, never generated — without one the city is named plainly. */}
      {city && (
        <Link
          href={cityStudiosPath(city.slug)}
          className="text-m-header mt-4 inline-block text-gray-900 underline underline-offset-4 hover:text-gray-600"
        >
          {city.locative
            ? `Wszystkie studia jogi ${city.locative}`
            : `Wszystkie studia jogi – ${city.name}`}
        </Link>
      )}
    </section>
  );
}
