"use client";
import { LogOut, PlusCircle, User } from "lucide-react";
import Link from "next/link";
import React from "react";

import ActiveBookmarkIcon from "@/components/icons/ActiveBookmarkIcon";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEventsFilter } from "@/context/EventsFilterContext";
import { cn } from "@/lib/utils";

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          {/* Wy icon */}
          <svg
            width="24" // Adjusted size
            height="24" // Adjusted size
            viewBox="0 0 35 45"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M9.96557 2.28003C10.8477 3.3134 12.708 6.92451 14.2562 10.4632C17.264 17.4078 18.4583 19.1329 20.2719 19.1329C21.9528 19.1329 23.4567 17.3635 25.4472 13.0287C29.4724 4.27053 30.1359 2.94353 31.2417 1.74924C32.5245 0.422245 34.0726 0.156845 34.4707 1.21844C35.2227 3.12046 31.9052 11.8344 25.0491 26.2102C19.2976 38.6397 15.6716 43.9034 13.5042 43.9034C12.1 43.7934 11.77 42.3634 13.1504 40.0551C16.9544 32.5355 16.4678 28.2006 10.3194 13.6479C7.04004 6.1734 6.02882 2.45697 6.47115 1.26267C6.95771 0.0683784 8.41741 0.466476 9.96557 2.28003Z"
              fill="currentColor" // Use currentColor to inherit color
            />
            <path
              d="M7.7 40.7134C7.7 42.8397 5.97629 44.5634 3.85 44.5634C1.7237 44.5634 0 42.8397 0 40.7134C0 38.5871 1.7237 36.8634 3.85 36.8634C5.97629 36.8634 7.7 38.5871 7.7 40.7134Z"
              fill="currentColor" // Use currentColor to inherit color
            />
          </svg>
        </Link>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" passHref>
            <Button variant="ghost" size="sm" className="text-sm">
              {user ? user.email : <>Dodaj wydarzenie za 5 min</>}
            </Button>
          </Link>
          {/* Bookmark Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Bookmarks"
            onClick={toggleBookmarksView}
            className={cn(isBookmarksActive && "text-brand-green")}
          >
            {isBookmarksActive ? (
              <ActiveBookmarkIcon className="h-5 w-5" />
            ) : (
              <BookmarkIcon className="h-5 w-5" />
            )}
          </Button>
          <Link href="/dashboard" passHref>
            <Button variant="ghost" size="icon" aria-label="Account">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
