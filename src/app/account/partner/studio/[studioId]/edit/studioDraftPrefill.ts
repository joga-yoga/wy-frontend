import { formValuesFromStudio } from "./studioFormModel";
import type { StudioApiResponse, StudioFormValues } from "./types";

export type StudioDraftProfile = Omit<Partial<StudioApiResponse>, "social_links" | "passes"> & {
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  location?: Omit<NonNullable<StudioFormValues["location"]>, "id"> | null;
  passes?: Array<Omit<StudioApiResponse["passes"][number], "id" | "studio_id"> & { id?: string }>;
  social_links?: (Pick<SocialLinkOut, "url"> & Partial<SocialLinkOut>)[];
};

/** Do not turn absent source fields into empty collections or default payment settings. */
export function draftFormValues(profile: StudioDraftProfile): Partial<StudioFormValues> {
  const converted = formValuesFromStudio({
    id: "",
    status: "stub",
    name: "",
    rooms: [],
    passes: [],
    sport_card_acceptances: [],
    amenity_ids: [],
    instructor_links: [],
    created_at: "",
    updated_at: "",
    ...profile,
    social_links: profile.social_links?.flatMap((link, index) => {
      try {
        const parsed = parseSocialUrl(link.url);
        return [
          {
            id: link.id || `draft:${index}:${link.url}`,
            url: link.url,
            platform: link.platform || parsed.platform,
            handle: link.handle ?? parsed.handle,
            label: link.label || defaultLabelFor(parsed),
            position: link.position ?? index,
          },
        ];
      } catch {
        return []; // An unusable source link must not prevent the rest of the snapshot loading.
      }
    }),
  });
  const fields = new Set(Object.keys(profile));
  if (fields.has("is_listed")) fields.add("is_public");
  if (fields.has("instructor_links")) fields.add("instructor_ids");
  fields.delete("location");
  const values: Partial<StudioFormValues> = Object.fromEntries(
    Object.entries(converted).filter(([key]) => fields.has(key)),
  );
  if ("currency" in profile) values.currency = profile.currency ?? "";
  if (profile.passes)
    values.passes = values.passes?.map((pass, index) => ({
      ...pass,
      currency: profile.passes![index].currency ?? "",
    }));
  if (profile.location && profile.location_id)
    values.location = { ...profile.location, id: profile.location_id };
  if (profile.city && profile.address && !profile.location_id) {
    // Source geography has no account Location ID until the actual save.
    values.location = {
      id: "",
      title: profile.name,
      address_line1: profile.address,
      city: profile.city,
      latitude: profile.latitude,
      longitude: profile.longitude,
    };
  }
  return values;
}
import { defaultLabelFor, parseSocialUrl } from "@/lib/socialLinks";
import type { SocialLinkOut } from "@/types/socialLink";
