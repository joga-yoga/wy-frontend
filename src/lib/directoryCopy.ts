import { plural } from "@/lib/polishPlural";

/** "1 studio", "3 studia", "7 studiów".
 *
 * Three forms, not two — and the teens are the case that catches people: 12–14 take the
 * "many" form despite ending in 2–4, so `12 studia` is wrong. `plural` already knows this;
 * this wrapper exists so the three forms are written down once.
 */
export function studios(n: number): string {
  return `${n} ${plural(n, "studio", "studia", "studiów")}`;
}

/** The opening sentence of a city page — "W Krakowie znajdziesz 63 studia jogi."
 *
 * Returns `null` when the city has no stored locative phrase. That is AC10, and it is a
 * real requirement rather than a defensive nicety: Polish locative cannot be derived from
 * the nominative by rule, so a generated form would be wrong in the first line of the page.
 * No sentence is better than a wrong one.
 */
export function cityOpeningSentence(
  locative: string | null | undefined,
  activeCount: number,
): string | null {
  if (!locative) return null;
  const opener = locative.charAt(0).toUpperCase() + locative.slice(1);
  return `${opener} znajdziesz ${studios(activeCount)} jogi.`;
}

/** "1 miasto", "3 miasta", "7 miast". */
export function miasta(n: number): string {
  return `${n} ${plural(n, "miasto", "miasta", "miast")}`;
}

/** "1 miejscowość", "3 miejscowości", "7 miejscowości" — the "few" and "many" forms
 *  coincide here, which is why this is written down rather than re-derived each time. */
export function miejscowosci(n: number): string {
  return `${n} ${plural(n, "miejscowość", "miejscowości", "miejscowości")}`;
}

/** "w 1 mieście", "w 38 miastach" — the **locative**, for use after `w`.
 *
 * Not interchangeable with `miasta()`. That one gives the nominative/genitive form a count
 * takes on its own ("38 miast"), which is what an apposition or a heading wants; dropping it
 * after a preposition produces *"w 38 miast"*, which is simply ungrammatical. The two forms
 * exist separately so the choice is made at the call site rather than by accident.
 */
export function miastaLocative(n: number): string {
  return `${n} ${n === 1 ? "mieście" : "miastach"}`;
}

/** "w 1 miejscowości", "w 151 miejscowościach" — the locative, for use after `w`. */
export function miejscowosciLocative(n: number): string {
  return `${n} ${n === 1 ? "miejscowości" : "miejscowościach"}`;
}

/** "Hatha joga w Krakowie" — a style heading placed in a city.
 *
 * The locative is stored, never derived (see `cityOpeningSentence`); a city without one is
 * named plainly after a dash rather than with a guessed case, the same fallback the city page's
 * own heading uses.
 */
export function styleInCity(
  heading: string,
  city: { name: string; locative: string | null | undefined },
): string {
  return city.locative ? `${heading} ${city.locative}` : `${heading} – ${city.name}`;
}
