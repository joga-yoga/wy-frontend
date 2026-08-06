"use client";

import { Camera, DollarSign, Home, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import useIsMobile from "@/hooks/useIsMobile";
import { scrollTo } from "@/lib/scrollTo";
import { cn } from "@/lib/utils";

// Exactly the 4 sections spec-b2b §8 names — Instruktorzy moved to the roster
// (T10), Płatności/Anulowanie moved to their own workspace screen (see
// `studio/[studioId]/payments/page.tsx`), not part of the public profile editor.
export const studioNavItems = [
  { id: "studio-basics-section", icon: Home, label: "Podstawy" },
  { id: "studio-location-section", icon: MapPin, label: "Lokalizacja" },
  { id: "studio-oferta-section", icon: DollarSign, label: "Oferta" },
  { id: "studio-photos-section", icon: Camera, label: "Zdjęcia" },
];

const MOBILE_HEADER_HEIGHT = 64;
const DESKTOP_HEADER_HEIGHT = 80;
const SECTION_SCROLL_GAP = 20;

interface StudioDashboardSidebarProps {
  isLoading: boolean;
}

export function StudioDashboardSidebar({ isLoading }: StudioDashboardSidebarProps) {
  const [activeId, setActiveId] = useState(studioNavItems[0].id);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();
  const headerHeight = isMobile ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT;

  useEffect(() => {
    if (visibleSections.size > 0) {
      const last = [...studioNavItems].reverse().find((item) => visibleSections.has(item.id));
      if (last) setActiveId(last.id);
    } else if (window.scrollY === 0) {
      setActiveId(studioNavItems[0].id);
    }
  }, [visibleSections]);

  useEffect(() => {
    if (isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleSections((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            if (entry.isIntersecting) next.add(entry.target.id);
            else next.delete(entry.target.id);
          });
          return next;
        });
      },
      {
        rootMargin: `-${headerHeight + SECTION_SCROLL_GAP}px 0px 0px 0px`,
        threshold: 0.2,
      },
    );

    const elements = studioNavItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, [headerHeight, isLoading]);

  return (
    <aside
      className={cn(
        "sticky border-b md:border-b-0 md:border-r bg-background z-20",
        "md:flex flex-col items-center md:h-[calc(100dvh-80px)] py-2 md:py-4 md:px-2 md:w-[84px]",
        "top-16 md:top-20 w-full",
      )}
    >
      {/* V1 draws icon *and* label, with the active one on a green tile. The label is
          what makes this readable at a glance on mobile, where the tooltip that used to
          carry it never fires — a touch device has no hover. */}
      <nav className="flex w-full flex-row items-start justify-around gap-1 px-2 md:flex-col md:justify-start md:gap-2">
        {studioNavItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-current={isActive ? "true" : undefined}
              onClick={() => scrollTo(item.id, headerHeight + (isMobile ? 56 : SECTION_SCROLL_GAP))}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1 md:flex-none"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200",
                  isActive
                    ? "bg-b2b-green-bg text-b2b-green-text"
                    : "text-gray-500 hover:bg-muted hover:text-gray-900",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[11px] leading-none",
                  isActive ? "font-semibold text-b2b-green-text" : "text-gray-500",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
