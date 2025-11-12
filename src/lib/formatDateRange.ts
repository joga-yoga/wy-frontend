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

/**
 * Formats a date range for workshops with times in UTC.
 * Displays start date/time and end date/time for workshops.
 *
 * @param startDateStr The start date as an ISO 8601 string (e.g., "2025-07-06T12:00:00Z"). Can be undefined or null.
 * @param endDateStr The end date as an ISO 8601 string (e.g., "2025-07-07T13:00:00Z"). Can be undefined or null.
 * @returns A formatted date/time range string (e.g., "6 lip 12:00 – 7 lip 13:00"),
 * an empty string if both inputs are missing, or "Nieprawidłowa data" for unparseable strings.
 */
export function formatDateTimeRange(
  startDateStr?: string | null,
  endDateStr?: string | null,
): string {
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

  // Helper to format UTC datetime in Polish
  const formatUTCDateTime = (date: Date): string => {
    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth() + 1;
    const utcDay = date.getUTCDate();
    const utcHours = String(date.getUTCHours()).padStart(2, "0");
    const utcMinutes = String(date.getUTCMinutes()).padStart(2, "0");

    // Create a temporary date string to use format with Polish locale
    // This is a bit of a workaround to use date-fns polish locale
    const tempDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, 0, 0, 0));
    const currentYear = new Date().getFullYear();
    const dateStr =
      currentYear === utcYear ? format(tempDate, "d MMM") : format(tempDate, "d MMM yyyy");

    return `${dateStr} ${utcHours}:${utcMinutes}`;
  };

  // If only one date is provided, format that single datetime
  if (startDate && !endDate) {
    return formatUTCDateTime(startDate);
  }
  if (!startDate && endDate) {
    return formatUTCDateTime(endDate);
  }

  // If after parsing, both are still null
  if (!startDate && !endDate) {
    return "";
  }

  // Both dates are valid
  const actualStartDate = startDate as Date;
  const actualEndDate = endDate as Date;

  // Ensure chronological order
  if (actualStartDate.getTime() > actualEndDate.getTime()) {
    return `${formatUTCDateTime(actualEndDate)} – ${formatUTCDateTime(actualStartDate)}`;
  }

  return `${formatUTCDateTime(actualStartDate)} – ${formatUTCDateTime(actualEndDate)}`;
}

/**
 * Formats a date as day of week, full month name, and day number in Polish.
 * @param dateStr The date as an ISO 8601 string (e.g., "2025-05-15") or Date object.
 * @returns A formatted date string (e.g., "Wtorek, Maj 15") or "Nieprawidłowa data" if invalid.
 */
export function formatDateStart(dateStr: string | Date | null | undefined): string {
  if (!dateStr) {
    return "";
  }

  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;

    if (isNaN(date.getTime())) {
      return "Nieprawidłowa data";
    }

    // Format: "Wtorek, 15 Maj"
    const formatted = format(date, "EEEE, d MMMM", { locale: pl });
    const [dayOfWeek, monthAndDay] = formatted.split(", ");
    const capitalizedDayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const capitalizedMonthAndDay = monthAndDay.charAt(0).toUpperCase() + monthAndDay.slice(1);
    return `${capitalizedDayOfWeek}, ${capitalizedMonthAndDay}`;
  } catch (error) {
    console.error("Date format error:", error);
    return "Nieprawidłowa data";
  }
}

/**
 * Formats a date with time as day of week, full month name, day number, and time in UTC Polish.
 * @param dateStr The date as an ISO 8601 string (e.g., "2025-05-15T14:30:00Z") or Date object.
 * @returns A formatted date/time string (e.g., "Wtorek, Maj 15, 14:30") or "Nieprawidłowa data" if invalid.
 */
export function formatDateStartWithTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) {
    return "";
  }

  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;

    if (isNaN(date.getTime())) {
      return "Nieprawidłowa data";
    }

    // Extract UTC time components
    const utcHours = String(date.getUTCHours()).padStart(2, "0");
    const utcMinutes = String(date.getUTCMinutes()).padStart(2, "0");
    const timeStr = `${utcHours}:${utcMinutes}`;

    // Format the date part in UTC
    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth() + 1;
    const utcDay = date.getUTCDate();

    // Create a temporary date to format day of week and month in Polish
    const tempDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, 0, 0, 0));
    const formatted = format(tempDate, "EEEE, d MMMM", { locale: pl });
    const [dayOfWeek, monthAndDay] = formatted.split(", ");
    const capitalizedDayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const capitalizedMonthAndDay = monthAndDay.charAt(0).toUpperCase() + monthAndDay.slice(1);

    // Format: "Wtorek, 15 Maj, 14:30"
    return `${capitalizedDayOfWeek}, ${capitalizedMonthAndDay} ${timeStr}`;
  } catch (error) {
    console.error("Date format error:", error);
    return "Nieprawidłowa data";
  }
}

/**
 * Calculates the duration in hours between two dates.
 * @param startDateStr The start date as an ISO 8601 string (e.g., "2025-07-06T12:00:00Z"). Can be undefined or null.
 * @param endDateStr The end date as an ISO 8601 string (e.g., "2025-07-07T13:00:00Z"). Can be undefined or null.
 * @returns A formatted duration string (e.g., "25 godzin", "1.5 godziny") or an empty string if dates are missing.
 */
export function formatDurationInHours(
  startDateStr?: string | null,
  endDateStr?: string | null,
): string {
  if (!startDateStr || !endDateStr) {
    return "";
  }

  try {
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return "";
    }

    const durationMs = Math.abs(endDate.getTime() - startDate.getTime());
    const durationHours = durationMs / (1000 * 60 * 60);

    // Format the duration
    if (durationHours === 1) {
      return "1 godzina";
    }

    // Remove .0 from whole numbers
    const formattedHours =
      durationHours % 1 === 0 ? Math.floor(durationHours) : durationHours.toFixed(1);

    if (durationHours < 5) {
      return `${formattedHours} godziny`;
    } else {
      return `${Math.round(durationHours)} godzin`;
    }
  } catch (error) {
    console.error("Error calculating duration:", error);
    return "";
  }
}
