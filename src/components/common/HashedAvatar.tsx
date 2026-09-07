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

interface HashedAvatarBaseProps {
  /** Stable identifier (instructor id, studio id, ...) — NOT the name, so the color
   * doesn't shift if the entity is renamed. */
  seed: string;
  name: string;
  imageId?: string | null;
  className?: string;
  imageFit?: "cover" | "contain";
  /** Precomputed fallback letters, for callers with better initials logic than a
   * whitespace split — e.g. `personInitials`, which also handles email-only users. */
  initialsOverride?: string;
}

/** Exactly one of `size` or `fill` — a union rather than two optionals, so neither
 * "both" nor "neither" is expressible. "Neither" is the dangerous one: it would render a
 * 0×0 box that is invisible rather than obviously broken. */
type HashedAvatarProps = HashedAvatarBaseProps &
  ({ size: number; fill?: never } | { fill: true; size?: never });

/** Circle or (via `className`) rounded-square fallback avatar: photo when available,
 * otherwise a filled `--color-class-{hue}-700` circle with white initials, hue from a
 * stable hash of `seed`. The one avatar component for instructors, users/clients, and
 * studio-logo fallbacks — reuse this instead of another one-off initials circle.
 *
 * **Two sizing modes.**
 *
 * `size={40}` is the original: a square of that many pixels, written inline, with the
 * initials at 35% of it. Every existing call site uses this and none of them changed.
 *
 * `fill` sizes from whatever `className` says — `aspect-[3/4] w-full`, `h-full w-full`,
 * anything — and emits **no** dimensions of its own, so it never fights the caller's
 * layout. It cannot reuse the `size * 0.35` rule because there is no number to multiply,
 * so the initials scale off the box itself: the wrapper becomes a container
 * (`container-type: inline-size` via `@container`) and the letters are `35cqw`, which is
 * the same 35% expressed against the rendered width instead of a prop.
 *
 * `fill` exists so the `/instruktorzy` card's portrait can be this component. It used to
 * be impossible — an inline `width`/`height` beats any fill class — and the prototype
 * worked around it by drawing the fallback locally from `COLOR_FILL_700_MAP` and
 * `hashSeedToClassColor`. That duplicated the "same person, same colour on every page"
 * rule into a second place, which is the thing that drifts. Don't reintroduce it; if this
 * component can't do what a surface needs, widen it here.
 */
export function HashedAvatar({
  seed,
  name,
  imageId,
  className,
  imageFit = "cover",
  initialsOverride,
  ...sizing
}: HashedAvatarProps) {
  const hue = hashSeedToClassColor(seed);
  // Narrowed at the point of use rather than through a boolean flag — a `const fills =
  // sizing.fill === true` reads better but stops TypeScript discriminating the union, and
  // the only way back is a non-null assertion on `size`.
  const fills = sizing.fill === true;
  const box = sizing.fill === true ? undefined : { width: sizing.size, height: sizing.size };
  const initialsFontSize = sizing.fill === true ? undefined : Math.round(sizing.size * 0.35);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        !imageId && COLOR_FILL_700_MAP[hue],
        // `rounded-full` above is a default, not a rule — `cn` is tailwind-merge, so a
        // caller's `rounded-2xl` wins. Verified, not assumed.
        fills && "@container",
        className,
      )}
      style={box}
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
          className={cn(
            "flex h-full w-full items-center justify-center font-semibold text-white",
            fills && "text-[35cqw]",
          )}
          style={initialsFontSize === undefined ? undefined : { fontSize: initialsFontSize }}
        >
          {initialsOverride ?? initials(name)}
        </span>
      )}
    </div>
  );
}
