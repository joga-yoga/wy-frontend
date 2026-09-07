import type { CityItem, InstructorPublicListItem, InstructorYogaStyle } from "@/types/instructor";

/**
 * Data for /instruktorzy — the public instructor index, claimed profiles only
 * (`claimed_at IS NOT NULL`), consistent with `sitemap.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY THIS TYPE EXISTS INSTEAD OF USING `InstructorPublicListItem` DIRECTLY
 *
 * `InstructorPublicListItem` (src/types/instructor.ts:83) returns exactly:
 *     name, slug, image_id, cities, yoga_styles, published_at
 *
 * This page needs two more fields. Both are REAL COLUMNS on
 * `wy-backend/src/app/models/instructor.py` — they are missing only from the public
 * projection, so this is an additive schema change with no migration:
 *
 *   id          — the `HashedAvatar` seed. The studio page seeds it with the instructor's
 *                 `id`, so seeding `slug` here would give THE SAME PERSON a different
 *                 fallback colour on /instruktorzy than on the studio page they teach at.
 *   short_bio   — the card's second line (session decision: bio AND styles · city).
 *
 * The type is declared here rather than in `src/fixtures/` on purpose: the fixtures README
 * (rule 2) requires every export to be annotated with a REAL product type. Until the
 * backend returns these fields, this type is a design proposal — and it should be visible
 * as a proposal rather than blended into the shared fixture layer.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHAT IS ABSENT BECAUSE IT EXISTS NOWHERE IN THE SYSTEM
 *
 *   rating / review count — `models/review.py` is keyed by `place_id` (Google Places) and
 *                           has no foreign key to an instructor. Not derivable.
 *   years of experience, class count, price, "next class"
 *   studios they teach at — EXISTS (`/public/instructors/{slug}/studios`) but is N+1 plus
 *                           the consent predicate in `crud/studio.py:919`. That is a new
 *                           batched query, not a projection change.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * COHERENCE WITH THE FIXTURE WORLD
 *
 * Przemek Nadolny and Marta Zielińska are the same people as in `src/fixtures/roster.ts` —
 * the only two with `claim_status: "claimed"`. Katarzyna Wroniecka (`invited`) and Tomasz
 * Sowa (`invitable`) are on the studio roster but MUST NOT appear here, and do not. The
 * claimed-only rule is visible in the data itself.
 *
 * The remaining people are new. The fixture world holds two claimed profiles; an index
 * needs several cities before grouping is visible at all.
 *
 * NOTE ON LANGUAGE: comments and identifiers are English; only strings that actually render
 * are Polish.
 */
export interface InstructorIndexItem extends Omit<InstructorPublicListItem, "image_id"> {
  /** Column `instructors.id`. Absent from `InstructorPublicListItem`. */
  id: string;
  /** Column `instructors.short_bio`, nullable. Absent from `InstructorPublicListItem`. */
  short_bio: string | null;
  /**
   * A WIDENING, NOT A TYPO — which is why the `Omit` above is there.
   *
   * `InstructorPublicListItem.image_id` is typed `string` (non-null), but the column
   * `instructors.image_id` is `Mapped[Optional[str]]` — NULLABLE. The schema is honest only
   * because the single endpoint returning it filters photoless people out:
   * `crud/instructor.py:160` → `Instructor.image_id.isnot(None)`.
   *
   * That filter exists because the card on /instruktor/dodaj has no fallback state. This
   * page has one — `HashedAvatar` draws initials on a `--class-{hue}-700` circle — so the
   * filter does not apply here and the type has to tell the truth about the column.
   *
   * ⚠ `image_id: "null"` (the string) is NOT a way around the type error: `HashedAvatar`
   *   would treat it as a valid Cloudinary id, fetch an asset called "null" and render a
   *   broken image instead of initials. A silent lie in the one place meant to be evidence.
   */
  image_id: string | null;
}

const city = (place_id: string, name: string): CityItem => ({
  place_id,
  name,
  country: "Polska",
});

/** A dictionary style — `yoga_style` populated, `custom_name` empty. */
const style = (slug: string, name: string): InstructorYogaStyle => ({
  id: `style-${slug}`,
  yoga_style_id: slug,
  custom_name: null,
  custom_icon_id: null,
  description: null,
  yoga_style: { id: slug, name, slug, icon_id: null },
});

/** A custom style — the instructor typed a name outside the dictionary. Both paths occur. */
const customStyle = (key: string, name: string): InstructorYogaStyle => ({
  id: `style-${key}`,
  yoga_style_id: null,
  custom_name: name,
  custom_icon_id: null,
  description: null,
  yoga_style: null,
});

/**
 * The only two real Cloudinary ids the fixture layer has (`src/fixtures/instructor.ts`).
 * Everyone else carries `image_id: null` and renders through `HashedAvatar`.
 *
 * ⚠ This under-represents photos relative to production: 2 of 10 here, whereas most claimed
 *   profiles do have one. When judging the variants, read the card WITH a photo as the
 *   typical case and initials as the edge case — not the other way round.
 */
const PHOTO_A = "w.yoga2_qtnigw_p2gegq";
const PHOTO_B = "w.yoga1_mprdyz_hasbo9";

export const instructorIndex: InstructorIndexItem[] = [
  {
    id: "in-przemek",
    name: "Przemek Nadolny",
    slug: "przemek-nadolny",
    image_id: PHOTO_A,
    short_bio:
      "Prowadzę uważną praktykę dla ciała, oddechu i spokoju umysłu. Zaczynamy powoli, w rytmie oddechu.",
    cities: [city("lodz", "Łódź")],
    // Four styles — the overflow case for any card that lists them inline.
    yoga_styles: [
      style("hatha", "Hatha"),
      style("ashtanga", "Asztanga"),
      style("yin", "Yin"),
      customStyle("hot", "Hot"),
    ],
    published_at: "2024-11-04T09:00:00+01:00",
  },
  {
    id: "in-marta",
    name: "Marta Zielińska",
    slug: "marta-zielinska",
    image_id: PHOTO_B,
    short_bio: "Vinyasa w spokojnym tempie, z naciskiem na oddech.",
    cities: [city("lodz", "Łódź")],
    yoga_styles: [style("vinyasa", "Vinyasa")],
    published_at: "2025-02-17T10:30:00+01:00",
  },
  {
    // Longest name in the set — the truncation case.
    id: "in-aleksandra",
    name: "Aleksandra Wiśniewska-Kaczmarek",
    slug: "aleksandra-wisniewska-kaczmarek",
    image_id: null,
    short_bio:
      "Praktykuję i uczę od kilkunastu lat. Na macie szukam tego, co daje się utrzymać poza nią.",
    cities: [city("warszawa", "Warszawa")],
    yoga_styles: [style("vinyasa", "Vinyasa"), style("yin", "Yin")],
    published_at: "2025-04-08T12:00:00+02:00",
  },
  {
    id: "in-bartosz",
    name: "Bartosz Kędzierski",
    slug: "bartosz-kedzierski",
    image_id: null,
    short_bio: "Asztanga w tradycji Mysore. Praktyka codzienna, własnym tempem.",
    cities: [city("warszawa", "Warszawa")],
    yoga_styles: [style("ashtanga", "Asztanga")],
    published_at: "2025-05-21T08:00:00+02:00",
  },
  {
    id: "in-zofia",
    name: "Zofia Malinowska",
    slug: "zofia-malinowska",
    image_id: null,
    // Bio is sometimes empty — the column is nullable and nothing forces it to be filled.
    // The card has to look right without this line.
    short_bio: null,
    cities: [city("warszawa", "Warszawa")],
    yoga_styles: [style("nidra", "Joga Nidra"), style("yin", "Yin")],
    published_at: "2025-06-30T17:45:00+02:00",
  },
  {
    id: "in-krzysztof",
    name: "Krzysztof Antczak",
    slug: "krzysztof-antczak",
    image_id: null,
    short_bio: "Hatha bez pośpiechu, dużo miejsca na oddech i odpoczynek.",
    cities: [city("krakow", "Kraków")],
    yoga_styles: [style("hatha", "Hatha")],
    published_at: "2025-01-15T11:20:00+01:00",
  },
  {
    id: "in-natalia",
    name: "Natalia Grzelak",
    slug: "natalia-grzelak",
    image_id: null,
    short_bio:
      "Dynamiczna vinyasa z muzyką. Lubię, kiedy po zajęciach zostaje energia, a nie zmęczenie.",
    cities: [city("krakow", "Kraków")],
    yoga_styles: [style("vinyasa", "Vinyasa"), customStyle("hot", "Hot")],
    published_at: "2025-07-12T09:10:00+02:00",
  },
  {
    id: "in-igor",
    name: "Igor Pawlak",
    slug: "igor-pawlak",
    image_id: null,
    short_bio: "Mysore rano, dla osób, które chcą praktykować regularnie.",
    cities: [city("wroclaw", "Wrocław")],
    yoga_styles: [style("ashtanga", "Asztanga"), customStyle("mysore", "Mysore")],
    published_at: "2025-03-03T07:30:00+01:00",
  },
  {
    id: "in-hanna",
    name: "Hanna Sobczak",
    slug: "hanna-sobczak",
    image_id: null,
    short_bio: "Yin i praca z oddechem. Zajęcia wieczorne, na wyciszenie.",
    cities: [city("wroclaw", "Wrocław")],
    yoga_styles: [style("yin", "Yin")],
    published_at: "2025-08-19T19:00:00+02:00",
  },
  {
    id: "in-jaroslaw",
    name: "Jarosław Bielawski",
    slug: "jaroslaw-bielawski",
    image_id: null,
    short_bio: "Uczę online i na wyjazdach. Hatha, dużo pracy z ustawieniem.",
    // `cities` is nullable and nothing forces it to be filled. This person forces an answer
    // to the question a filter would never have asked: where does a profile with no city go?
    cities: null,
    yoga_styles: [style("hatha", "Hatha")],
    published_at: "2025-09-01T10:00:00+02:00",
  },
];

// ── Grouping by city ────────────────────────────────────────────────────────────────────

export interface CityGroup {
  key: string;
  label: string;
  people: InstructorIndexItem[];
}

/** Section label for profiles with no city. OPEN QUESTION — see meta.json. */
export const NO_CITY_LABEL = "Pozostałe profile";

/**
 * Groups by `cities[0]`, the same way every other consumer in the codebase reads it
 * (`InstructorCtaPageContent.tsx:517`). Cities ordered by size, no-city profiles always last.
 *
 * Within a city, people are sorted ALPHABETICALLY by name (session decision), not by
 * `published_at DESC` as `crud/instructor.py:172` does today. Newest-first reshuffles the
 * page every time anyone joins, so the same person moves between visits and established
 * instructors sink as new ones arrive; a directory's core promise is that you can find
 * someone twice. Alphabetical is deterministic, caches cleanly under the existing 300s
 * revalidate, and matches the `order_by(Studio.name)` precedent in `crud/studio.py:944`.
 *
 * `localeCompare(…, "pl")` is required, not cosmetic: the default collation sorts Ł after Z,
 * which would put "Łukasz" after "Zofia".
 */
export function groupByCity(items: InstructorIndexItem[]): CityGroup[] {
  const groups = new Map<string, CityGroup>();
  const noCity: InstructorIndexItem[] = [];

  for (const item of items) {
    const first = item.cities?.[0];
    if (!first) {
      noCity.push(item);
      continue;
    }
    const existing = groups.get(first.place_id);
    if (existing) {
      existing.people.push(item);
    } else {
      groups.set(first.place_id, {
        key: first.place_id,
        label: first.name,
        people: [item],
      });
    }
  }

  const sorted = [...groups.values()].sort(
    (a, b) => b.people.length - a.people.length || a.label.localeCompare(b.label, "pl"),
  );

  if (noCity.length > 0) {
    sorted.push({ key: "__no_city__", label: NO_CITY_LABEL, people: noCity });
  }

  for (const group of sorted) {
    group.people.sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }
  return sorted;
}

/** Style name — a custom name wins over the dictionary one, as everywhere else. */
export function styleName(s: InstructorYogaStyle): string | null {
  return s.custom_name ?? s.yoga_style?.name ?? null;
}

export function styleNames(item: InstructorIndexItem): string[] {
  return item.yoga_styles.map(styleName).filter((n): n is string => Boolean(n));
}

/** Correct Polish plural: 1 osoba, 2–4 osoby, 5+ osób (with the 12–14 exception). */
export function personCount(n: number): string {
  if (n === 1) return "1 osoba";
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return `${n} osoby`;
  return `${n} osób`;
}
