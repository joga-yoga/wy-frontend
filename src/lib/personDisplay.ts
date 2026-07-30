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

/** Sort key so lists order by the label the user actually sees, not always by email. */
export function personSortKey(name: string | null | undefined, email: string): string {
  return personLabel(name, email).primary.toLocaleLowerCase("pl-PL");
}
