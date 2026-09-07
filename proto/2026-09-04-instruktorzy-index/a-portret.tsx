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
 * Variant A — Portrait. Two-column grid, photo leads.
 *
 * Closest to what this app already does on public pages: a card grid (every public list
 * uses `grid-cols-1 md:grid-cols-2`) and a photo card like `InstructorExampleCard` on
 * /instruktor/dodaj. Ten people are reached quickly.
 *
 * The cost: at 396px a column is ~180px. A double-barrelled surname wraps to two lines and
 * the bio fits two lines of short phrases. The card is dense, not roomy.
 *
 * ⚠ COMPONENT FINDING — `HashedAvatar` cannot fill a frame.
 *   It takes `size: number` and writes `style={{ width, height }}` inline, so the inline
 *   style beats any `h-full` class. A full-bleed portrait needs either a `fill` mode on
 *   `HashedAvatar` or — as below — drawing the fallback locally from the same exported maps
 *   (`hashSeedToClassColor`, `COLOR_FILL_700_MAP`). That is the same logic, not a new
 *   palette, but it is duplicated. If A wins, changing `HashedAvatar` is part of the scope.
 */
export default function PortretVariant() {
  const groups = groupByCity(instructorIndex);

  return (
    <div className="flex flex-col gap-8 px-4 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-h-middle text-gray-900">Instruktorzy</h1>
        <p className="text-m-descript text-gray-500">Znajdź osobę, z którą chcesz praktykować.</p>
      </header>

      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-subheader text-gray-900">{group.label}</h2>
            <span className="text-filter-subtitle text-gray-400">
              {personCount(group.people.length)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {group.people.map((person) => (
              <PortretCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PortretCard({ person }: { person: InstructorIndexItem }) {
  const styles = styleNames(person);

  return (
    <DetailPageLink
      href={`/instruktor/${person.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
    >
      <Portrait
        seed={person.id}
        name={person.name}
        imageId={person.image_id}
        className="aspect-[4/5] w-full"
      />

      <div className="flex flex-col gap-1 p-3">
        <p className="text-m-header text-gray-900">{person.name}</p>
        {styles.length > 0 && (
          <p className="truncate text-m-sunscript-font text-gray-500">{styles.join(" · ")}</p>
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
