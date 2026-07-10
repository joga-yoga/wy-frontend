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
              "min-h-10 rounded-lg border text-sm",
              isSelected
                ? "border-brand-green font-semibold text-foreground"
                : "border-border text-muted-foreground",
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
