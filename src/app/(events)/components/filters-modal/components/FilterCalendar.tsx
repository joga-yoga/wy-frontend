"use client";

import "react-day-picker/style.css";

import { pl } from "date-fns/locale";
import React, { useState } from "react";
import { DateRange, DayPicker, getDefaultClassNames } from "react-day-picker";

interface CalendarProps {
  startDateFrom?: string | null;
  startDateTo?: string | null;
  onDateSelect?: (from: string | null, to: string | null) => void;
}

export default function Calendar({ startDateFrom, startDateTo, onDateSelect }: CalendarProps) {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Convert string dates to DateRange for react-day-picker
  const selectedRange: DateRange | undefined = React.useMemo(() => {
    if (!startDateFrom && !startDateTo) return undefined;

    return {
      from: startDateFrom ? new Date(startDateFrom) : undefined,
      to: startDateTo ? new Date(startDateTo) : undefined,
    };
  }, [startDateFrom, startDateTo]);

  // Handle date selection and convert to string format
  const handleDateSelect = (range: DateRange | undefined) => {
    if (!onDateSelect) return;

    const fromString = range?.from
      ? `${range.from.getFullYear()}-${String(range.from.getMonth() + 1).padStart(2, "0")}-${String(range.from.getDate()).padStart(2, "0")}`
      : null;
    const toString = range?.to
      ? `${range.to.getFullYear()}-${String(range.to.getMonth() + 1).padStart(2, "0")}-${String(range.to.getDate()).padStart(2, "0")}`
      : null;

    onDateSelect(fromString, toString);
  };

  // State for each calendar's displayed month
  const [firstCalendarMonth, setFirstCalendarMonth] = useState(today);
  const [secondCalendarMonth, setSecondCalendarMonth] = useState(nextMonth);

  // Update calendar months when external dates are selected
  React.useEffect(() => {
    if (startDateFrom) {
      const fromDate = new Date(startDateFrom);
      setFirstCalendarMonth(new Date(fromDate.getFullYear(), fromDate.getMonth(), 1));

      if (startDateTo) {
        const toDate = new Date(startDateTo);
        // If end date is in different month, show it in second calendar
        if (
          fromDate.getMonth() !== toDate.getMonth() ||
          fromDate.getFullYear() !== toDate.getFullYear()
        ) {
          setSecondCalendarMonth(new Date(toDate.getFullYear(), toDate.getMonth(), 1));
        } else {
          // Same month, show next month in second calendar
          setSecondCalendarMonth(new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1));
        }
      } else {
        // Only start date, show next month in second calendar
        setSecondCalendarMonth(new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1));
      }
    } else {
      // Reset to current and next month when dates are cleared
      const currentDate = new Date();
      const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setFirstCalendarMonth(currentDate);
      setSecondCalendarMonth(nextMonthDate);
    }
  }, [startDateFrom, startDateTo]);

  const defaultClassNames = getDefaultClassNames();

  // Custom chevron SVG component
  const ChevronLeft = () => (
    <svg
      width="5.25"
      height="9.63"
      viewBox="0 0 6 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "5.250588417053223px",
        height: "9.625487327575684px",
      }}
    >
      <path
        d="M5 9L1 5L5 1"
        stroke="#18181B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ChevronRight = () => (
    <svg
      width="5.25"
      height="9.63"
      viewBox="0 0 6 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "5.250588417053223px",
        height: "9.625487327575684px",
      }}
    >
      <path
        d="M1 9L5 5L1 1"
        stroke="#18181B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const calendarClassNames = {
    ...defaultClassNames,
    month:
      "bg-white rounded-2xl shadow-[0px_3px_8px_rgba(0,0,0,0.12),0px_6px_16px_rgba(0,0,0,0.08)] w-[254px] p-2",
    month_caption: "flex justify-between items-center mb-4",
    caption_label: "text-filter-subtitle text-center flex-1",
    button_previous:
      "border border-[#18181B0F] shadow-[0px_1px_0.5px_0.05px_#18181B0A] rounded w-[27px] h-[27px] flex items-center justify-center hover:bg-gray-50",
    button_next:
      "border border-[#18181B0F] shadow-[0px_1px_0.5px_0.05px_#18181B0A] rounded w-[27px] h-[27px] flex items-center justify-center hover:bg-gray-50",
    nav: "flex w-full absolute top-0 right-0 flex items-center justify-between h-[var(--rdp-nav-height)] px-2",
    table: "border-separate",
    head_row: "flex",
    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
    row: "flex mt-2",
    cell: "p-0 text-center text-sm w-8 h-8 flex items-center justify-center",
    day: "h-6 w-6 p-0 rounded-md hover:bg-gray-100 cursor-pointer text-calendar mt-1",
    day_today: "bg-blue-500 text-white font-normal hover:bg-blue-600",
    day_selected: "bg-blue-600 text-calendar text-white",
    day_range_start: "text-white text-calendar",
    day_range_end: "text-white text-calendar",
    day_range_middle: "bg-[#18181B14] text-calendar",
  };

  return (
    <div className="flex flex-col md:flex-row gap-[14px]">
      <DayPicker
        locale={pl}
        style={
          {
            "--rdp-day_button-height": "34px",
            "--rdp-day_button-width": "34px",
            "--rdp-day_button-border-radius": "6px",
            "--rdp-day_button-padding": "6px 8px 6px 8px",
            "--rdp-range_middle-background-color": "var(--fill-secondary,#18181B14)",
            "--rdp-range_start-date-background-color": "#003DD9",
            "--rdp-range_end-date-background-color": "#003DD9",
          } as React.CSSProperties
        }
        mode="range"
        selected={selectedRange}
        onSelect={handleDateSelect}
        month={firstCalendarMonth}
        onMonthChange={setFirstCalendarMonth}
        classNames={calendarClassNames}
        numberOfMonths={1}
        disabled={{ before: new Date() }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === "left" ? <ChevronLeft /> : <ChevronRight />,
        }}
      />

      <DayPicker
        locale={pl}
        mode="range"
        style={
          {
            "--rdp-day_button-height": "34px",
            "--rdp-day_button-width": "34px",
            "--rdp-day_button-border-radius": "6px",
            "--rdp-day_button-padding": "6px 8px 6px 8px",
            "--rdp-day_button-background-color": "var(--accent-active,#003DD9)",
            "--rdp-day_button-color": "#ffffff",
            "--rdp-day_button-font-weight": "400",
            "--rdp-range_start-background-color": "var(--accent-active,#003DD9)",
            "--rdp-range_start-color": "#ffffff",
            "--rdp-range_start-font-weight": "400",
            "--rdp-range_end-background-color": "var(--accent-active,#003DD9)",
            "--rdp-range_end-color": "#ffffff",
            "--rdp-range_end-font-weight": "400",
            "--rdp-range_middle-background-color": "var(--fill-secondary,#18181B14)",
            "--rdp-range_middle-font-weight": "400",
          } as React.CSSProperties
        }
        selected={selectedRange}
        onSelect={handleDateSelect}
        month={secondCalendarMonth}
        onMonthChange={setSecondCalendarMonth}
        classNames={calendarClassNames}
        numberOfMonths={1}
        disabled={{ before: new Date() }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === "left" ? <ChevronLeft /> : <ChevronRight />,
        }}
      />
    </div>
  );
}
