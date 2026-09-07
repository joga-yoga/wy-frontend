import type { InstructorIndexItem, InstructorYogaStyle } from "@/types/instructor";

/** The section that collects people who have not filled in a city.
 *
 * "Pozostali" is masculine-personal and would misgender most of this roster; the noun keeps
 * the label neutral. It must also never be named from an inferred attribute — in particular
 * not "online", because nothing in the data records whether someone teaches online. The only
 * evidence is prose inside a bio, and naming a section from that invents a field.
 */
export const NO_CITY_LABEL = "Pozostałe profile";

const NO_CITY_KEY = "__no_city__";

export interface CityGroup {
  key: string;
  label: string;
  people: InstructorIndexItem[];
}

/** Groups people into city sections, largest first, alphabetical within each.
 *
 * **Sections are keyed on the city name exactly as stored, not on `place_id`.** That is a
 * decision, and it has a visible consequence worth stating so nobody "fixes" it by accident:
 * Google Places supplies these names unnormalised, and the database already contains both
 * `Warsaw` and `Warszawa` under the same `place_id` — so they render as two sections with
 * two separate counts.
 *
 * Keying on `place_id` would merge them, which is why the prototype did that. It was not
 * adopted, for two reasons. The label would then have to be chosen from among several
 * spellings — the prototype took whichever it saw first, which is non-deterministic across
 * requests — and the copy rule for this page is that a city renders exactly as the profile
 * stores it, never translated and never re-cased. The real fix belongs where the profile is
 * saved, not here: normalise the Places response on write, and both rows converge on one
 * spelling with no display logic involved.
 *
 * A person is placed by their **first** city, matching how every other surface in the
 * product reads that field. Cities with nobody in them do not exist — sections come from
 * the data, never from a fixed list.
 */
export function groupByCity(items: InstructorIndexItem[]): CityGroup[] {
  const groups = new Map<string, CityGroup>();
  const noCity: InstructorIndexItem[] = [];

  for (const item of items) {
    const cityName = item.cities?.[0]?.name?.trim();
    if (!cityName) {
      noCity.push(item);
      continue;
    }
    const existing = groups.get(cityName);
    if (existing) {
      existing.people.push(item);
    } else {
      groups.set(cityName, { key: cityName, label: cityName, people: [item] });
    }
  }

  const sorted = [...groups.values()].sort(
    (a, b) => b.people.length - a.people.length || a.label.localeCompare(b.label, "pl"),
  );

  for (const group of sorted) {
    group.people.sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }

  // Always last, however many people are in it — it is the only section not named after a
  // place, so it cannot take part in the size ordering above.
  if (noCity.length > 0) {
    noCity.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    sorted.push({ key: NO_CITY_KEY, label: NO_CITY_LABEL, people: noCity });
  }

  return sorted;
}

/** Correct Polish plural: 1 osoba, 2–4 osoby, 5+ osób — with the 12–14 exception.
 *
 * Polish picks the plural form from the last digit, except in the teens, where every number
 * takes the genitive plural. So 22 is "osoby" but 12 is "osób". */
export function personCount(n: number): string {
  if (n === 1) return "1 osoba";
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return `${n} osoby`;
  return `${n} osób`;
}

/** A style the instructor typed themselves wins over the dictionary one, as everywhere
 * else in the product. The distinction is internal and never surfaces on the card. */
export function styleName(s: InstructorYogaStyle): string | null {
  return s.custom_name ?? s.yoga_style?.name ?? null;
}

export function styleNames(item: InstructorIndexItem): string[] {
  return item.yoga_styles.map(styleName).filter((n): n is string => Boolean(n));
}
