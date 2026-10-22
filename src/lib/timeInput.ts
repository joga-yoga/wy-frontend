/** Exact 24-hour, minute-level input; deliberately does not parse dates or timezones. */
export function isValidTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}
