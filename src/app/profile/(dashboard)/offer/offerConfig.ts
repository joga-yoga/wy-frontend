export interface BaseEvent {
  id: string;
  slug: string;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  image_ids?: string[];
  image_id?: string;
  is_public: boolean;
}

export type DashboardItem = BaseEvent & { kind: "retreat" | "workshop" | "class" | "course" };

export type FilterType = "all" | "wyjazdy" | "wydarzenia" | "zajecia" | "kursy";

export const getOfferFilterPills = (
  includeClasses: boolean,
): { key: FilterType; label: string; logo?: string }[] => [
  { key: "all", label: "Wszystkie" },
  { key: "wyjazdy", label: "Wyjazdy", logo: "/images/logo/logo-retreats.png" },
  { key: "wydarzenia", label: "Wydarzenia", logo: "/images/logo/logo-workshops.png" },
  { key: "kursy", label: "Kursy", logo: "/images/logo/logo-courses.png" },
  ...(includeClasses ? [{ key: "zajecia" as const, label: "Zajęcia" }] : []),
];

export const isOfferFilterEnabled = (
  filter: string,
  includeClasses: boolean,
): filter is FilterType => getOfferFilterPills(includeClasses).some(({ key }) => key === filter);

export const getOfferCreatePath = (filter: string | null, includeClasses: boolean) => {
  if (filter === "wyjazdy") {
    return "/profile/retreats/create";
  }
  if (filter === "wydarzenia") {
    return "/profile/workshops/create";
  }
  if (filter === "kursy") {
    return "/profile/courses/create";
  }
  if (filter === "zajecia" && includeClasses) {
    return "/profile/classes/create";
  }
  return null;
};

function plPlural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export const getOfferSingleTypeViewConfig = (
  filter: FilterType,
  items: {
    retreats: DashboardItem[];
    workshops: DashboardItem[];
    classes: DashboardItem[];
    courses: DashboardItem[];
  },
  includeClasses: boolean,
) => {
  if (filter === "wyjazdy") {
    const n = items.retreats.length;
    return {
      items: items.retreats,
      createPath: "/profile/retreats/create",
      emptyLabel: "wyjazdów",
      countLabel: `${n} ${plPlural(n, "wyjazd", "wyjazdy", "wyjazdów")} łącznie`,
    };
  }

  if (filter === "wydarzenia") {
    const n = items.workshops.length;
    return {
      items: items.workshops,
      createPath: "/profile/workshops/create",
      emptyLabel: "wydarzeń",
      countLabel: `${n} ${plPlural(n, "wydarzenie", "wydarzenia", "wydarzeń")} łącznie`,
    };
  }

  if (filter === "kursy") {
    const n = items.courses.length;
    return {
      items: items.courses,
      createPath: "/profile/courses/create",
      emptyLabel: "kursów",
      countLabel: `${n} ${plPlural(n, "kurs", "kursy", "kursów")} łącznie`,
    };
  }

  if (filter === "zajecia" && includeClasses) {
    const n = items.classes.length;
    return {
      items: items.classes,
      createPath: "/profile/classes/create",
      emptyLabel: "zajęć",
      countLabel: `${n} ${plPlural(n, "zajęcie", "zajęcia", "zajęć")} łącznie`,
    };
  }

  return null;
};
