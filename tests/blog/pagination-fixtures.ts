import { articleFixtures } from "../../src/app/(public)/blog/fixtures";

// A third, partial page exercises boundaries while keeping the familiar article fixtures.
export const paginationArticles = [
  ...articleFixtures,
  ...Array.from({ length: 22 }, (_, index) => ({
    ...articleFixtures[0],
    slug: `pagination-${String(index + 1).padStart(2, "0")}`,
    title: `Artykuł do paginacji ${index + 1}`,
    canonical_url: `https://joga.yoga/blog/pagination-${String(index + 1).padStart(2, "0")}`,
  })),
];
