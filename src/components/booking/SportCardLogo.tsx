import { WyImage } from "@/components/custom/WyImage";
import { cn } from "@/lib/utils";

export function SportCardLogo({
  photo,
  alt,
  width = 52,
  height = 34,
  className,
}: {
  photo?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#F5F3EE]",
        className,
      )}
      style={{ width, height }}
    >
      {photo ? (
        <WyImage
          src={photo}
          alt={alt}
          width={width}
          height={height}
          className="h-full w-full object-fill"
        />
      ) : (
        <span className="text-[10px] font-semibold text-gray-400">Karta</span>
      )}
    </div>
  );
}
