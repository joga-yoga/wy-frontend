"use client";

import { useLayoutEffect, useRef } from "react";

/** Keep transient feedback above visible bottom navigation and pinned actions. */
export function useToastPosition(active: boolean) {
  const viewportRef = useRef<HTMLOListElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!active || !viewport) return;

    const anchors = new Set<HTMLElement>();
    let frame = 0;

    function position() {
      frame = 0;
      if (!viewport) return;

      const present = new Set(document.querySelectorAll<HTMLElement>("[data-toast-anchor]"));
      for (const anchor of anchors) {
        if (!present.has(anchor)) {
          resizeObserver.unobserve(anchor);
          anchors.delete(anchor);
        }
      }
      for (const anchor of present) {
        if (!anchors.has(anchor)) {
          anchors.add(anchor);
          resizeObserver.observe(anchor);
        }
      }

      const visual = window.visualViewport;
      const visibleTop = visual?.offsetTop ?? 0;
      const visibleBottom = visibleTop + (visual?.height ?? window.innerHeight);
      const bounds = viewport.getBoundingClientRect();
      let obstructionTop = visibleBottom;
      let anchored = false;

      for (const anchor of anchors) {
        const rect = anchor.getBoundingClientRect();
        const style = window.getComputedStyle(anchor);
        if (
          rect.width === 0 ||
          rect.height === 0 ||
          rect.bottom <= visibleTop ||
          rect.top >= visibleBottom ||
          rect.right <= bounds.left ||
          rect.left >= bounds.right ||
          style.visibility === "hidden" ||
          style.opacity === "0"
        )
          continue;

        const stickyAtBottom =
          style.position === "sticky" &&
          style.bottom !== "auto" &&
          Math.abs(rect.bottom - (visibleBottom - parseFloat(style.bottom))) <= 1;
        if (style.position !== "fixed" && !stickyAtBottom) continue;

        obstructionTop = Math.min(obstructionTop, rect.top);
        anchored = true;
      }

      const offset = Math.max(0, window.innerHeight - obstructionTop) + 16;
      viewport.style.bottom = anchored
        ? `${offset}px`
        : `calc(${offset}px + env(safe-area-inset-bottom, 0px))`;
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(position);
    }

    const resizeObserver = new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    document.addEventListener("animationend", schedule, true);
    document.addEventListener("transitionend", schedule, true);
    position();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      document.removeEventListener("animationend", schedule, true);
      document.removeEventListener("transitionend", schedule, true);
    };
  }, [active]);

  return viewportRef;
}
