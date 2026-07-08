"use client";

import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

import {
  type DayInfo,
  getCircleBackgroundClass,
  getNumberColorClass,
  getNumberWeightClass,
} from "./dayStripUtils";

interface DayNumberCircleProps {
  day: DayInfo;
  isSelected: boolean;
  onClick: () => void;
}

export function DayNumberCircle({ day, isSelected, onClick }: DayNumberCircleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[40px] flex-col items-center gap-1 px-1.5 py-1"
    >
      <span
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full text-lg leading-none transition-colors duration-150",
          day.isToday && "shadow-[inset_0_0_0_2px_var(--brand-green-700)]",
          getNumberColorClass(day, isSelected),
          getNumberWeightClass(day, isSelected),
        )}
      >
        <AnimatePresence initial={false}>
          {isSelected && (
            <motion.span
              className={cn("absolute inset-0 rounded-full", getCircleBackgroundClass(day))}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
        <span className="relative z-10 leading-none">{day.dayNumber}</span>
      </span>
    </button>
  );
}
