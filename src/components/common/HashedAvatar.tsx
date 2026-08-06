import { WyImage } from "@/components/custom/WyImage";
import { COLOR_FILL_700_MAP, hashSeedToClassColor } from "@/lib/classColors";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface HashedAvatarProps {
  /** Stable identifier (instructor id, studio id, ...) — NOT the name, so the color
   * doesn't shift if the entity is renamed. */
  seed: string;
  name: string;
  imageId?: string | null;
  size: number;
  className?: string;
  imageFit?: "cover" | "contain";
  /** Precomputed fallback letters, for callers with better initials logic than a
   * whitespace split — e.g. `personInitials`, which also handles email-only users. */
  initialsOverride?: string;
}

/** Circle or (via `className`) rounded-square fallback avatar: photo when available,
 * otherwise a filled `--color-class-{hue}-700` circle with white initials, hue from a
 * stable hash of `seed`. The one avatar component for instructors, users/clients, and
 * studio-logo fallbacks — reuse this instead of another one-off initials circle. */
export function HashedAvatar({
  seed,
  name,
  imageId,
  size,
  className,
  imageFit = "cover",
  initialsOverride,
}: HashedAvatarProps) {
  const hue = hashSeedToClassColor(seed);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        !imageId && COLOR_FILL_700_MAP[hue],
        className,
      )}
      style={{ width: size, height: size }}
    >
      {imageId ? (
        <WyImage
          src={imageId}
          alt={name}
          fill
          className={imageFit === "cover" ? "object-cover" : "object-contain"}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-semibold text-white"
          style={{ fontSize: Math.round(size * 0.35) }}
        >
          {initialsOverride ?? initials(name)}
        </span>
      )}
    </div>
  );
}
