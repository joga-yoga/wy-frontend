/** Plain-text display only; callers render this as text, never as HTML. */
export function stripHtml(value: string | null | undefined) {
  return value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
