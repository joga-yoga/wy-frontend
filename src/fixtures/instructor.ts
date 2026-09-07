import type { InstructorDetails } from "@/types/instructor";

/**
 * The instructor persona, extracted from `tests/e2e/mock-instructor-api.ts` by
 * .plans/proto-workbench/ T04 so the mock API server and the prototype workbench cannot drift.
 *
 * This is the one fixture in this directory that was NOT authored here — it is real data that
 * already backed four Playwright specs. Typing it against `InstructorDetails` surfaced three
 * required fields the inline version had been omitting: `social_links`, `is_published` and
 * `is_claimed`. They are added below, which is the point of the exercise — an untyped fixture
 * had been quietly serving objects the real schema says cannot exist.
 *
 * It also carried a `studio_name` field that `InstructorPublic` does not have and that nothing
 * in src/ reads — dead data. Removed rather than typed around: per the design protocol, an
 * unavailable field is a finding to surface, not a detail to keep. See plan.md F12.
 */
export const instructorFixture: InstructorDetails = {
  instructor: {
    id: "hero-fixture",
    name: "Nadolny Przemek",
    description:
      "Uważna praktyka jogi dla ciała, oddechu i spokoju umysłu. Praktyka prowadzona spokojnie, z uważnością na rytm oddechu i indywidualne tempo uczestników.",
    short_bio:
      "Uważna praktyka jogi dla ciała, oddechu i spokoju umysłu. Refactor the existing instructor page so that the mobile version matches the attached data assumptions.",
    slug: "hero-fixture",
    image_id: null,
    languages: ["pl"],
    cities: [{ place_id: "lodz", name: "Łódź", country: "Polska" }],
    photo_ids: ["w.yoga2_qtnigw_p2gegq", "w.yoga1_mprdyz_hasbo9"],
    certificates: [{ name: "RYT500", image_id: null }],
    yoga_styles: [
      {
        id: "style-hatha",
        yoga_style_id: "hatha",
        custom_name: null,
        custom_icon_id: null,
        description: null,
        yoga_style: { id: "hatha", name: "Hatha", slug: "hatha", icon_id: null },
      },
      {
        id: "style-ashtanga",
        yoga_style_id: "ashtanga",
        custom_name: null,
        custom_icon_id: null,
        description: null,
        yoga_style: { id: "ashtanga", name: "Asztanga", slug: "asztanga", icon_id: null },
      },
      {
        id: "style-hot",
        yoga_style_id: null,
        custom_name: "Hot",
        custom_icon_id: null,
        description: null,
        yoga_style: null,
      },
      {
        id: "style-yin",
        yoga_style_id: "yin",
        custom_name: null,
        custom_icon_id: null,
        description: null,
        yoga_style: { id: "yin", name: "Yin", slug: "yin", icon_id: null },
      },
    ],
    // Required by InstructorPublic; absent from the pre-extraction inline fixture.
    social_links: [],
    is_published: true,
    is_claimed: true,
    created_at: "2026-06-15T00:00:00.000Z",
    updated_at: "2026-06-15T00:00:00.000Z",
  },
  upcoming_retreats: [],
  past_retreats: [],
  upcoming_workshops: [],
  past_workshops: [],
  upcoming_courses: [],
  past_courses: [],
};
