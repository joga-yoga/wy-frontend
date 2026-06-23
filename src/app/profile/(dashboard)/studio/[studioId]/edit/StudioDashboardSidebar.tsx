"use client";

import { Camera, Dumbbell, Home, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useIsMobile from "@/hooks/useIsMobile";
import { scrollTo } from "@/lib/scrollTo";
import { cn } from "@/lib/utils";

export const studioNavItems = [
  { id: "studio-basics-section", icon: Home, label: "Podstawy" },
  { id: "studio-location-section", icon: MapPin, label: "Lokalizacja" },
  { id: "studio-instructors-section", icon: Users, label: "Instruktorzy" },
  { id: "studio-oferta-section", icon: Dumbbell, label: "Oferta" },
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
      <nav className="flex flex-row md:flex-col gap-2 w-full px-2 items-center justify-between md:justify-start">
        <TooltipProvider>
          {studioNavItems.map((item) => (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={item.label}
                  className={cn(
                    "h-12 w-12 text-gray-800 hover:bg-muted hover:text-black",
                    "border-2 border-transparent transition-colors duration-200",
                    activeId === item.id && "border-brand-green",
                  )}
                  onClick={() =>
                    scrollTo(item.id, headerHeight + (isMobile ? 56 : SECTION_SCROLL_GAP))
                  }
                >
                  <item.icon className="h-8 w-8 md:size-10" strokeWidth={1} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "bottom" : "right"}>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </aside>
  );
}
