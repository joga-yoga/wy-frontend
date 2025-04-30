"use client";

import { Calendar, LayoutDashboard, List, LogOut, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// Reusable NavButton component adapted for Tailwind and Lucide
const NavButton = ({
  children,
  isActive,
  href,
  icon: Icon, // Renamed prop to avoid conflict with React component naming convention
}: {
  children: React.ReactNode;
  isActive?: boolean;
  href: string;
  icon?: React.ElementType; // Use ElementType for Lucide icons
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium",
        isActive
          ? "bg-gray-200 text-gray-900"
          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900",
      )}
    >
      {Icon && <Icon className="h-[18px] w-[18px]" />}
      {children}
    </Link>
  );
};

// Main Sidebar component adapted from NavBase
export const Sidebar = ({ className }: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname(); // Use usePathname for simpler comparison
  const { user, signOut } = useAuth();
  const router = useRouter();

  const tabs = useMemo(() => {
    // Determine active state based on the current pathname starting with the href
    const isActive = (href: string) =>
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

    return [
      {
        name: "Dashboard",
        href: "/dashboard",
        isActive: isActive("/dashboard") && pathname.split("/").filter(Boolean).length === 1, // Only active if exactly /dashboard
        icon: LayoutDashboard,
      },
      {
        name: "Organizer Profile",
        href: "/dashboard/organizer",
        isActive: isActive("/dashboard/organizer"),
        icon: User,
      },
      {
        name: "Events",
        href: "/dashboard/events",
        isActive: isActive("/dashboard/events"),
        icon: Calendar,
      },
      {
        name: "Instructors",
        href: "/dashboard/instructors",
        isActive: isActive("/dashboard/instructors"),
        icon: Users,
      },
      // Add other primary navigation items here if needed
    ];
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    // Redirect is handled within signOut context function now
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col justify-between border-r border-gray-200 bg-gray-100 p-4 pb-2",
        className,
      )}
    >
      <div className="flex w-full flex-col items-start gap-1">
        {/* Replaced SVG Logo with Icon Button */}
        <Link href="/" className="mb-4 flex items-center justify-center w-[40px] h-[40px]">
          <svg
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <circle cx="25" cy="25" r="25" fill="#313C42" />
            <path
              d="M20.4763 13.9364C20.9611 14.5 21.9834 16.4697 22.8341 18.3999C24.487 22.1878 25.1433 23.1288 26.1399 23.1288C27.0636 23.1288 27.89 22.1637 28.9838 19.7992C31.1958 15.0221 31.5604 14.2983 32.1681 13.6468C32.873 12.923 33.7237 12.7782 33.9425 13.3573C34.3557 14.3948 32.5327 19.1478 28.7651 26.9891C25.6045 33.7689 23.6119 36.64 22.4209 36.64C21.6493 36.58 21.4679 35.8 22.2264 34.5409C24.3169 30.4393 24.0495 28.0749 20.6708 20.137C18.8687 16.06 18.313 14.0329 18.556 13.3814C18.8234 12.73 19.6256 12.9471 20.4763 13.9364Z"
              fill="#F8FAFC"
            />
            <path
              d="M19.2313 34.9C19.2313 36.0598 18.2841 37 17.1157 37C15.9472 37 15 36.0598 15 34.9C15 33.7402 15.9472 32.8 17.1157 32.8C18.2841 32.8 19.2313 33.7402 19.2313 34.9Z"
              fill="#F8FAFC"
            />
          </svg>
        </Link>

        {/* Navigation Items */}
        {tabs.map(({ href, icon, isActive, name }) => (
          <NavButton key={name} href={href} icon={icon} isActive={isActive}>
            {name}
          </NavButton>
        ))}
      </div>
      {/* Bottom Section: User Info and Logout */}
      <div className="flex flex-col pt-4">
        <div className="flex items-center gap-2 border-t border-gray-300 pt-3">
          <div className="flex flex-col flex-grow min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {user?.name || user?.email || "User"}
            </span>
            {user?.name && user.email && (
              <span className="text-xs text-gray-500 truncate">{user.email}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-gray-600 hover:bg-gray-200"
            aria-label="Log out"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};
