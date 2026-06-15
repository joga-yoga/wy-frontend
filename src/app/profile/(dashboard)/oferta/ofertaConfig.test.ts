import assert from "node:assert/strict";

import {
  type DashboardItem,
  getOfertaFilterPills,
  getOfertaSingleTypeViewConfig,
} from "./ofertaConfig";

const classItem: DashboardItem = {
  id: "class-1",
  slug: "class-1",
  title: "Morning yoga",
  start_date: "2026-06-01",
  end_date: "2026-06-01",
  is_public: false,
  kind: "class",
};

const courseItem: DashboardItem = {
  id: "course-1",
  slug: "course-1",
  title: "Yoga foundations",
  is_public: true,
  kind: "course",
};

assert.deepEqual(
  getOfertaFilterPills(false).map((pill) => pill.key),
  ["all", "wyjazdy", "wydarzenia", "kursy"],
);

assert.deepEqual(
  getOfertaFilterPills(true).map(({ key, label }) => ({ key, label })),
  [
    { key: "all", label: "Wszystkie" },
    { key: "wyjazdy", label: "Wyjazdy" },
    { key: "wydarzenia", label: "Wydarzenia" },
    { key: "kursy", label: "Kursy" },
    { key: "zajecia", label: "Zajęcia" },
  ],
);

assert.equal(
  getOfertaSingleTypeViewConfig(
    "zajecia",
    { retreats: [], workshops: [], classes: [classItem], courses: [] },
    false,
  ),
  null,
);

assert.deepEqual(
  getOfertaSingleTypeViewConfig(
    "zajecia",
    { retreats: [], workshops: [], classes: [classItem], courses: [] },
    true,
  ),
  {
    items: [classItem],
    createPath: "/profile/classes/create",
    emptyLabel: "zajęć",
    countLabel: "1 zajęcie łącznie",
  },
);

assert.deepEqual(
  getOfertaSingleTypeViewConfig(
    "kursy",
    { retreats: [], workshops: [], classes: [], courses: [courseItem] },
    false,
  ),
  {
    items: [courseItem],
    createPath: "/profile/courses/create",
    emptyLabel: "kursów",
    countLabel: "1 kurs łącznie",
  },
);

assert.deepEqual(
  getOfertaSingleTypeViewConfig(
    "kursy",
    { retreats: [], workshops: [], classes: [], courses: [] },
    false,
  ),
  {
    items: [],
    createPath: "/profile/courses/create",
    emptyLabel: "kursów",
    countLabel: "0 kursów łącznie",
  },
);
