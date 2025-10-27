import LogoTransparentSmall from "@/components/icons/LogoTransparentSmall";
import { cn } from "@/lib/utils";

export const LogoPartners = ({
  className,
  variant = "white",
  project,
}: {
  className?: string;
  variant?: "white" | "black";
  project: "retreats" | "workshops";
}) => {
  return (
    <div className={cn("flex flex-col items-center gap-2 md:gap-3", className)}>
      <div
        className={cn(
          "w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-full shadow-[1px_1px_16px_10px_rgba(255,252,238,0.5)] text-xl md:text-h-middle",
          variant === "white" && "bg-white",
          variant === "black" && "bg-gray-600",
        )}
      >
        <LogoTransparentSmall
          className={`w-10 h-10 md:w-16 md:h-16 ${variant === "black" ? "text-white" : "text-gray-800"}`}
        />
      </div>
      <p
        className={`flex items-center text-xl md:text-h-middle ${variant === "white" ? "text-white" : "text-gray-800"}`}
      >
        {project === "retreats" ? "wyjazdy" : "wydarzenia"}
        <span
          className={cn(
            "inline-block rounded-md leading-[100%] pl-[2px] pt-[2px] pb-[4px] pr-[6px]",
            variant === "white" && "bg-gray-800 text-white",
            variant === "black" && "bg-gray-600 text-white",
          )}
        >
          .yoga
        </span>
      </p>
    </div>
  );
};
