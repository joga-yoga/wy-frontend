import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

export function formatPolishDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMMM yyyy", { locale: pl });
  } catch {
    return dateStr;
  }
}

export const BALANCE_METHOD_SHORT: Record<string, string> = {
  online: "online",
  cash_on_site: "gotówką na miejscu",
  bank_transfer: "przelewem",
};
