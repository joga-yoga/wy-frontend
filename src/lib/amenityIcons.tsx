import {
  Accessibility,
  Bike,
  CupSoda,
  DoorOpen,
  Lock,
  LucideIcon,
  Package,
  ShowerHead,
  Sparkles,
  SquareParking,
  Wind,
} from "lucide-react";

/** Maps the `icon_id` placeholder values seeded by the backend (T02) to a lucide icon.
 * Placeholder icons only — final icon assets arrive later, per spec. Falls back to a
 * generic icon for any unrecognized/legacy `icon_id`. */
const AMENITY_ICONS: Record<string, LucideIcon> = {
  "door-open": DoorOpen,
  "shower-head": ShowerHead,
  "square-parking": SquareParking,
  wind: Wind,
  package: Package,
  accessibility: Accessibility,
  "cup-soda": CupSoda,
  lock: Lock,
  bike: Bike,
};

export function amenityIcon(iconId?: string | null): LucideIcon {
  if (!iconId) return Sparkles;
  return AMENITY_ICONS[iconId] ?? Sparkles;
}
