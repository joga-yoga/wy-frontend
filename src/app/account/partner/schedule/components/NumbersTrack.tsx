"use client";

import {
  animate,
  type AnimationPlaybackControls,
  motion,
  type PanInfo,
  useMotionValue,
} from "motion/react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { DayNumberCircle } from "./DayNumberCircle";
import {
  addDays,
  buildWeekDays,
  type DayInfo,
  shouldCommitSwipe,
  toDateStr,
} from "./dayStripUtils";

export interface DayStripHandle {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
}

interface NumbersTrackProps {
  weekStart: Date;
  sessionCounts: number[];
  selectedIndex: number;
  isLoading: boolean;
  onSelectDay: (index: number) => void;
  onShiftWeek: (deltaDays: number) => void;
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 42 };

export const NumbersTrack = forwardRef<DayStripHandle, NumbersTrackProps>(function NumbersTrack(
  { weekStart, sessionCounts, selectedIndex, isLoading, onSelectDay, onShiftWeek },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const isAnimating = useRef(false);
  const settleAnimation = useRef<AnimationPlaybackControls | null>(null);

  // A drag or an external week change can interrupt an in-flight commit animation, in which
  // case its onComplete (the only place that flips isAnimating back) never fires. Every
  // interruption path must go through this reset, or commit() dead-locks and the track is
  // left un-snapped.
  function resetSettleState() {
    settleAnimation.current?.stop();
    settleAnimation.current = null;
    isAnimating.current = false;
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keeps the "current" panel centered in the viewport (rest position is -width, since the
  // track renders [prev, current, next] and the current panel must sit in the visible slot).
  // Runs before paint (not a plain effect) so that whenever `weekStart` changes — whether
  // from our own committed swipe/chevron-tap or an external jump like "Dzis" — the transform
  // snaps back to rest in the same frame the new week's numbers render, instead of one frame
  // later where the stale transform would briefly show the wrong panel.
  useLayoutEffect(() => {
    resetSettleState();
    x.set(-width);
  }, [weekStart, width, x]);

  function commit(direction: 1 | -1) {
    if (isAnimating.current || width === 0) return;
    isAnimating.current = true;
    const target = -width - direction * width;
    settleAnimation.current = animate(x, target, {
      ...SPRING,
      onComplete: () => {
        onShiftWeek(direction * 7);
        isAnimating.current = false;
      },
    });
  }

  function cancel() {
    animate(x, -width, SPRING);
  }

  useImperativeHandle(ref, () => ({
    goToPreviousWeek: () => commit(-1),
    goToNextWeek: () => commit(1),
  }));

  const todayStr = toDateStr(new Date());
  const currentDays = buildWeekDays(weekStart, sessionCounts, todayStr, !isLoading);
  const prevDays = buildWeekDays(addDays(weekStart, -7), [], todayStr, false);
  const nextDays = buildWeekDays(addDays(weekStart, 7), [], todayStr, false);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <motion.div
        className="flex"
        style={{ x, width: "300%" }}
        drag={width > 0 ? "x" : false}
        dragConstraints={{ left: -2 * width, right: 0 }}
        dragElastic={0.15}
        onDragStart={resetSettleState}
        onDragEnd={(_event, info: PanInfo) => {
          // Displacement from the rest position, not info.offset.x: a drag that starts
          // mid-animation begins away from rest, so the gesture's own offset says nothing
          // about which panel the track is actually closest to.
          const delta = x.get() + width;
          if (shouldCommitSwipe(delta, info.velocity.x, width)) {
            commit(delta < 0 ? 1 : -1);
          } else {
            cancel();
          }
        }}
      >
        <WeekPanel days={prevDays} width={width} selectedIndex={-1} onSelectDay={() => {}} />
        <WeekPanel
          days={currentDays}
          width={width}
          selectedIndex={selectedIndex}
          onSelectDay={onSelectDay}
        />
        <WeekPanel days={nextDays} width={width} selectedIndex={-1} onSelectDay={() => {}} />
      </motion.div>
    </div>
  );
});

function WeekPanel({
  days,
  width,
  selectedIndex,
  onSelectDay,
}: {
  days: DayInfo[];
  width: number;
  selectedIndex: number;
  onSelectDay: (index: number) => void;
}) {
  return (
    <div className="flex shrink-0 justify-between gap-1" style={{ width: width || "33.3333%" }}>
      {days.map((day, i) => (
        <DayNumberCircle
          key={day.date}
          day={day}
          isSelected={i === selectedIndex}
          onClick={() => onSelectDay(i)}
        />
      ))}
    </div>
  );
}
