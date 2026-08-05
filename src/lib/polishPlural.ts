/**
 * Polish plural agreement.
 *
 * Polish has three forms, not two: 1 takes the singular, 2–4 take a "few" form, and 5+ take
 * a "many" form — except the teens (12–14), which take "many" despite ending in 2–4. Writing
 * `n === 1 ? "sesja" : "sesje"` therefore renders "7 sesje", which is wrong.
 *
 * The same three-way logic had already been written twice (in the schedule edit and cancel
 * screens) after a round of pluralization fixes; this is the shared version so it doesn't get
 * re-derived a fourth time.
 */
export function isFewForm(n: number): boolean {
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
}

/** Pick the right form for `n`: `plural(7, "sesja", "sesje", "sesji")` -> "sesji". */
export function plural(n: number, one: string, few: string, many: string): string {
  if (Math.abs(n) === 1) return one;
  return isFewForm(n) ? few : many;
}

/** "1 sesja", "3 sesje", "7 sesji". */
export function sesje(n: number): string {
  return `${n} ${plural(n, "sesja", "sesje", "sesji")}`;
}

/** "1 osobę", "3 osoby", "7 osób" — accusative, for "Powiadomimy N …". */
export function osoby(n: number): string {
  return `${n} ${plural(n, "osobę", "osoby", "osób")}`;
}

/** "1 osoba", "3 osoby", "7 osób" — nominative, for counting a roster or a client list. */
export function osobyNom(n: number): string {
  return `${n} ${plural(n, "osoba", "osoby", "osób")}`;
}

/** "1 wejście", "3 wejścia", "7 wejść" — pass entries (K3, B2C wallet). */
export function wejscia(n: number): string {
  return `${n} ${plural(n, "wejście", "wejścia", "wejść")}`;
}

/**
 * "z 1 wejścia", "z 8 wejść" — the *genitive* after "z" ("out of").
 *
 * Not the same form as `wejscia`: "0 z 1 wejście" is wrong, because everything after "z"
 * declines. Singular takes the genitive singular, everything else the genitive plural.
 */
export function wejscGenitive(n: number): string {
  return `${n} ${Math.abs(n) === 1 ? "wejścia" : "wejść"}`;
}

/** "1 wizyta", "3 wizyty", "7 wizyt" — visit history (K4). */
export function wizyty(n: number): string {
  return `${n} ${plural(n, "wizyta", "wizyty", "wizyt")}`;
}

/** "1 szablon", "3 szablony", "7 szablonów" — the template catalogue (U1). */
export function szablony(n: number): string {
  return `${n} ${plural(n, "szablon", "szablony", "szablonów")}`;
}
