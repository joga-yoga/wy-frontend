"use client";

import { useRef } from "react";

const MIN_DISTANCE = 50;
/** Below this ratio the gesture is treated as a vertical scroll and ignored. */
const HORIZONTAL_DOMINANCE = 1.2;

/**
 * Horizontal swipe on a scrollable region, for Grafik's day content.
 *
 * Deliberately gesture-only and stateless — no transform, no drag preview. The day strip
 * above already owns the animated week track (`NumbersTrack`, motion-based); adding a second
 * animated surface underneath it would mean two things claiming the same drag. This just
 * reports direction once the gesture is unambiguously horizontal, so a vertical scroll
 * through a long day never accidentally changes the day.
 */
export function useHorizontalSwipe(onSwipe: (direction: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart(event: React.TouchEvent) {
      const touch = event.touches[0];
      start.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    },
    onTouchEnd(event: React.TouchEvent) {
      const origin = start.current;
      start.current = null;
      const touch = event.changedTouches[0];
      if (!origin || !touch) return;

      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      if (Math.abs(dx) < MIN_DISTANCE) return;
      if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE) return;

      // Swiping left (negative dx) moves forward, matching the day strip's direction.
      onSwipe(dx < 0 ? 1 : -1);
    },
  };
}
