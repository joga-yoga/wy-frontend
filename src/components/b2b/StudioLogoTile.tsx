import { WyImage } from "@/components/custom/WyImage";
import { entityInitials } from "@/lib/personDisplay";
import { cn } from "@/lib/utils";

/**
 * A studio's logo as a rounded tile, with initials as the fallback (mockups R1, D2, V1).
 *
 * `Studio.image_id` *is* the logo — the profile editor has always uploaded it under a
 * "Logo" label; it simply never reached the Menu. It is rendered `object-contain` rather
 * than `object-cover`: a logo cropped to fill is a logo you can no longer read.
 */
export function StudioLogoTile({
  name,
  imageId,
  size = 40,
  className,
}: {
  name: string;
  imageId?: string | null;
  size?: number;
  className?: string;
}) {
  const rounding = size >= 56 ? "rounded-xl" : "rounded-lg";

  if (imageId) {
    return (
      <WyImage
        src={imageId}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 border bg-white object-contain", rounding, className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-b2b-green-bg font-semibold text-b2b-green-text",
        rounding,
        className,
      )}
      style={{ width: size, height: size, fontSize: size >= 56 ? 18 : 13 }}
    >
      {entityInitials(name)}
    </div>
  );
}
