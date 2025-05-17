import React from "react";

import CustomAnalyticsIcon from "@/components/icons/CustomAnalyticsIcon";
import CustomChatIcon from "@/components/icons/CustomChatIcon";
import CustomDocumentIcon from "@/components/icons/CustomDocumentIcon";
import CustomFormsIcon from "@/components/icons/CustomFormsIcon";
import CustomIncludedIcon from "@/components/icons/CustomIncludedIcon";
import CustomLinkIcon from "@/components/icons/CustomLinkIcon";
import CustomListIcon from "@/components/icons/CustomListIcon";
import CustomRouteIcon from "@/components/icons/CustomRouteIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

// Define the desired offset (adjust this value as needed)
const SCROLL_OFFSET = 148; // e.g., 65px header + 15px padding

const menuItems = [
  { href: "#event-details", icon: CustomDocumentIcon, label: "Basic Info & Details" },
  { href: "#event-pricing", icon: CustomIncludedIcon, label: "Pricing" },
  { href: "#event-location-dates", icon: CustomRouteIcon, label: "Location & Dates" },
  { href: "#event-hospitality", icon: CustomLinkIcon, label: "Hospitality" },
  { href: "#event-activities", icon: CustomListIcon, label: "Activities & Itinerary" },
  { href: "#event-program", icon: CustomListIcon, label: "Daily Program" },
  { href: "#event-instructors", icon: CustomChatIcon, label: "Instructors" },
  { href: "#event-policies", icon: CustomDocumentIcon, label: "Policies & Info" },
  { href: "#event-images-section", icon: CustomAnalyticsIcon, label: "Images" },
  { href: "#event-visibility", icon: CustomLinkIcon, label: "Visibility" },
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
        "sticky top-[65px] h-[calc(100vh-65px)] border-r bg-background flex flex-col items-center pt-4 pb-4 px-2 w-[84px]",
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
            className="h-[48px] w-[48px] text-gray-800 hover:bg-muted hover:text-black"
            onClick={() => handleScrollToSection(item.href)}
          >
            <item.icon className="size-10" />
          </Button>
        ))}
      </nav>
    </aside>
  );
}
