"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IoCalendarOutline,
  IoFileTrayOutline,
  IoMenuOutline,
  IoPricetagOutline,
} from "react-icons/io5";

import { usePartnerCapabilities } from "@/context/PartnerCapabilitiesContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

/** Every path a tab can point to — used by the layout to decide when to reserve
 * space for the fixed bar, independent of which tabs are currently conditional. */
export const TAB_PATHS = [
  "/konto/partner/grafik",
  "/konto/partner/rezerwacje",
  "/konto/partner/oferta",
  "/konto/partner/menu",
] as const;

type TabPath = (typeof TAB_PATHS)[number];

type Tab = { path: TabPath; label: string; Icon: React.ElementType };

const REZERWACJE: Tab = {
  path: "/konto/partner/rezerwacje",
  label: "Rezerwacje",
  Icon: IoFileTrayOutline,
};
const OFERTA: Tab = { path: "/konto/partner/oferta", label: "Oferta", Icon: IoPricetagOutline };
const MENU: Tab = { path: "/konto/partner/menu", label: "Menu", Icon: IoMenuOutline };
const GRAFIK: Tab = { path: "/konto/partner/grafik", label: "Grafik", Icon: IoCalendarOutline };

/**
 * Tabs materialize from what the partner actually has — never a role/entity switcher
 * (spec-b2b §3). Grafik is absent for a partner with no managed studio and no
 * accepted teaching link; Rezerwacje/Oferta/Menu are always present, differing only
 * in their empty state (content lands in T09-T12).
 *
 * Active state is color + weight only, no pill background — matches the
 * brand-green-accent, minimal-chrome language of `SegmentedToggle` and the newer
 * booking-flow screens rather than the old 3-tab bar's dark pill.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const { capabilities } = usePartnerCapabilities();
  const [hasOverdue, setHasOverdue] = useState(false);

  const hasGrafik = Boolean(
    capabilities &&
      (capabilities.managedStudios.length > 0 || capabilities.teachingStudios.length > 0),
  );

  // Amber dot on the Grafik icon whenever reconciliation has anything pending —
  // visible cross-tab (reception-desk §5), not just while Grafik itself is open.
  useEffect(() => {
    if (!hasGrafik) return;
    axiosInstance
      .get<{ total: number }>("/partner/reconciliation")
      .then(({ data }) => setHasOverdue(data.total > 0))
      .catch(() => setHasOverdue(false));
  }, [hasGrafik]);

  const tabs: Tab[] = hasGrafik ? [GRAFIK, REZERWACJE, OFERTA, MENU] : [REZERWACJE, OFERTA, MENU];

  if (!(TAB_PATHS as readonly string[]).includes(pathname)) return null;

  return (
    <>
      {/* Mobile: fixed bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pt-2"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] rounded-[16px] flex w-full p-1.5 gap-1 border border-gray-100">
          {tabs.map(({ path, label, Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                href={path}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2 rounded-[13px] tap-highlight-transparent"
              >
                <span className="relative">
                  <Icon size={22} className={isActive ? "text-brand-green-700" : "text-gray-400"} />
                  {path === GRAFIK.path && hasOverdue && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-none",
                    isActive ? "font-semibold text-gray-900" : "font-medium text-gray-400",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: left sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 sticky top-20 h-[calc(100dvh-5rem)] border-r bg-background p-3 gap-1">
        {tabs.map(({ path, label, Icon }) => {
          const isActive = pathname === path;
          return (
            <Link key={path} href={path} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <span className="relative">
                <Icon size={20} className={isActive ? "text-brand-green-700" : "text-gray-400"} />
                {path === GRAFIK.path && hasOverdue && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
                )}
              </span>
              <span
                className={cn(
                  "text-sm",
                  isActive ? "font-semibold text-gray-900" : "font-medium text-gray-400",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </aside>
    </>
  );
}
