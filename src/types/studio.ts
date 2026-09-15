import type { SocialLinkOut } from "./socialLink";

export interface StudioRoom {
  id: string;
  studio_id: string;
  name: string;
}

export interface StudioPass {
  id: string;
  studio_id: string;
  name: string;
  price: number;
  currency?: string | null;
  description?: string | null;
  photo?: string | null;
  duration_days?: number | null;
  session_count?: number | null;
}

export interface SportCard {
  id: string;
  name: string;
  slug: string;
  photo?: string | null;
  description?: string | null;
}

export interface StudioSportCardAcceptance {
  id: string;
  studio_id: string;
  sport_card_id?: string | null;
  name?: string | null;
  photo?: string | null;
  description?: string | null;
  fee?: number | null;
  sport_card?: SportCard | null;
}

export interface StudioAmenity {
  id: string;
  name: string;
  slug: string;
  icon_id?: string | null;
}

export interface StudioYogaStyle {
  id: string;
  name: string;
  slug: string;
  icon_id?: string | null;
}

export interface StudioInstructor {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
  short_bio?: string | null;
}

export interface StudioPublicLocation {
  title?: string | null;
  address_line1?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface StudioPublic {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  address?: string | null;
  image_id?: string | null;
  image_ids?: string[] | null;
  drop_in_price?: number | null;
  currency?: string | null;
  accepts_sport_cards?: boolean | null;
  is_listed: boolean;
  status: string;
  rooms: StudioRoom[];
  passes: StudioPass[];
  sport_card_acceptances: StudioSportCardAcceptance[];
  amenities: StudioAmenity[];
  /** Computed server-side from the classes with future sessions scheduled here —
   *  never stored on the studio, and not settable from the studio form. */
  yoga_styles: StudioYogaStyle[];
  instructors: StudioInstructor[];
  location?: StudioPublicLocation | null;
  social_links: SocialLinkOut[];
  created_at: string;
  updated_at: string;
}

export interface StudioPublicSearchItem {
  id: string;
  name: string;
  slug?: string | null;
  image_id?: string | null;
  address?: string | null;
  city?: string | null;
  is_claimed: boolean;
}

export interface StudioPublicListItem {
  id: string;
  name: string;
  slug: string;
  image_id?: string | null;
  image_ids: string[];
  address?: string | null;
  city?: string | null;
  yoga_styles: string[];
}

/**
 * One row of a public city directory page (`/[miasto]`) or of the `/studia` index.
 *
 * Deliberately **not** `StudioPublicListItem`, for the same reason `InstructorIndexItem` is not
 * `InstructorPublicListItem`: the two are fed from different places, and collapsing them would
 * make one of them lie.
 *
 * `yoga_styles` here comes from the **directory import**, not from the studio. A studio's own
 * styles are computed from the classes with future occurrences scheduled there
 * (`services/studio_classes.py`), and the stored join was dropped on purpose in migration
 * `c2d5f8a13b47` because it had no writer left. An unclaimed studio has no schedule, so that
 * computation returns `[]` for every imported row — which is why the directory carries its own
 * list rather than writing styles back onto `Studio`. The two sources never describe the same
 * studio at the same time: the imported list is what a `directory` row shows, and claiming one
 * hands it over to the computed set for good.
 *
 * **No price, deliberately.** A directory of yoga studios is not a price comparison, and a
 * per-studio price tag on every row turns it into one. The field exists on the studio record and
 * on the scrape; it is left out of this projection so the decision cannot quietly erode.
 *
 * `is_published` decides whether the row is a link. An unpublished row has **no detail page at
 * all** — not even a noindex one — so everything known about that studio has to fit in here.
 */
export interface StudioDirectoryItem {
  /** The directory source's own studio id — the row's identity, and the key every public
   *  surface addresses this listing by (claim links, removal requests, card identity).
   *
   *  ⚠ **Not a Google Place ID.** The current source publishes none anywhere; what it has
   *  is a Google *Customer ID*, a different identifier, kept server-side for deduplication
   *  and never exposed here. */
  external_id: string;
  /** `null` means the listing did not clear the content bar and has **no page at all** —
   *  not a noindexed one, none. So everything known about that studio has to fit in the
   *  card, and the card must not read as a link that failed. */
  slug: string | null;
  /** The studio is managed here by its owner: claimed, phone-verified, maintaining its own
   *  profile. These sort above every other row in their city and carry a badge.
   *
   *  ⚠ It means the owner verified a phone number and claimed the profile — not that anyone
   *  inspected the business. Copy must not imply more than that. */
  is_managed: boolean;
  /** The studio's own logo, and **only ever a managed studio's** — `null` for every directory
   *  listing, enforced on the backend rather than trusted here. The directory source carries
   *  no images at all; a logo is an asset the partner uploaded to us. */
  image_id: string | null;
  name: string;
  address: string | null;
  /** New with this source — 801 of 1808 listings carry one, where the previous source had
   *  none at all. The strongest local fact the directory has. */
  district: string | null;
  city: string | null;
  description: string | null;
  /** Contact phone, present on roughly 92% of imported rows. */
  phone: string | null;
  website: string | null;
  /** Yoga-style names from the source's own resolved taxonomy — already canonical, already
   *  Polish, no mapping table involved. Only `yoga_style` categories appear here: a studio
   *  can qualify for a page on pilates or meditation alone and legitimately show no chips. */
  styles: string[];
  latitude: number | null;
  longitude: number | null;
}

/**
 * The aggregate header of a city page.
 *
 * Every figure is a **count**, never a percentage. Most cities carry single-digit samples,
 * where a percentage implies a precision the data cannot support and moves the moment one
 * studio is enriched.
 *
 * There is no comparative claim here. The spec allowed one — "more common here than
 * elsewhere" — on at least five studios, but the over-representation threshold it rests on
 * was never specified and no value reproduces its predicted "exactly one city in the
 * country": 1.5x fires nine cities and Krakow three times, which the spec forbids, and 2.0x
 * fires none.
 */
export interface CityDirectorySummary {
  slug: string;
  /** The nominative, exactly as stored — never translated, never re-cased. */
  name: string;
  /** The whole locative phrase including the preposition — "w Krakowie", "we Wroclawiu".
   *  Stored rather than generated: Polish locative cannot be derived from the nominative,
   *  and neither can the "w" / "we" alternation.
   *
   *  `null` is a valid, handled state: the page omits its opening paragraph rather than
   *  generating a form. A wrong case in the first line is worse than no first line. */
  city_locative: string | null;
  /** Every active studio in the city. The city page's job is completeness. */
  active_count: number;
  /** …of which have a page. In Krakow that is 11 of 63. */
  published_count: number;
  /** How many published rows actually carry styles, so the filter's counts can admit their
   *  denominator instead of implying they describe the whole city. */
  styles_known_count: number;
  /** The two biggest non-yoga kinds in the source's taxonomy, and the honest replacement for
   *  the old English-language and online counts — both came from columns the previous source
   *  had and this one does not. */
  pilates_count: number;
  meditation_count: number;
}

/** One unclaimed studio's own page. Carries the price, which `StudioDirectoryItem`
 *  deliberately does not: a price on every row of a city page turns a directory into a
 *  price comparison, while a price on one studio's own page is just a fact about it. */
export interface DirectoryStudioDetail extends StudioDirectoryItem {
  /** The cheapest single-entry offer the source found. */
  drop_in_price: number | null;
  currency: string | null;
  passes: DirectoryPass[];
  other_offers: DirectoryOffer[];
  /** The city's URL segment, or `null` when that city has no page — a studio in a town below
   *  the three-published threshold has a city name and nowhere to link it to. */
  city_slug: string | null;
}

/** An offer complete enough to render through the studio page's own `PassList`. Mirrors
 *  `StudioPass`, so that component takes it directly.
 *
 *  ⚠ `id` is synthetic — a React key, not a buyable pass. These render with
 *  `purchasable={false}`: the studio is unclaimed and has no account here. */
export interface DirectoryPass {
  id: string;
  name: string;
  price: number;
  currency: string | null;
  description: string | null;
  session_count: number | null;
  duration_days: number | null;
}

/** Everything the classifier could not honestly call a pass — private classes,
 *  subscriptions, trials, anything priced only as free text. */
export interface DirectoryOffer {
  name: string | null;
  category: string | null;
  price_text: string | null;
  amount: number | null;
  currency: string | null;
}

export interface DirectoryStyleFacet {
  name: string;
  count: number;
}

export interface CityDirectoryPayload {
  summary: CityDirectorySummary;
  /** Ordered by the backend: published first, then the rest, alphabetically under Polish
   *  collation within each group. Never re-sort here — a client-side sort of one page is
   *  not a sort, and the order is deliberately stable between visits. */
  studios: StudioDirectoryItem[];
  styles: DirectoryStyleFacet[];
}

export interface CityIndexItem {
  slug: string;
  name: string;
  active_count: number;
  published_count: number;
}

export interface TownGroup {
  name: string;
  studios: StudioDirectoryItem[];
}

export interface StudiosIndexPayload {
  cities: CityIndexItem[];
  towns: TownGroup[];
}

export interface GeneratedStudioProfileDraft {
  draft_id: string;
  public_token: string;
  public_url: string;
  draft_kind: "existing" | "generated";
  status: string;
  profile: StudioPublic;
  sources: Array<Record<string, unknown>>;
  confidence: Record<string, unknown>;
  image_provenance: Record<string, unknown>;
  error_message?: string | null;
  expires_at: string;
}
