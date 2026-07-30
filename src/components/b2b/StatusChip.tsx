import { cn } from "@/lib/utils";

/**
 * The flat colored chip from the B2B list doctrine (reception-desk §1, extended
 * system-wide): state is a chip, never a button. Amber = money/verification
 * pending, green = done/connected, gray = neutral, rose = cancelled/void.
 * Shared by Instruktorzy (T10), Klienci (T11), Rezerwacje (T12) and Recepcja (T14).
 *
 * Tones draw from the `--b2b-*` tokens in globals.css, sampled from the prototypes —
 * never Tailwind's default tints, which are lighter and cooler than the design.
 * The tone names are a stable API: many screens pass them, so add tones rather than
 * renaming these four.
 */
const TONE_CLASSES = {
  amber: "border-b2b-amber-border bg-b2b-amber-bg text-b2b-amber-text",
  green: "border-b2b-green-border bg-b2b-green-bg text-b2b-green-text",
  gray: "border-gray-200 bg-gray-100 text-gray-600",
  rose: "border-b2b-red-border bg-b2b-red-bg text-b2b-red-text",
} as const;

export type ChipTone = keyof typeof TONE_CLASSES;

export function StatusChip({
  children,
  tone,
  className,
}: {
  children: React.ReactNode;
  tone: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
