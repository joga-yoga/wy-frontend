import { Camera, DollarSign, FileText, ListTodo, MapPin, Users } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useIsMobile from "@/hooks/useIsMobile";
import { scrollTo } from "@/lib/scrollTo";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  isLoading: boolean;
}

const menuItems = [
  { id: "event-details-section", icon: FileText, label: "Podstawowe informacje" },
  { id: "event-instructors-section", icon: Users, label: "Instruktorzy" },
  { id: "event-program-section", icon: ListTodo, label: "Program wyjazdu" },
  { id: "event-location-section", icon: MapPin, label: "Lokalizacja" },
  { id: "event-pricing-section", icon: DollarSign, label: "Cennik" },
  { id: "event-photos-section", icon: Camera, label: "Zdjęcia" },
];

export function EventDashboardSidebar({ className, isLoading }: SidebarProps) {
  const [activeId, setActiveId] = useState<string>(menuItems[0].id);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  useEffect(() => {
    if (visibleSections.size > 0) {
      const lastVisibleMenuItem = [...menuItems]
        .reverse()
        .find((item) => visibleSections.has(item.id));
      if (lastVisibleMenuItem) {
        setActiveId(lastVisibleMenuItem.id);
      }
    } else if (window.scrollY === 0) {
      setActiveId(menuItems[0].id);
    }
  }, [visibleSections]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleSections((prev) => {
          const newVisibleSections = new Set(prev);
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              newVisibleSections.add(entry.target.id);
            } else {
              newVisibleSections.delete(entry.target.id);
            }
          });
          return newVisibleSections;
        });
      },
      {
        rootMargin: `-${65 + 20}px 0px 0px 0px`,
        threshold: 0.2,
      },
    );

    const elements = menuItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      return;
    }

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [isLoading]);

  return (
    <aside
      className={cn(
        "sticky border-b md:border-b-0 md:border-r bg-background z-20",
        "md:flex flex-col items-center md:h-[calc(100vh-65px)] py-2 md:py-4 md:px-2 md:w-[84px]",
        "top-0 md:top-[65px] w-full",
        className,
      )}
    >
      <nav className="flex flex-row md:flex-col gap-2 w-full px-2 items-center justify-between md:justify-start">
        <TooltipProvider>
          {menuItems.map((item, index) => (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={item.label}
                  className={cn(
                    "h-12 w-12 md:h-[48px] md:w-[48px] text-gray-800 hover:bg-muted hover:text-black",
                    "border-2 border-transparent transition-colors duration-200 ease-in-out",
                    activeId === item.id && "border-brand-green",
                  )}
                  onClick={() => {
                    setActiveId(item.id);
                    scrollTo(item.id, 65 + (isMobile ? 16 : 20));
                  }}
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
