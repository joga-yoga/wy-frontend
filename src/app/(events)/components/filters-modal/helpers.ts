import { Price } from "@/app/(events)/components/filters-modal/types";

export function formatPrice(price: Price): string {
  const { min_price, max_price } = price;

  if (min_price === 0) {
    return `< ${max_price} PLN`;
  }

  return `${min_price} - ${max_price} PLN`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  const monthNames = [
    "Stycznia",
    "Lutego",
    "Marca",
    "Kwietnia",
    "Maja",
    "Czerwca",
    "Lipca",
    "Sierpnia",
    "Września",
    "Października",
    "Listopada",
    "Grudnia",
  ];

  const formatSingleDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formattedStart = formatSingleDate(startDate);
  const formattedEnd = formatSingleDate(endDate);

  if (startDate === endDate) {
    return formattedStart;
  }

  return `${formattedStart} - ${formattedEnd}`;
}
