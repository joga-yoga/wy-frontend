"use client";
import { LogOut, PlusCircle, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { getImageUrl } from "@/app/(events)/events/[eventId]/helpers";
import ActiveBookmarkIcon from "@/components/icons/ActiveBookmarkIcon";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEventsFilter } from "@/context/EventsFilterContext";
import { cn } from "@/lib/utils";

import CustomBurgerIcon from "../icons/CustomBurgerIcon";
import CustomSearchIcon from "../icons/CustomSearchIcon";
import LogoBlackIcon from "../icons/LogoBlackIcon";

export const ProfileHeader: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 w-full text-primary border-b bg-background">
      <div className="w-full px-4 pl-[22px] h-16 flex items-center justify-between">
        {/* Placeholder for logo space */}
        <Link href="/dashboard" className="flex items-center justify-center w-[40px] h-[40px]">
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

        {/* Right Section: User Email & Profile Icon */}
        <div className="flex items-center gap-4">
          {/* Display user email if available */}
          {user && (
            <Link href="/dashboard/organizer">
              <span className="text-sm font-medium cursor-pointer hover:underline">
                {user.email}
              </span>
            </Link>
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

export const EventsHeader: React.FC = () => {
  const { user } = useAuth();
  const { isBookmarksActive, toggleBookmarksView } = useEventsFilter();
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto px-5 md:px-8 py-3 md:py-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <LogoBlackIcon className="h-[32px] w-[32px] md:h-[64px] md:w-[64px]" />
          </Link>

          {/* Right Section: Actions & Profile */}
          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/dashboard" passHref>
              <button className="hidden md:inline-block text-sm py-4 px-5 mr-[-20px] hover:underline">
                <p className="text-gray-700 text-middle-header-22">Dodaj wydarzenie za 5 min</p>
              </button>
            </Link>
            <button
              aria-label="Search"
              className="group text-muted-foreground h-[36px] w-[36px] md:h-[88px] md:w-[88px] flex items-center justify-center border-2 md:border-4 border-transparent hover:border-[#CBD5E1] relative"
              // onClick={() => setIsSearchActiveAndReset(true)}
            >
              <CustomSearchIcon className="h-[32px] w-[32px] md:h-[88px] md:w-[88px]" />
            </button>

            {/* Bookmark Toggle Button */}
            {pathname === "/" && (
              <button
                aria-label="Toggle Bookmarks"
                onClick={toggleBookmarksView}
                className={cn("hidden md:block", isBookmarksActive && "text-brand-green")}
              >
                {isBookmarksActive ? (
                  <ActiveBookmarkIcon className="h-[32px] w-[32px] md:h-[64px] md:w-[64px]" />
                ) : (
                  <BookmarkIcon className="h-[32px] w-[32px] md:h-[64px] md:w-[64px]" />
                )}
              </button>
            )}
            <Link href="/dashboard" passHref className="flex items-center justify-center">
              <button aria-label="Account">
                {user?.organizer?.image_id ? (
                  <Image
                    src={getImageUrl(user.organizer.image_id)}
                    alt="Organizer Avatar"
                    className="h-[32px] w-[32px] md:h-[64px] md:w-[64px] rounded-full object-cover"
                    width={128}
                    height={128}
                    objectFit="cover"
                  />
                ) : (
                  <CustomBurgerIcon className="h-[32px] w-[32px] md:h-[64px] md:w-[64px]" />
                )}
              </button>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
