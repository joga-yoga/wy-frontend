export interface PublicLocationData {
  title?: string | null;
  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
}

export function formatDisplayAddress(location: PublicLocationData): string {
  return location.address || location.address_line1 || location.city || location.title || "";
}

function formatLocationQuery(location: PublicLocationData): string {
  if (location.address) return location.address;

  const street = [location.address_line1, location.address_line2].filter(Boolean).join(", ");
  const city = [location.postal_code, location.city].filter(Boolean).join(" ");
  return [street, city, location.state_province, location.country].filter(Boolean).join(", ");
}

export function buildGoogleMapsHref(location: PublicLocationData): string {
  const address = formatLocationQuery(location);
  const coordinates =
    location.latitude != null && location.longitude != null
      ? `${location.latitude},${location.longitude}`
      : "";
  const query = address || coordinates || location.title || location.google_place_id;

  if (!query) return "https://www.google.com/maps";

  const params = new URLSearchParams({ api: "1", query });
  if (location.google_place_id) {
    params.set("query_place_id", location.google_place_id);
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
}
