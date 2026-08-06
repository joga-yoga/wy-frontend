import { Accessibility, Sparkles, SquareParking, Wind } from "lucide-react";

import JYBikeIcon from "@/components/icons/amenities/JYBikeIcon";
import JYDrinkIcon from "@/components/icons/amenities/JYDrinkIcon";
import JYHangerIcon from "@/components/icons/amenities/JYHangerIcon";
import JYKeyLockersIcon from "@/components/icons/amenities/JYKeyLockersIcon";
import JYShowerIcon from "@/components/icons/amenities/JYShowerIcon";
import TagYogaMatteIcon from "@/components/icons/tags/TagYogaMatteIcon";

/** Maps the `icon_id` placeholder values seeded by the backend (T02) to a lucide icon.
 * Placeholder icons only — final icon assets arrive later, per spec. Falls back to a
 * generic icon for any unrecognized/legacy `icon_id`. */
const AMENITY_ICONS: Record<string, any> = {
  yoga: TagYogaMatteIcon,
  hanger: JYHangerIcon,
  drink: JYDrinkIcon,
  shower: JYShowerIcon,
  "key-lockers": JYKeyLockersIcon,
  bike: JYBikeIcon,
  accessibility: Accessibility,
  "square-parking": SquareParking,
  wind: Wind,
};

export function amenityIcon(iconId?: string | null): any {
  if (!iconId) return Sparkles;
  return AMENITY_ICONS[iconId] ?? Sparkles;
}
