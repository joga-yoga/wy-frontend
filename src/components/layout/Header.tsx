"use client";
import { ChevronLeft, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { IoPersonOutline } from "react-icons/io5";

import { LinkWithBlocker } from "@/app/profile/(dashboard)/components/EventForm/block-navigation/link";
import { getImageUrl } from "@/app/retreats/retreats/[slug]/helpers";
import { BookmarkButton } from "@/components/custom/BookmarkButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEventsFilter } from "@/context/EventsFilterContext";
import { cn } from "@/lib/utils";

import CustomBurgerIcon from "../icons/CustomBurgerIcon";
import CustomPlusIconMobile from "../icons/CustomPlusIconMobile";
import LogoBlackIcon from "../icons/LogoBlackIcon";

interface ProfileHeaderProps {
  isSticky?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ isSticky = true }) => {
  const { user, signOut } = useAuth();

  return (
    <header
      className={cn("w-full text-primary border-b bg-background", isSticky && "sticky top-0 z-40")}
    >
      <div className="w-full px-3 md:px-4 md:pl-[22px] h-16 flex items-center justify-between">
        {/* Placeholder for logo space */}
        <LinkWithBlocker
          href={`${process.env.NEXT_PUBLIC_PROFILE_HOST}`}
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

        {/* Right Section: User Email & Profile Icon */}
        <div className="flex items-center gap-4">
          {/* Display user email if available */}
          {user && (
            <LinkWithBlocker href={`${process.env.NEXT_PUBLIC_PROFILE_HOST}/organizer`}>
              <span className="text-sm font-medium cursor-pointer hover:underline">
                {user.email}
              </span>
            </LinkWithBlocker>
          )}
          {/* Log out button */}
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

export const PublicHeader: React.FC<{ project: "retreats" | "workshops" }> = ({ project }) => {
  const { user } = useAuth();
  const { isBookmarksActive, toggleBookmarksView, setIsSearchActiveAndReset, isSearchActive } =
    useEventsFilter();
  const pathname = usePathname();
  const isMainPage = pathname === "/";
  const isPartnersPage = pathname === "/partners";
  if (isPartnersPage) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto px-5 md:px-8 py-3 md:py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            {isMainPage ? (
              <LogoBlackIcon className="h-10 w-10 md:h-12 md:w-12" />
            ) : (
              <>
                <LogoBlackIcon className="hidden md:block h-10 w-10 md:h-12 md:w-12" />
                <div className="md:hidden flex items-center justify-center h-10 w-10 md:h-12 md:w-12 bg-gray-600 rounded-full text-white">
                  <ChevronLeft className="h-7 w-7 stroke-2 ml-[-2px]" />
                </div>
              </>
            )}
          </Link>

          {/* Right Section: Actions & Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              href="/partners"
              passHref
              className={cn(isMainPage ? undefined : "hidden md:inline-block")}
            >
              <button className="text-sm py-2.5 hover:underline">
                <p className="text-gray-700 text-m-header md:text-xl font-medium">
                  {project === "retreats" ? "Dodaj wyjazd bezpłatnie (5 min)" : "Dodaj wydarzenie bezpłatnie za 5 min"}
                </p>
              </button>
            </Link>
            <Link href="/partners" passHref className={cn(isMainPage ? "hidden" : "md:hidden")}>
              <button
                aria-label="Add Event"
                className="group text-muted-foreground h-10 w-10 flex items-center justify-center relative"
              >
                <CustomPlusIconMobile className="h-10 w-10" />
              </button>
            </Link>

            {/* Bookmark Toggle Button */}
            {isMainPage && (
              <BookmarkButton
                isActive={isBookmarksActive}
                toggleHandler={toggleBookmarksView}
                size="large"
                className="hidden md:flex"
              />
            )}

            <Link
              href={`${process.env.NEXT_PUBLIC_PROFILE_HOST}`}
              passHref
              className="flex items-center justify-center"
            >
              <button aria-label="Account">
                {user?.organizer?.image_id ? (
                  <Image
                    src={getImageUrl(user.organizer.image_id)}
                    alt="Organizer Avatar"
                    className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-gray-100 rounded-full text-black flex items-center justify-center hover:bg-gray-200 duration-200">
                    <IoPersonOutline className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                )}
              </button>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
