import { IoStarOutline } from "react-icons/io5";
import { IoStar } from "react-icons/io5";

import { cn } from "@/lib/utils";

export const BookmarkButton = ({
  isActive,
  toggleHandler,
  size = "small",
  className,
  iconClassName,
  activeIconClassName,
}: {
  isActive: boolean;
  toggleHandler: (e?: any) => void;
  size?: "small" | "large" | "mobile-footer" | "desktop-filter";
  className?: string;
  iconClassName?: string;
  activeIconClassName?: string;
}) => {
  return (
    <button
      onClick={toggleHandler}
      className={cn(
        "flex items-center justify-center bg-gray-100 rounded-full",
        size === "small" && "h-8 w-8 md:h-10 md:w-10",
        size === "large" && "h-10 w-10 md:h-12 md:w-12",
        size === "mobile-footer" && "h-12 w-12",
        size === "desktop-filter" && "h-[80px] w-[80px]",
        "hover:bg-gray-200 duration-200",
        className,
      )}
    >
      {isActive ? (
        <IoStar
          className={cn(
            "text-brand-green",
            size === "small" && "w-5 h-5 md:w-6 md:h-6",
            size === "large" && "w-6 h-6 md:w-7 md:h-7",
            size === "mobile-footer" && "w-6 h-6",
            size === "desktop-filter" && "w-10 h-10",
            activeIconClassName,
          )}
        />
      ) : (
        <IoStarOutline
          className={cn(
            "stroke-[1.25px]",
            size === "small" && "w-5 h-5 md:w-6 md:h-6",
            size === "large" && "w-6 h-6 md:w-7 md:h-7",
            size === "mobile-footer" && "w-6 h-6",
            size === "desktop-filter" && "w-10 h-10",
            iconClassName,
          )}
        />
      )}
    </button>
  );
};
