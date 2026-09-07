import { Metadata } from "next";

import { JsonLd } from "@/components/seo/JsonLd";
import { getInstructorIndex } from "@/lib/api/getInstructorIndex";
import { buildCollectionJsonLd, buildPageMetadata } from "@/lib/seo";

import { type CityGroup, groupByCity, personCount } from "./grouping";
import { InstructorCard } from "./InstructorCard";

// The folder is English and the public URL is Polish — `/instruktorzy` reaches this page
// through a rewrite in `next.config.mjs`, exactly as `/instruktor/:slug` reaches
// `instructor/[slug]`. Folder names stay language-neutral so future i18n does not rename them.
const PUBLIC_PATH = "/instruktorzy";

// Neutral platform voice, not an owner's voice: this page belongs to no single studio or
// instructor, so it says "Instruktorzy jogi", never "nasi instruktorzy".
const pageTitle = "joga.yoga – instruktorzy jogi";
const pageDescription =
  "Instruktorzy jogi w polskich miastach. Znajdź osobę, z którą chcesz praktykować.";

export const metadata: Metadata = {
  ...buildPageMetadata({
    project: "workshops",
    title: pageTitle,
    description: pageDescription,
    path: PUBLIC_PATH,
  }),
};

export default async function InstructorsIndexPage() {
  const groups = groupByCity(await getInstructorIndex());

  return (
    <div className="flex flex-col gap-8 py-6">
      <JsonLd
        data={buildCollectionJsonLd({
          project: "workshops",
          path: PUBLIC_PATH,
          name: pageTitle,
          description: pageDescription,
        })}
      />

      <header className="flex flex-col gap-2 px-4">
        <h1 className="text-h-middle text-gray-900">Instruktorzy</h1>
        <p className="text-m-descript text-gray-500">Znajdź osobę, z którą chcesz praktykować.</p>
      </header>

      {groups.length === 0 ? (
        <p className="text-m-descript px-4 text-gray-500">Nie ma tu jeszcze żadnych profili.</p>
      ) : (
        groups.map((group) => <CitySection key={group.key} group={group} />)
      )}
    </div>
  );
}

/** One city, as a horizontally scrolling strip of cards.
 *
 * This is a **deliberate departure from the design system** — nothing else in this product
 * scrolls horizontally. It was chosen because it is the only layout whose page height does
 * not grow with the number of cities: with a small roster spread across many of them, a
 * vertical grid becomes unwalkable long before the roster is interesting.
 *
 * The accepted cost, stated here so it is not rediscovered later: only the first two or
 * three cards are visible without scrolling, so position within a strip matters more than
 * position in a grid would. Alphabetical ordering is what keeps that position stable rather
 * than a reward for having joined recently.
 */
function CitySection({ group }: { group: CityGroup }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-4">
        {/* The city renders exactly as the profile stores it — never translated, never
            re-cased. See `groupByCity` for what that implies about spellings. */}
        <h2 className="text-subheader text-gray-900">{group.label}</h2>
        <span className="text-filter-subtitle text-gray-400">
          {personCount(group.people.length)}
        </span>
      </div>

      {/* `scroll-pl-4` / `scroll-pr-4` are load-bearing, not decoration.
          With `snap-mandatory` and `snap-start` children the browser aligns the first card's
          edge to the SCROLLPORT start, which silently cancels `px-4`: the prototype was
          measured at scrollLeft 16 on load, the card sitting flush against the frame while
          the heading sat at 16px. Scroll padding moves the snap position itself, so the two
          line up. This is the detail most likely to regress — if the first card ever stops
          aligning with its heading, look here first.

          `tabIndex={0}` is not decoration either: a strip that only answers to a horizontal
          swipe is unusable on a desktop without a trackpad. Focusing the container makes it
          arrow-key scrollable. */}
      <div
        role="region"
        aria-label={`Instruktorzy — ${group.label}`}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 scroll-pr-4 px-4 pb-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
      >
        {/* Every person is in the document whether or not they are scrolled into view —
            nothing is fetched lazily on scroll. The page is a crawlable directory first. */}
        {group.people.map((person) => (
          <InstructorCard key={person.id} person={person} />
        ))}
      </div>
    </section>
  );
}
