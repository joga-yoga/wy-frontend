import { Location } from "@/app/retreats/types";

export const renderLocation = (location?: Location | null) => {
  if (!location) return "";
  return location.address_line1 || "";
};

export const renderShortLocation = (location?: Location | null) => {
  if (!location) return "";
  return location.city || location.state_province || location.title || location.address_line1;
};
