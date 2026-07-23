import Image from "next/image";

import { cn } from "@/lib/utils";

type JogaYogaLogoProps = {
  className?: string;
  variant?: "on-light" | "on-dark";
  size?: "mobile" | "desktop";
};

export function JogaYogaLogo({
  className,
  variant = "on-light",
  size = "desktop",
}: JogaYogaLogoProps) {
  const inverseSuffix = variant === "on-dark" ? "-inverse" : "";

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        size === "desktop" ? "gap-3" : "gap-3",
        className,
      )}
      aria-label="joga.yoga"
    >
      <Image
        src={`/images/logo/svg/joga-yoga-mark${inverseSuffix}.svg`}
        alt=""
        width={size === "desktop" ? 65 : 32}
        height={size === "desktop" ? 65 : 32}
        className={cn(size === "desktop" ? "size-[65px]" : "size-8")}
      />
      <Image
        src={`/images/logo/svg/joga-yoga-wordmark${inverseSuffix}.svg`}
        alt=""
        width={size === "desktop" ? 175 : 88}
        height={size === "desktop" ? 43 : 22}
        className={cn(size === "desktop" ? "h-[43px] w-[175px]" : "h-[22px] w-[88px]")}
      />
    </div>
  );
}
