"use client";

import { cn } from "@/lib/utils";

interface ScopeOptionCardProps {
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
  variant?: "default" | "danger";
}

/**
 * A scope choice in the Zakres step (mockup S2): a real radio control, green when selected.
 *
 * Previously it had no radio at all and marked selection with a gray-900 border, which reads as
 * "focused" rather than "chosen" — on a step whose entire job is making the scope of a costly
 * change unmistakable.
 */
export function ScopeOptionCard({
  title,
  subtitle,
  selected,
  onSelect,
  variant = "default",
}: ScopeOptionCardProps) {
  const isDanger = variant === "danger";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors",
        selected
          ? isDanger
            ? "border-b2b-red-solid ring-1 ring-b2b-red-solid"
            : "border-b2b-green-text ring-1 ring-b2b-green-text"
          : "border-gray-200",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          selected
            ? isDanger
              ? "border-b2b-red-solid"
              : "border-b2b-green-text"
            : "border-gray-300",
        )}
      >
        {selected && (
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              isDanger ? "bg-b2b-red-solid" : "bg-b2b-green-text",
            )}
          />
        )}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block text-sm font-semibold",
            isDanger && selected ? "text-b2b-red-text" : "text-gray-900",
          )}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-gray-500">{subtitle}</span>
      </span>
    </button>
  );
}
