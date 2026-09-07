import { HashedAvatar } from "@/components/common/HashedAvatar";
import { DetailPageLink } from "@/components/navigation/DetailPageLink";

import {
  groupByCity,
  instructorIndex,
  type InstructorIndexItem,
  personCount,
  styleNames,
} from "./_data";

/**
 * Variant B — Horizontal card. One column, 72px avatar, the bio gets room.
 *
 * This is `InstructorRow` promoted to a card: the same anatomy (avatar / name / supporting
 * line) but with a border, a radius and a third line for the bio — exactly what the detail
 * page's row cannot carry.
 *
 * Uses `HashedAvatar` UNCHANGED, so the same person gets the same fallback colour here as
 * on the studio page they teach at. It is the only one of the three needing no component
 * change at all — its advantage is cost, not looks.
 *
 * The cost: vertically the most expensive of the three. Ten people is a long scroll, and
 * the photo is small — on a page whose job is "find a person", the face gets 72px.
 */
export default function PoziomaVariant() {
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

          <div className="flex flex-col gap-2">
            {group.people.map((person) => (
              <PoziomaCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PoziomaCard({ person }: { person: InstructorIndexItem }) {
  const styles = styleNames(person);

  return (
    <DetailPageLink
      href={`/instruktor/${person.slug}`}
      className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3"
    >
      <HashedAvatar
        seed={person.id}
        name={person.name}
        imageId={person.image_id}
        size={72}
        className="rounded-2xl"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-subheader text-gray-900">{person.name}</p>
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
