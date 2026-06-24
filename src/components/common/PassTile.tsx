import { IoInfinite as InfiniteIcon } from "react-icons/io5";

import { cn } from "@/lib/utils";

interface PassTileProps {
  sessionCount?: number | null;
  durationDays?: number | null;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "h-12 w-12 rounded-md",
  md: "h-24 w-24 rounded-lg",
} as const;

const mainTextClasses = {
  sm: "text-lg",
  md: "text-4xl",
} as const;

const mainIconClasses = {
  sm: "size-5",
  md: "size-10",
} as const;

const subtitleTextClasses = {
  sm: "text-[9px]",
  md: "text-xs",
} as const;

const subtitleIconClasses = {
  sm: "size-3",
  md: "size-4",
} as const;

export function PassTile({ sessionCount, durationDays, size = "md" }: PassTileProps) {
  const isUnlimitedSessions = sessionCount == null;
  const isUnlimitedDays = durationDays == null;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center bg-gray-950 text-white",
        sizeClasses[size],
      )}
    >
      {isUnlimitedSessions ? (
        <InfiniteIcon className={mainIconClasses[size]} />
      ) : (
        <span className={cn("font-semibold leading-none", mainTextClasses[size])}>
          {sessionCount}
        </span>
      )}
      <span className="mt-0.5 flex items-center font-medium text-white/70">
        {isUnlimitedDays ? (
          <InfiniteIcon className={subtitleIconClasses[size]} />
        ) : (
          <span className={subtitleTextClasses[size]}>{durationDays} dni</span>
        )}
      </span>
    </div>
  );
}
