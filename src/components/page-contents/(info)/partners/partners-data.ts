import { cacheLife, cacheTag } from "next/cache";

import { getPublicInstructors } from "@/lib/api/getPublicInstructors";
import { getPublicStudios } from "@/lib/api/getPublicStudios";
import { getRetreats } from "@/lib/api/retreats";
import { renderShortLocation } from "@/lib/renderLocation";

type PublicStats = {
  total_public_workshops: number;
  total_countries_with_public_retreats: number;
  total_public_retreats_in_poland: number;
};

export type PartnerStat = { value: number; description: string };
export type PartnerExample = {
  kind: "instructor" | "studio" | "retreat";
  heading: string;
  name: string;
  subtitle: string;
  href: string;
  imageId?: string | null;
  action: string;
};

function plural(count: number, forms: [string, string, string]) {
  if (count === 1) return forms[0];
  const lastTwo = count % 100;
  return count % 10 >= 2 && count % 10 <= 4 && !(lastTwo >= 12 && lastTwo <= 14)
    ? forms[1]
    : forms[2];
}

async function getPublicStats(): Promise<PublicStats> {
  "use cache";
  cacheLife({ stale: 1800, revalidate: 1800, expire: 7200 });
  cacheTag("public-stats");
  const base = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!base) throw new Error("API endpoint is not configured");
  // Server-side fetch follows the existing public API helpers and Cache Components.
  const response = await fetch(`${base}/public/stats`);
  if (!response.ok) throw new Error(`Failed to load partner stats: ${response.status}`);
  return response.json();
}

async function getStudioCount(): Promise<number> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 1800 });
  cacheTag("studios", "studios:public");
  const base = process.env.API_ENDPOINT ?? process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!base) throw new Error("API endpoint is not configured");
  const response = await fetch(`${base}/public/studios/slugs`);
  if (!response.ok) throw new Error(`Failed to load studio count: ${response.status}`);
  const slugs: string[] = await response.json();
  return new Set(slugs.filter(Boolean)).size;
}

export async function getPartnersData() {
  const results = await Promise.allSettled([
    getPublicStats(),
    getStudioCount(),
    getPublicInstructors({ limit: 1 }),
    getPublicStudios(1),
    getRetreats(
      new URLSearchParams({ limit: "1", skip: "0", sortBy: "published_at", sortOrder: "desc" }),
    ),
  ]);
  const labels = [
    "stats",
    "studio count",
    "instructor example",
    "studio example",
    "retreat example",
  ];
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Failed to load partners ${labels[index]}:`, result.reason);
    }
  });
  const [statsResult, countResult, instructorResult, studioResult, retreatResult] = results;
  const stats: PartnerStat[] = [];
  if (statsResult.status === "fulfilled") {
    const data = statsResult.value;
    stats.push(
      {
        value: data.total_public_workshops,
        description: `${plural(data.total_public_workshops, ["wydarzenie", "wydarzenia", "wydarzeń"])} z jogą w kalendarzu`,
      },
      {
        value: data.total_countries_with_public_retreats,
        description:
          data.total_countries_with_public_retreats === 1
            ? "kraj, w którym działamy"
            : `${plural(data.total_countries_with_public_retreats, ["kraj", "kraje", "krajów"])}, w których działamy`,
      },
      {
        value: data.total_public_retreats_in_poland,
        description: `${plural(data.total_public_retreats_in_poland, ["wyjazd", "wyjazdy", "wyjazdów"])} z jogą w Polsce`,
      },
    );
  }
  if (countResult.status === "fulfilled") {
    stats.push({
      value: countResult.value,
      description: `${plural(countResult.value, ["studio", "studia", "studiów"])} jogi`,
    });
  }

  const examples: PartnerExample[] = [];
  const instructor =
    instructorResult.status === "fulfilled" ? instructorResult.value[0] : undefined;
  if (instructor) {
    examples.push({
      kind: "instructor",
      heading: "Profil nauczyciela",
      name: instructor.name,
      subtitle: [
        instructor.yoga_styles?.[0]?.custom_name ?? instructor.yoga_styles?.[0]?.yoga_style?.name,
        instructor.cities?.[0]?.name,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/instruktor/${instructor.slug}`,
      imageId: instructor.image_id,
      action: "Zobacz profil",
    });
  }
  const studio = studioResult.status === "fulfilled" ? studioResult.value[0] : undefined;
  if (studio) {
    examples.push({
      kind: "studio",
      heading: "Strona studia",
      name: studio.name,
      subtitle: [studio.yoga_styles[0], studio.city].filter(Boolean).join(" · "),
      href: `/studio/${studio.slug}`,
      imageId: studio.image_id ?? studio.image_ids[0],
      action: "Zobacz studio",
    });
  }
  const retreat = retreatResult.status === "fulfilled" ? retreatResult.value.items[0] : undefined;
  if (retreat) {
    examples.push({
      kind: "retreat",
      heading: "Wyjazd jogowy",
      name: retreat.title,
      subtitle: ["Wyjazd", renderShortLocation(retreat.location)].filter(Boolean).join(" · "),
      href: `/wyjazdy/${retreat.slug}`,
      imageId: retreat.image_ids?.[0],
      action: "Zobacz wyjazd",
    });
  }
  return { stats, examples };
}
