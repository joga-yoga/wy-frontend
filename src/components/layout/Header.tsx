"use client";
import { ChevronLeft, LogOut } from "lucide-react";
import { LayoutGroup, motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { IoChevronBack, IoPersonOutline } from "react-icons/io5";

import { LinkWithBlocker } from "@/app/profile/(dashboard)/components/EventForm/block-navigation/link";
import { BookmarkButton } from "@/components/custom/BookmarkButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEventsFilter } from "@/context/EventsFilterContext";
import { cn } from "@/lib/utils";

import { WyImage } from "../custom/WyImage";
import CustomPlusIconMobile from "../icons/CustomPlusIconMobile";
import { LogoFooter } from "./Footer";

// Transition matching Airbnb's cubic-bezier(0.2, 0, 0, 1)
const INDICATOR_TRANSITION = { duration: 0.5, ease: [0.2, 0, 0, 1] as const };
const TAB_ACTIVE_COLOR = "#222222";
const TAB_INACTIVE_COLOR = "#717171";
const TAB_INTERACTION_TRANSITION = { duration: 0.3, ease: [0.2, 0, 0, 1] as const };
const TAB_ICON_VARIANTS = {
  rest: { scale: 1 },
  hover: { scale: 1.16 },
  tap: { scale: 1.04 },
};
const TAB_COMPACT_SCROLL_DISTANCE = 120;
const getTabLabelVariants = (isActive: boolean) => ({
  rest: { color: isActive ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR },
  hover: { color: TAB_ACTIVE_COLOR },
  tap: { color: TAB_ACTIVE_COLOR },
});

interface ProfileHeaderProps {
  isSticky?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ isSticky = true }) => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const logoHref = pathname === "/profile" ? "/" : "/profile";

  return (
    <header
      className={cn("w-full text-primary border-b bg-background", isSticky && "sticky top-0 z-40")}
    >
      <div className="w-full px-3 md:px-4 md:pl-[22px] h-16 flex items-center justify-between">
        <LinkWithBlocker
          href={logoHref}
          className="flex items-center justify-center w-[40px] h-[40px]"
        >
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
        </LinkWithBlocker>

        <div className="flex items-center gap-4">
          {user && (
            <LinkWithBlocker href="/profile/partner">
              <span className="text-sm font-medium cursor-pointer hover:underline">
                {user.email}
              </span>
            </LinkWithBlocker>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Log out"
            className="hover:bg-gray-700 hover:text-white"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export const PublicHeader = () => {
  const { user } = useAuth();
  const { isBookmarksActive, toggleBookmarksView } = useEventsFilter();
  const pathname = usePathname();

  const isWyjazdy = pathname.startsWith("/wyjazdy") || pathname.startsWith("/wyjazdy/");
  const isWydarzenia =
    pathname === "/" || pathname.startsWith("/wydarzenia") || pathname.startsWith("/wydarzenia/");
  const isMainPage = pathname === "/" || pathname === "/wyjazdy";
  const sectionPrefix = isWyjazdy ? "/wyjazdy" : "/wydarzenia";
  const isPartnersPage = pathname === "/wydarzenia/partners" || pathname === "/wyjazdy/partners";

  const accountHref = user ? "/profile" : `/profile/login?next=${encodeURIComponent(pathname)}`;
  const { scrollY } = useScroll();
  const compactProgress = useTransform(scrollY, [0, TAB_COMPACT_SCROLL_DISTANCE], [0, 1]);
  const tabIconOpacity = useTransform(compactProgress, [0, 0.5], [1, 0]);
  const tabIconScale = useTransform(compactProgress, [0, 0.5], [1, 0]);
  const mobileTabIconHeight = useTransform(compactProgress, [0, 1], [36, 0]);
  const mobileTabIconMarginBottom = useTransform(compactProgress, [0, 1], [0, -2]);

  if (isPartnersPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto px-5 md:px-8 h-16 md:h-20 relative flex items-stretch">
        <Link
          href={isWyjazdy ? "/wyjazdy" : "/"}
          className="flex items-center shrink-0 self-center"
        >
          <LogoFooter className={isMainPage ? "block" : "hidden md:block"} />
          <div
            className={cn(
              "h-10 w-10 md:h-10 md:w-10 bg-gray-100 rounded-full text-black flex items-center justify-center hover:bg-gray-200 duration-200",
              isMainPage ? "hidden" : "md:hidden",
            )}
          >
            <IoChevronBack className="h-6 w-6 ml-[-2px]" />
          </div>
        </Link>

        {/* Center: Airbnb-style flat tabs with sliding underline — absolutely centered on desktop */}
        <div className="hidden sm:flex absolute inset-y-0 left-1/2 -translate-x-1/2 items-center gap-[35px]">
          <LayoutGroup id="public-header-desktop-tabs">
            <Link href="/" className="relative h-full">
              <motion.span
                initial="rest"
                animate="rest"
                whileHover={isWydarzenia ? undefined : "hover"}
                whileTap={isWydarzenia ? undefined : "tap"}
                className="flex items-center gap-1.5 h-full"
              >
                <motion.span
                  variants={TAB_ICON_VARIANTS}
                  transition={TAB_INTERACTION_TRANSITION}
                  className="text-[28px] leading-none"
                  aria-hidden="true"
                >
                  🧘‍♀️
                </motion.span>
                <motion.span
                  variants={getTabLabelVariants(isWydarzenia)}
                  transition={TAB_INTERACTION_TRANSITION}
                  className="text-md font-medium whitespace-nowrap"
                >
                  Wydarzenia
                </motion.span>
              </motion.span>
              {isWydarzenia && (
                <motion.span
                  layoutId="underline"
                  initial={false}
                  transition={INDICATOR_TRANSITION}
                  aria-hidden="true"
                  className="absolute bottom-[18px] inset-x-0 h-[3px] bg-[#222222] rounded-[1.5px]"
                />
              )}
            </Link>
            <Link href="/wyjazdy" className="relative h-full">
              <motion.span
                initial="rest"
                animate="rest"
                whileHover={isWyjazdy ? undefined : "hover"}
                whileTap={isWyjazdy ? undefined : "tap"}
                className="flex items-center gap-1.5 h-full"
              >
                <motion.span
                  variants={TAB_ICON_VARIANTS}
                  transition={TAB_INTERACTION_TRANSITION}
                  className="text-[28px] leading-none"
                  aria-hidden="true"
                >
                  🏕️
                </motion.span>
                <motion.span
                  variants={getTabLabelVariants(isWyjazdy)}
                  transition={TAB_INTERACTION_TRANSITION}
                  className="text-md font-medium whitespace-nowrap"
                >
                  Wyjazdy
                </motion.span>
              </motion.span>
              {isWyjazdy && (
                <motion.span
                  layoutId="underline"
                  initial={false}
                  transition={INDICATOR_TRANSITION}
                  aria-hidden="true"
                  className="absolute bottom-[18px] inset-x-0 h-[3px] bg-[#222222] rounded-[1.5px]"
                />
              )}
            </Link>
          </LayoutGroup>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="ml-auto flex items-center gap-3 md:gap-3 self-center">
          <Link
            href={`${sectionPrefix}/partners`}
            passHref
            className={cn(isMainPage ? undefined : "hidden md:inline-block")}
          >
            <button className="text-md py-2.5 hover:underline">
              <p className="text-black font-medium">
                {isWyjazdy ? "Dodaj wyjazd" : "Dodaj wydarzenie"}
              </p>
            </button>
          </Link>
          <Link
            href={`${sectionPrefix}/partners`}
            passHref
            className={cn(isMainPage ? "hidden" : "md:hidden")}
          >
            <button
              aria-label="Add Event"
              className="group text-black h-10 w-10 flex items-center justify-center relative"
            >
              <CustomPlusIconMobile className="h-10 w-10" />
            </button>
          </Link>

          {isMainPage && (
            <BookmarkButton
              isActive={isBookmarksActive}
              toggleHandler={toggleBookmarksView}
              size="large"
              className="hidden md:flex"
            />
          )}

          <Link href={accountHref} passHref className="flex items-center justify-center">
            <button aria-label="Account">
              {user?.partner?.image_id ? (
                <WyImage
                  src={user.partner.image_id}
                  alt="Partner Avatar"
                  className="h-10 w-10 md:h-10 md:w-10 rounded-full object-cover"
                  width={128}
                  height={128}
                />
              ) : (
                <div className="h-10 w-10 md:h-10 md:w-10 bg-gray-100 rounded-full text-black flex items-center justify-center hover:bg-gray-200 duration-200">
                  <IoPersonOutline className="h-6 w-6 md:h-6 md:w-6" />
                </div>
              )}
            </button>
          </Link>
        </div>
      </div>

      {/* Mobile tab switcher — Airbnb-style: large emoji icon above text label */}
      {isMainPage && (
        <div className="sm:hidden flex justify-around border-t border-gray-100 px-[40px]">
          <LayoutGroup id="public-header-mobile-tabs">
            <Link href="/" className="min-w-[68px]">
              <motion.span
                initial="rest"
                animate="rest"
                whileHover={isWydarzenia ? undefined : "hover"}
                whileTap={isWydarzenia ? undefined : "tap"}
                className="flex flex-col items-center pt-2 pb-0 md:pb-4 gap-0"
              >
                <motion.span
                  style={{
                    height: mobileTabIconHeight,
                    marginBottom: mobileTabIconMarginBottom,
                    opacity: tabIconOpacity,
                    scale: tabIconScale,
                  }}
                  className="flex items-center justify-center overflow-hidden"
                >
                  <motion.span
                    variants={TAB_ICON_VARIANTS}
                    transition={TAB_INTERACTION_TRANSITION}
                    className="text-[36px] leading-none"
                    aria-hidden="true"
                  >
                    🧘‍♀️
                  </motion.span>
                </motion.span>
                {/* Underline is only as wide as the text label */}
                <span className="relative inline-block pb-[6px]">
                  <motion.span
                    variants={getTabLabelVariants(isWydarzenia)}
                    transition={TAB_INTERACTION_TRANSITION}
                    className="text-[13px] font-semibold"
                  >
                    Wydarzenia
                  </motion.span>
                  {isWydarzenia && (
                    <motion.span
                      layoutId="underline"
                      initial={false}
                      transition={INDICATOR_TRANSITION}
                      aria-hidden="true"
                      className="absolute bottom-0 inset-x-0 h-[3px] bg-[#222222] rounded-t-[1.5px]"
                    />
                  )}
                </span>
              </motion.span>
            </Link>
            <Link href="/wyjazdy" className="min-w-[68px]">
              <motion.span
                initial="rest"
                animate="rest"
                whileHover={isWyjazdy ? undefined : "hover"}
                whileTap={isWyjazdy ? undefined : "tap"}
                className="flex flex-col items-center pt-2 pb-0 md:pb-4 gap-0"
              >
                <motion.span
                  style={{
                    height: mobileTabIconHeight,
                    marginBottom: mobileTabIconMarginBottom,
                    opacity: tabIconOpacity,
                    scale: tabIconScale,
                  }}
                  className="flex items-center justify-center overflow-hidden"
                >
                  <motion.span
                    variants={TAB_ICON_VARIANTS}
                    transition={TAB_INTERACTION_TRANSITION}
                    className="text-[36px] leading-none"
                    aria-hidden="true"
                  >
                    🏕️
                  </motion.span>
                </motion.span>
                {/* Underline is only as wide as the text label */}
                <span className="relative inline-block pb-[6px]">
                  <motion.span
                    variants={getTabLabelVariants(isWyjazdy)}
                    transition={TAB_INTERACTION_TRANSITION}
                    className="text-[13px] font-semibold"
                  >
                    Wyjazdy
                  </motion.span>
                  {isWyjazdy && (
                    <motion.span
                      layoutId="underline"
                      initial={false}
                      transition={INDICATOR_TRANSITION}
                      aria-hidden="true"
                      className="absolute bottom-0 inset-x-0 h-[3px] bg-[#222222] rounded-t-[1.5px]"
                    />
                  )}
                </span>
              </motion.span>
            </Link>
          </LayoutGroup>
        </div>
      )}
    </header>
  );
};
