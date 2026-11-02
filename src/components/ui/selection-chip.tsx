import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SelectionChipProps = ComponentProps<"button"> & {
  selected: boolean;
  icon?: ReactNode;
};

/** A selectable choice, separate from informational badges and navigation tabs. */
export function SelectionChip({
  selected,
  icon,
  children,
  className,
  ...props
}: SelectionChipProps) {
  return (
    <button
      type="button"
      {...props}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-10 min-w-0 max-w-full items-center justify-center gap-2 rounded-full border-2 px-3 py-2 text-left text-sm font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "border-brand-green-700 bg-brand-green-700/5 text-brand-green-700 enabled:hover:bg-brand-green-700/10"
          : "border-gray-200 bg-white text-gray-600 enabled:hover:border-gray-300 enabled:hover:bg-gray-50",
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="shrink-0 [&>svg]:size-5">
          {icon}
        </span>
      )}
      <span className="min-w-0 break-words">{children}</span>
    </button>
  );
}
