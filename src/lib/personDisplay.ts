/**
 * How a person is labelled across the B2B surfaces (roster, resolve sheet, walk-in,
 * Do rozliczenia, Klienci).
 *
 * `User.name` is optional, so every one of those screens has to fall back to the email —
 * and must *not* then repeat it as a secondary line. That exact slip shipped last time: a
 * client-detail screen rendered `name || email` as its heading and the email again
 * underneath, so every nameless client showed the same address twice. Three sibling call
 * sites guarded it and one didn't, which is why the rule lives in one function now.
 */
export interface PersonLabel {
  /** Name when there is one, otherwise the email. Never empty. */
  primary: string;
  /** The email — but only when it isn't already `primary`. */
  secondary: string | null;
}

export function personLabel(name: string | null | undefined, email: string): PersonLabel {
  const trimmed = name?.trim();
  const primary = trimmed || email;
  return { primary, secondary: primary === email ? null : email };
}

/** Avatar initials: "Basia Adamska" -> "BA", a bare email -> its first two characters. */
export function personInitials(name: string | null | undefined, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const letters =
      parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
    return letters.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

/**
 * Initials for a *thing* rather than a person — a studio, an organisation.
 * "Święta Krowa Studio Jogi i Ruchu" -> "ŚK". Skips the joining words Polish studio
 * names are full of, so "Studio Jogi i Ruchu" does not come out as "SI".
 */
const PL_STOPWORDS = new Set(["i", "w", "na", "z", "ze", "od", "do", "the", "of"]);

export function entityInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w && !PL_STOPWORDS.has(w.toLocaleLowerCase("pl-PL")));
  if (words.length === 0) return "?";
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toLocaleUpperCase("pl-PL");
}

/** Sort key so lists order by the label the user actually sees, not always by email. */
export function personSortKey(name: string | null | undefined, email: string): string {
  return personLabel(name, email).primary.toLocaleLowerCase("pl-PL");
}
