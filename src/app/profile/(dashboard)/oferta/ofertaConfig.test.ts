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

assert.deepEqual(
  getOfertaFilterPills(false).map((pill) => pill.key),
  ["all", "wyjazdy", "wydarzenia"],
);

assert.deepEqual(
  getOfertaFilterPills(true).map(({ key, label }) => ({ key, label })),
  [
    { key: "all", label: "Wszystkie" },
    { key: "wyjazdy", label: "Wyjazdy" },
    { key: "wydarzenia", label: "Wydarzenia" },
    { key: "zajecia", label: "Zajęcia" },
  ],
);

assert.equal(
  getOfertaSingleTypeViewConfig(
    "zajecia",
    { retreats: [], workshops: [], classes: [classItem] },
    false,
  ),
  null,
);

assert.deepEqual(
  getOfertaSingleTypeViewConfig(
    "zajecia",
    { retreats: [], workshops: [], classes: [classItem] },
    true,
  ),
  {
    items: [classItem],
    createPath: "/profile/classes/create",
    emptyLabel: "zajęć",
    countLabel: "1 zajęcia łącznie",
  },
);
