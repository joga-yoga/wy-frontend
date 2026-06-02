"use client";

import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoHomeOutline, IoPersonOutline } from "react-icons/io5";
import { PiFlowerLotus } from "react-icons/pi";

import { cn } from "@/lib/utils";

const MAIN_TAB_PATHS = ["/profile", "/profile/oferta", "/profile/konto"] as const;

type TabPath = (typeof MAIN_TAB_PATHS)[number];

const tabs: { path: TabPath; label: string; Icon: React.ElementType }[] = [
  { path: "/profile", label: "Aktywność", Icon: IoHomeOutline },
  { path: "/profile/oferta", label: "Oferta", Icon: PiFlowerLotus },
  { path: "/profile/konto", label: "Konto", Icon: IoPersonOutline },
];

export function BottomTabBar() {
  const pathname = usePathname();

  if (!MAIN_TAB_PATHS.includes(pathname as TabPath)) return null;

  return (
    <>
      {/* Mobile: fixed bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pt-2"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] rounded-[28px] flex w-full p-1.5 gap-1">
          <LayoutGroup id="bottom-tab-bar">
            {tabs.map(({ path, label, Icon }) => {
              const isActive = pathname === path;
              return (
                <Link
                  key={path}
                  href={path}
                  className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 rounded-[22px] tap-highlight-transparent"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-pill"
                      className="absolute inset-0 bg-gray-100 rounded-[22px]"
                      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 1 }}
                    />
                  )}
                  <Icon
                    size={22}
                    className={cn("relative z-10", isActive ? "text-gray-900" : "text-gray-400")}
                  />
                  <span
                    className={cn(
                      "relative z-10 text-[11px] font-medium leading-none",
                      isActive ? "text-gray-900" : "text-gray-400",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </LayoutGroup>
        </div>
      </nav>

      {/* Desktop: left sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 sticky top-20 h-[calc(100dvh-5rem)] border-r bg-background p-3 gap-1">
        <LayoutGroup id="sidebar-tab-bar">
          {tabs.map(({ path, label, Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                href={path}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl"
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-pill"
                    className="absolute inset-0 bg-gray-100 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 32, mass: 1 }}
                  />
                )}
                <Icon
                  size={20}
                  className={cn("relative z-10", isActive ? "text-gray-900" : "text-gray-400")}
                />
                <span
                  className={cn(
                    "relative z-10 text-sm font-medium",
                    isActive ? "text-gray-900" : "text-gray-400",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </LayoutGroup>
      </aside>
    </>
  );
}
