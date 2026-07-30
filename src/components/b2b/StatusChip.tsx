import { cn } from "@/lib/utils";

/**
 * The flat colored chip from the B2B list doctrine (reception-desk §1, extended
 * system-wide): state is a chip, never a button. Amber = money/verification
 * pending, green = done/connected, gray = neutral, rose = cancelled/void.
 * Shared by Instruktorzy (T10), Klienci (T11), Rezerwacje (T12) and Recepcja (T14).
 */
const TONE_CLASSES = {
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  green: "border-emerald-100 bg-emerald-50 text-brand-green-700",
  gray: "border-gray-200 bg-gray-100 text-gray-600",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
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
