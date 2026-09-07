import { HashedAvatar } from "@/components/common/HashedAvatar";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import type { InstructorIndexItem } from "@/types/instructor";

import { styleNames } from "./grouping";

/** One person in a city strip: portrait, name, styles, bio — in that order.
 *
 * The whole card is a single tap target, and `DetailPageLink` records where the visit came
 * from so the profile page can offer a way back, exactly as every other list-to-detail link
 * in the product does.
 *
 * The link goes to `/instruktor/{slug}` — the Polish public URL, not the internal
 * `/instructor/...` folder path — because that is the URL the sitemap publishes and the one
 * canonical on the profile page.
 *
 * **What is deliberately absent**: a rating, a review count, years of experience, a class
 * count, a price, a next available class. None of them exist in this system. Reviews in
 * particular are stored against Google Places identifiers with no link to an instructor, so
 * an instructor rating is not derivable — asking for one is asking for a new feature, not a
 * field to surface here.
 */
export function InstructorCard({ person }: { person: InstructorIndexItem }) {
  const styles = styleNames(person);

  return (
    <DetailPageLink
      href={`/instruktor/${person.slug}`}
      className="flex w-[186px] shrink-0 snap-start flex-col gap-2"
    >
      {/* Fill mode, seeded by id: the same person gets the same fallback colour here and on
          their profile page, which is only true because both hash the id rather than the
          slug or the name. */}
      <HashedAvatar
        fill
        seed={person.id}
        name={person.name}
        imageId={person.image_id}
        className="aspect-[3/4] w-full rounded-2xl"
      />

      <div className="flex flex-col gap-1.5">
        {/* `break-words` rather than a truncation: the longest name in the roster has to fit
            the 186px card without pushing the strip's layout around, and a wrapped surname
            is better than an elided one on a page whose whole job is naming people. */}
        <p className="text-m-header break-words text-gray-900">{person.name}</p>

        {styles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {styles.slice(0, 2).map((s) => (
              <span
                key={s}
                className="text-filter-subtitle rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"
              >
                {s}
              </span>
            ))}
            {/* A count, never truncated text — "+3" says how much more there is, where
                "Vinyasa, Hatha, As…" says nothing and looks broken. */}
            {styles.length > 2 && (
              <span className="text-filter-subtitle px-1 py-0.5 text-gray-400">
                +{styles.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Omitted entirely when absent, not rendered as an empty row — the column is
            nullable and nothing forces it, so a card without a bio is a normal card, and
            the `gap-1.5` above is what keeps it looking deliberate. */}
        {person.short_bio && (
          <p className="text-m-sunscript-font line-clamp-2 text-gray-400">{person.short_bio}</p>
        )}
      </div>
    </DetailPageLink>
  );
}
