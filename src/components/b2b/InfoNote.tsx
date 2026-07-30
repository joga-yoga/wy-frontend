import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The bordered explanatory card with a leading (i) that the prototypes put at the foot of
 * a list or the head of a form (R2, R4, K1, V2, V3).
 *
 * Each of those screens previously hand-rolled a bare `<p className="text-xs text-gray-400">`,
 * which reads as a caption rather than as something the user is meant to act on. The
 * bordered card is what the mockups draw, and one component is what keeps the four of them
 * looking like the same idea.
 */
export function InfoNote({
  children,
  tone = "default",
  icon,
  className,
}: {
  children: React.ReactNode;
  /** `amber` for a state the user may need to resolve; `default` for reassurance. */
  tone?: "default" | "amber";
  /** Overrides the (i) — R4 leads with a mail icon because the note is about an email. */
  icon?: React.ReactNode;
  className?: string;
}) {
  const isAmber = tone === "amber";
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3",
        isAmber
          ? "border-b2b-amber-border bg-b2b-amber-bg text-b2b-amber-text"
          : "border-gray-200 bg-gray-50 text-gray-600",
        className,
      )}
    >
      <span className={cn("mt-0.5 shrink-0", isAmber ? "text-b2b-amber-text" : "text-gray-400")}>
        {icon ?? <Info size={15} />}
      </span>
      <div className="min-w-0 flex-1 text-xs leading-relaxed">{children}</div>
    </div>
  );
}
