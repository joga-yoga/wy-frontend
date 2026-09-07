import { WyImage } from "@/components/custom/WyImage";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";
import { COLOR_FILL_700_MAP, hashSeedToClassColor } from "@/lib/classColors";
import { cn } from "@/lib/utils";

import {
  groupByCity,
  instructorIndex,
  type InstructorIndexItem,
  personCount,
  styleNames,
} from "./_data";

/**
 * Variant C — Rails. Each city is a horizontally scrolling strip.
 *
 * THIS IS A DEPARTURE FROM THE SYSTEM and should be read as one. No screen in this app
 * scrolls horizontally today; `docs/design/layout-idioms.md` does not know this pattern.
 * The reason it still stands in the comparison: the page has few people across many cities,
 * and this is the only one of the three layouts where TEN cities cost the same vertical
 * space as three. A and B grow linearly and become unwalkable at twenty cities.
 *
 * The real costs, not to be glossed over:
 *   • The sixth person in Warszawa may never be seen. A grid shows everyone; a rail shows
 *     three and a promise.
 *   • A new interaction pattern to maintain forever — precisely the cost `design-system`
 *     warns about.
 *   • Position within a rail decides traffic more sharply than position in a grid, because
 *     only the first two or three cards are visible without scrolling. Settled by sorting
 *     alphabetically (see `groupByCity`) rather than by `published_at DESC`, so at least
 *     position is stable and not a reward for having published most recently.
 *
 * ⚠ Same `HashedAvatar` gap as variant A: the component cannot fill a frame (inline size),
 *   so the portrait draws the fallback locally from the exported maps.
 */
export default function AlejkiVariant() {
  const groups = groupByCity(instructorIndex);

  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-2 px-4">
        <h1 className="text-h-middle text-gray-900">Instruktorzy</h1>
        <p className="text-m-descript text-gray-500">Znajdź osobę, z którą chcesz praktykować.</p>
      </header>

      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between px-4">
            <h2 className="text-subheader text-gray-900">{group.label}</h2>
            <span className="text-filter-subtitle text-gray-400">
              {personCount(group.people.length)}
            </span>
          </div>

          {/* `scroll-pl-4` / `scroll-pr-4` are load-bearing, not decoration. With
              `snap-mandatory` and `snap-start` children, the browser snaps the first card's
              edge to the SCROLLPORT start, which silently cancels `px-4`: measured
              scrollLeft was exactly 16px, so the card sat flush against the frame while the
              section heading sat at 16px. Scroll padding moves the snap position itself. */}
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scroll-pl-4 scroll-pr-4">
            {group.people.map((person) => (
              <AlejkaCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AlejkaCard({ person }: { person: InstructorIndexItem }) {
  const styles = styleNames(person);

  return (
    <DetailPageLink
      href={`/instruktor/${person.slug}`}
      className="flex w-[186px] shrink-0 snap-start flex-col gap-2"
    >
      <Portrait
        seed={person.id}
        name={person.name}
        imageId={person.image_id}
        className="aspect-[3/4] w-full rounded-2xl"
      />

      <div className="flex flex-col gap-1.5">
        <p className="text-m-header text-gray-900">{person.name}</p>

        {styles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {styles.slice(0, 2).map((s) => (
              <span
                key={s}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-filter-subtitle text-gray-600"
              >
                {s}
              </span>
            ))}
            {styles.length > 2 && (
              <span className="px-1 py-0.5 text-filter-subtitle text-gray-400">
                +{styles.length - 2}
              </span>
            )}
          </div>
        )}

        {person.short_bio && (
          <p className="line-clamp-2 text-m-sunscript-font text-gray-400">{person.short_bio}</p>
        )}
      </div>
    </DetailPageLink>
  );
}

/** Same rule as `HashedAvatar`, but filling the frame — see the note at the top of this file. */
function Portrait({
  seed,
  name,
  imageId,
  className,
}: {
  seed: string;
  name: string;
  imageId: string | null;
  className?: string;
}) {
  const hue = hashSeedToClassColor(seed);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("relative overflow-hidden", !imageId && COLOR_FILL_700_MAP[hue], className)}>
      {imageId ? (
        <WyImage src={imageId} alt={name} fill className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-h-middle text-white">
          {initials}
        </span>
      )}
    </div>
  );
}
