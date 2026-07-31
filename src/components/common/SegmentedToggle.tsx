"use client";

import { cn } from "@/lib/utils";

export interface SegmentedToggleOption<T> {
  label: string;
  value: T;
}

interface SegmentedToggleProps<T> {
  options: SegmentedToggleOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  columns?: number;
  className?: string;
  disabled?: boolean;
}

const GRID_COLS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function SegmentedToggle<T>({
  options,
  value,
  onChange,
  columns,
  className,
  disabled = false,
}: SegmentedToggleProps<T>) {
  const cols = columns ?? options.length;

  return (
    <div className={cn("grid gap-2 mb-2", GRID_COLS_CLASS[cols] ?? "grid-cols-2", className)}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            className={cn(
              // Design HTML `.seg .sg`: 1.5px border, 12px radius, 700 weight. The
              // selected state is `--brand` (#4F8A62 == brand-green-700) plus a 1px ring
              // of the same, on a barely-tinted white. It was `--brand-green`, the
              // *bright* brand green, which reads as a highlighter next to the muted
              // palette the rest of the panel uses.
              "min-h-11 rounded-xl border-[1.5px] px-3 text-sm font-bold transition-colors",
              isSelected
                ? "border-b2b-green-text bg-[#FBFDFC] text-b2b-green-strong ring-1 ring-b2b-green-text"
                : "border-border text-muted-foreground hover:bg-gray-50",
              disabled && "cursor-not-allowed opacity-60",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
