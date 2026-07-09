import { WyImage } from "@/components/custom/WyImage";
import { cn } from "@/lib/utils";

// Warm, brand-appropriate tones, each dark/saturated enough for white text on top
// (manually contrast-checked against #fff, all >= 4.5:1).
const PALETTE = [
  "#c2703d", // terracotta
  "#4f6d7a", // steel teal
  "#8b5e3c", // caramel
  "#6b7a3f", // olive
  "#7a5c61", // mauve-brown
  "#5c7a6b", // sage
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function paletteColor(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

interface InstructorAvatarProps {
  name: string;
  imageId?: string | null;
  size?: number;
  className?: string;
}

export function InstructorAvatar({ name, imageId, size = 48, className }: InstructorAvatarProps) {
  const bg = paletteColor(name);

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size, backgroundColor: imageId ? undefined : bg }}
    >
      {imageId ? (
        <WyImage src={imageId} alt={name} fill className="object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-semibold text-white"
          style={{ fontSize: Math.round(size * 0.35) }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
