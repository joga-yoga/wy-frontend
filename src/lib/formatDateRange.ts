import {
  format,
  formatDistanceToNow,
  isSameMonth,
  isSameYear,
  parseISO,
  setDefaultOptions,
} from "date-fns";
import { enUS, pl } from "date-fns/locale"; // Import the Polish locale

// Set default options for date-fns to use the Polish locale
// This should ideally be done once at the entry point of your application
// or before any date-fns functions are called.
setDefaultOptions({ locale: pl });

/**
 * Checks if two Date objects represent the same day (ignoring time).
 * @param date1 The first Date object.
 * @param date2 The second Date object.
 * @returns True if both dates are valid and represent the same day, false otherwise.
 */
function isSameDay(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return false;
  }
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Formats a single Date object, considering the current year, localized to Polish.
 * @param date The Date object to format.
 * @returns A formatted date string (e.g., "5 kwi", "5 kwi 2023") or an empty string if the date is invalid.
 */
function formatSingleDate(date: Date | null): string {
  if (!date || isNaN(date.getTime())) {
    return ""; // Invalid date object
  }
  const currentYear = new Date().getFullYear();
  if (date.getFullYear() === currentYear) {
    // 'd MMM' will automatically use the default Polish locale
    return format(date, "d MMM");
  } else {
    // 'd MMM yyyy' will automatically use the default Polish locale
    // Example output: "5 kwi 2023"
    return format(date, "d MMM yyyy");
  }
}

/**
 * Formats a date range, handling various scenarios for month, year, and undefined inputs, localized to Polish.
 *
 * @param startDateStr The start date as an ISO 8601 string (e.g., "2025-07-06"). Can be undefined or null.
 * @param endDateStr The end date as an ISO 8601 string (e.g., "2025-07-07"). Can be undefined or null.
 * @returns A formatted date range string (e.g., "6–7 lip", "31 lip – 1 sie 2023"),
 * an empty string if both inputs are missing, or "Nieprawidłowa data" for unparseable strings.
 */
export function formatDateRange(startDateStr?: string | null, endDateStr?: string | null): string {
  // Handle undefined or null inputs for both dates
  if (!startDateStr && !endDateStr) {
    return "";
  }

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  try {
    if (startDateStr) {
      startDate = parseISO(startDateStr);
      // Check if parseISO resulted in an invalid date
      if (isNaN(startDate.getTime())) {
        throw new Error("Invalid start date string");
      }
    }
    if (endDateStr) {
      endDate = parseISO(endDateStr);
      // Check if parseISO resulted in an invalid date
      if (isNaN(endDate.getTime())) {
        throw new Error("Invalid end date string");
      }
    }
  } catch (error) {
    console.error("Error parsing date strings:", error);
    return "Nieprawidłowa data"; // Localized error message
  }

  // If only one date is provided, format that single date
  if (startDate && !endDate) {
    return formatSingleDate(startDate);
  }
  if (!startDate && endDate) {
    return formatSingleDate(endDate);
  }

  // If after parsing, both are still null (e.g., if inputs were "", null, undefined), return empty string
  if (!startDate && !endDate) {
    return "";
  }

  // At this point, both startDate and endDate should be valid Date objects.
  // We can assert their types because the checks above handle null/invalid cases.
  const actualStartDate = startDate as Date;
  const actualEndDate = endDate as Date;

  // Ensure startDate is before or same as endDate for logical formatting
  if (actualStartDate.getTime() > actualEndDate.getTime()) {
    // Swap them to ensure correct chronological order for formatting
    [startDate, endDate] = [actualEndDate, actualStartDate];
  } else {
    startDate = actualStartDate;
    endDate = actualEndDate;
  }

  const currentYear = new Date().getFullYear();

  if (isSameDay(startDate, endDate)) {
    // If the dates are the same, just format that single date
    return formatSingleDate(startDate);
  } else if (isSameMonth(startDate, endDate) && isSameYear(startDate, endDate)) {
    // Dates in the same month and year: "5–6 kwi"
    if (startDate.getFullYear() === currentYear) {
      // 'd' (day) and 'd MMM' (day abbreviated month)
      return `${format(startDate, "d")}-${format(endDate, "d MMM")}`;
    } else {
      // 'd' (day) and 'd MMM yyyy' (day abbreviated month year)
      // Example output: "5–6 kwi 2023"
      return `${format(startDate, "d")}-${format(endDate, "d MMM yyyy")}`;
    }
  } else if (isSameYear(startDate, endDate)) {
    // Dates in different months but the same year: "31 lip – 1 sie"
    if (startDate.getFullYear() === currentYear) {
      // 'MMM d' (abbreviated month day) for both
      // Example output: "31 lip – 1 sie"
      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
    } else {
      // 'MMM d yyyy' (abbreviated month day year) for both
      // Example output: "31 lip 2023 – 1 sie 2023"
      return `${format(startDate, "MMM d yyyy")} - ${format(endDate, "MMM d yyyy")}`;
    }
  } else {
    // Dates in different years: "31 lip 2023 – 1 sie 2024"
    // 'MMM d yyyy' (abbreviated month day year) for both
    return `${format(startDate, "MMM d yyyy")} - ${format(endDate, "MMM d yyyy")}`;
  }
}

export function formatTimeAgo(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;

    if (isNaN(date.getTime())) {
      return "Uncorrect date";
    }

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: enUS,
    });
  } catch (error) {
    console.error("Date format error:", error);
    return "Uncorrect date";
  }
}
