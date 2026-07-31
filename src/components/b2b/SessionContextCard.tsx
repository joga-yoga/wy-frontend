import { cn } from "@/lib/utils";

/**
 * The "what am I acting on" card that opens every step of every schedule-management flow
 * (S2–S4, S8, S9): a colored left bar, the class title, and a scope line.
 *
 * One component for all of them so the scope a user picked stays visible and identically
 * presented from Zakres through Podgląd to Zapis — the pipeline's whole point is that no
 * change is applied without the user having seen its scope.
 */
export function SessionContextCard({
  title,
  subtitle,
  tone = "default",
}: {
  title: string;
  subtitle?: string | null;
  /** "danger" for the cancellation flow, where the same card frames a destructive action. */
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-b2b border bg-gray-50 px-3 py-3",
        tone === "danger" && "border-b2b-red-border bg-b2b-red-bg",
      )}
    >
      <div
        className={cn(
          "w-[3px] shrink-0 self-stretch rounded-full",
          tone === "danger" ? "bg-b2b-red-solid" : "bg-b2b-green-text",
        )}
      />
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-semibold",
            tone === "danger" ? "text-b2b-red-text" : "text-gray-900",
          )}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className={cn(
              "mt-0.5 text-xs",
              tone === "danger" ? "text-b2b-red-text/80" : "text-gray-500",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
