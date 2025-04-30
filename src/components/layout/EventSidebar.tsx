import {
  BedDouble,
  CalendarDays,
  FolderPlus,
  Image,
  ImagePlus,
  Link2,
  List,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

const menuItems = [
  { href: "#", icon: Link2, label: "Links" },
  { href: "#", icon: MessageSquare, label: "Messages" },
  { href: "#", icon: List, label: "Details" },
  { href: "#", icon: BedDouble, label: "Accommodation" },
  { href: "#", icon: ImagePlus, label: "Add Image" },
  { href: "#", icon: CalendarDays, label: "Calendar" },
  { href: "#", icon: FolderPlus, label: "Add Folder" },
  { href: "#", icon: Image, label: "Gallery" },
];

export function EventSidebar({ className }: SidebarProps) {
  // TODO: Add active state based on current route
  return (
    <aside
      className={cn(
        "sticky top-0 h-screen border-r bg-background flex flex-col items-center pt-4 pb-4 px-2",
        className,
      )}
    >
      <nav className="flex flex-col gap-2 w-full px-2 items-center">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href} passHref legacyBehavior>
            <Button
              variant="ghost"
              size="icon"
              aria-label={item.label}
              className="h-10 w-10 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
