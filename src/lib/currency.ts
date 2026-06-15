export const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: "zł",
  EUR: "€",
  USD: "$",
  GBP: "£",
};

export function getCurrencySymbol(currency: string | null | undefined, fallback = "zł"): string {
  if (!currency) return fallback;
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}
