import { IoStarOutline } from "react-icons/io5";
import { IoStar } from "react-icons/io5";

import { cn } from "@/lib/utils";

export const BookmarkButton = ({
  isActive,
  toggleHandler,
  size = "small",
  variant = "default",
  className,
  iconClassName,
  activeIconClassName,
}: {
  isActive: boolean;
  toggleHandler: (e?: any) => void;
  size?: "xs" | "small" | "large" | "mobile-footer" | "desktop-filter";
  variant?: "default" | "black";
  className?: string;
  iconClassName?: string;
  activeIconClassName?: string;
}) => {
  return (
    <button
      onClick={toggleHandler}
      className={cn(
        "relative flex items-center justify-center bg-gray-100 rounded-full",
        size === "xs" && "h-[22px] w-[22px] p-0 min-w-0 min-h-0",
        size === "small" && "h-8 w-8 md:h-10 md:w-10 min-w-8 md:min-w-10",
        size === "large" && "h-10 w-10 md:h-12 md:w-12 min-w-10 md:min-w-12",
        size === "mobile-footer" && "h-12 w-12 min-w-12",
        size === "desktop-filter" && "h-[80px] w-[80px]",
        "hover:bg-gray-200 duration-200",
        variant === "black" && "bg-gray-600 hover:bg-gray-600/90",
        className,
      )}
    >
      <IoStarOutline
        strokeWidth={0.5}
        className={cn(
          "absolute",
          size === "xs" && "w-[13px] h-[13px]",
          size === "small" &&
            "w-[calc(20px+2px)] h-[calc(20px+2px)] md:w-[calc(24px+2px)] md:h-[calc(24px+2px)]",
          size === "large" &&
            "w-[calc(24px+2px)] h-[calc(24px+2px)] md:w-[calc(28px+2px)] md:h-[calc(28px+2px)]",
          size === "mobile-footer" && "w-[calc(24px)] h-[calc(24px)]",
          size === "desktop-filter" && "w-10 h-10",
          variant === "black" && "text-white z-1",
          iconClassName,
        )}
      />

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
        <>
          {variant === "black" && (
            <IoStar
              className={cn(
                "absolute z-0 text-white",
                size === "small" && "w-5 h-5 md:w-6 md:h-6",
                size === "large" && "w-6 h-6 md:w-7 md:h-7",
                size === "mobile-footer" && "w-6 h-6",
                size === "desktop-filter" && "w-10 h-10",
              )}
            />
          )}
        </>
      )}
    </button>
  );
};
