import { Camera, DollarSign, FileText, ListTodo, MapPin, Users } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { scrollTo } from "@/lib/scrollTo";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

const menuItems = [
  { id: "event-details-section", icon: FileText, label: "Podstawowe informacje" },
  { id: "event-instructors-section", icon: Users, label: "Instruktorzy" },
  { id: "event-program-section", icon: ListTodo, label: "Program wyjazdu" },
  { id: "event-location-section", icon: MapPin, label: "Lokalizacja" },
  { id: "event-pricing-section", icon: DollarSign, label: "Cennik" },
  { id: "event-photos-section", icon: Camera, label: "Zdjęcia" },
];

export function EventSidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col items-center sticky top-[65px] h-[calc(100vh-65px)] border-r bg-background  pt-4 pb-4 px-2 w-[84px]",
        className,
      )}
    >
      <nav className="flex flex-col gap-2 w-full px-2 items-center">
        <TooltipProvider>
          {menuItems.map((item, index) => (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={item.label}
                  className="h-[48px] w-[48px] text-gray-800 hover:bg-muted hover:text-black"
                  onClick={() => scrollTo(item.id, 65 + 20)}
                >
                  <item.icon className="size-10" strokeWidth={1} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </aside>
  );
}
