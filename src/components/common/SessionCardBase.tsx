"use client";

import type { ReactNode } from "react";
import { IoChevronForward } from "react-icons/io5";

import {
  type ClassColor,
  COLOR_BORDER_MAP,
  COLOR_SWATCH_MAP,
  DEFAULT_BAR,
  DEFAULT_BORDER,
} from "@/lib/classColors";
import { cn } from "@/lib/utils";

/**
 * The geometry every "one session" card on this platform is drawn with.
 *
 * A separated, rounded card carrying the class colour on its own 1.5px border, a wide centred
 * time column, a `w-1` colour bar, and a gray-500 chevron. It exists in exactly one place
 * because it previously existed in three, and they drifted: `GrafikSessionCard` was rebuilt on
 * the public `SessionCard`'s geometry so a partner would see the same object drawn the same
 * way as their customers, and the B2C reservation list — which claimed in its own docstring to
 * match "Grafik's session rows" — was left behind as a flat row inside a shared bordered
 * container. That is WY-73's "cards looks like shit".
 *
 * **What belongs here:** the frame, the time column, the colour bar, the chevron, the dimming
 * and strike-through rules. **What does not:** anything a single surface knows about. Grafik's
 * `9/12` fill badge, the public card's "Masz rezerwację" footer and the B2C funding chip are
 * all passed in — three surfaces answering different questions about the same object.
 *
 * A finished or cancelled session keeps its slot but drops its colour, so it reads as settled
 * rather than as another live class. Callers express that by passing `dimmed` and letting
 * `color` fall through as usual — the colour is suppressed here, not at each call site. Where
 * the two must disagree (a *full* session is dimmed but stays coloured), `colored` overrides.
 */
export function SessionCardBase({
  color,
  dimmed = false,
  colored,
  struck = false,
  onClick,
  hoverable = false,
  timeAbove,
  time,
  timeSub,
  children,
  trailing,
  showChevron = true,
  footer,
  bodyAlign = "top",
  timeColClassName,
  timeSubClassName,
}: {
  color?: ClassColor | string | null;
  /** Fades the whole card. */
  dimmed?: boolean;
  /**
   * Whether to draw the class colour. Defaults to `!dimmed`, which is the usual rule.
   *
   * ⚠ It is an override rather than a derivation because the public card needs the two to
   * disagree: a **full** session is dimmed *and* keeps its colour, while past and cancelled
   * ones are dimmed and lose it. Folding colour into `dimmed` silently greyed out every full
   * session.
   */
  colored?: boolean;
  /** Cancelled: strikes the time and lets the caller strike the title to match. */
  struck?: boolean;
  onClick?: () => void;
  /** Grafik tints on hover; the public card does not. */
  hoverable?: boolean;
  /** The struck-through previous time, when a session was moved. */
  timeAbove?: ReactNode;
  time: ReactNode;
  timeSub?: ReactNode;
  children: ReactNode;
  /** Between the body and the chevron — Grafik's fill badge, and nothing else so far. */
  trailing?: ReactNode;
  showChevron?: boolean;
  /** Full-bleed strip under the row. Deliberately outside the interactive area. */
  footer?: ReactNode;
  bodyAlign?: "top" | "center";
  /**
   * Overrides the time column's width. The two schedule cards put a duration under the time
   * ("75 min") and `w-14` is generous for it; the B2C reservation card puts a *date* there
   * ("czw., 27 sie"), which wraps to two ragged lines at that width.
   */
  timeColClassName?: string;
  /** Same reason: a date needs a smaller type size than a duration to fit on one line. */
  timeSubClassName?: string;
}) {
  const swatch = color as ClassColor | undefined;
  const showColor = (colored ?? !dimmed) && swatch && swatch in COLOR_BORDER_MAP;
  const borderClass = showColor ? COLOR_BORDER_MAP[swatch] : DEFAULT_BORDER;
  const barClass = showColor ? COLOR_SWATCH_MAP[swatch] : DEFAULT_BAR;
  const isInteractive = Boolean(onClick);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border-[1.5px] bg-white transition-colors",
        borderClass,
        dimmed && "opacity-60",
      )}
    >
      <div
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onClick?.();
              }
            : undefined
        }
        className={cn(
          "flex items-stretch gap-3 px-3 py-2.5",
          isInteractive && "cursor-pointer",
          isInteractive && hoverable && "hover:bg-gray-50",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 flex-col items-center justify-center gap-0.5 text-center",
            timeColClassName ?? "w-14",
          )}
        >
          {timeAbove}
          <span
            className={cn(
              "text-xl font-semibold",
              dimmed ? "text-gray-400" : "text-gray-900",
              struck && "line-through",
            )}
          >
            {time}
          </span>
          {timeSub && (
            <span className={cn("text-gray-400", timeSubClassName ?? "text-sm")}>{timeSub}</span>
          )}
        </div>

        <div className={cn("w-1 shrink-0 self-stretch rounded-full", barClass)} />

        <div className={cn("min-w-0 flex-1 py-0.5", bodyAlign === "center" && "self-center")}>
          {children}
        </div>

        {trailing}

        {showChevron && (
          <div className="flex shrink-0 items-center text-gray-500">
            <IoChevronForward className="h-5 w-5" />
          </div>
        )}
      </div>

      {footer}
    </div>
  );
}
