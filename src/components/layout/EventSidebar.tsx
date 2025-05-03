import {
  BedDouble,
  CalendarDays,
  ClipboardList,
  DollarSign,
  Eye,
  FileText,
  Image,
  Info,
  Map,
  Users,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

// Define the desired offset (adjust this value as needed)
const SCROLL_OFFSET = 148; // e.g., 65px header + 15px padding

const menuItems = [
  { href: "#event-details", icon: Info, label: "Basic Info & Details" },
  { href: "#event-pricing", icon: DollarSign, label: "Pricing" },
  { href: "#event-location-dates", icon: CalendarDays, label: "Location & Dates" },
  { href: "#event-hospitality", icon: BedDouble, label: "Hospitality" },
  { href: "#event-activities", icon: Map, label: "Activities & Itinerary" },
  { href: "#event-program", icon: ClipboardList, label: "Daily Program" },
  { href: "#event-instructors", icon: Users, label: "Instructors" },
  { href: "#event-policies", icon: FileText, label: "Policies & Info" },
  { href: "#event-images-section", icon: Image, label: "Images" },
  { href: "#event-visibility", icon: Eye, label: "Visibility" },
];

export function EventSidebar({ className }: SidebarProps) {
  const handleScrollToSection = (targetId: string) => {
    // Remove the '#' prefix
    const id = targetId.substring(1);
    const element = document.getElementById(id);

    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - SCROLL_OFFSET;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <aside
      className={cn(
        "sticky top-[65px] h-[calc(100vh-65px)] border-r bg-background flex flex-col items-center pt-4 pb-4 px-2",
        className,
      )}
    >
      <nav className="flex flex-col gap-2 w-full px-2 items-center">
        {menuItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            aria-label={item.label}
            className="h-10 w-10 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
            onClick={() => handleScrollToSection(item.href)}
          >
            <item.icon className="h-5 w-5" />
          </Button>
        ))}
      </nav>
    </aside>
  );
}
