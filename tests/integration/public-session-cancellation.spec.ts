import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

interface Slot {
  id: string;
  title: string;
  class_slug: string;
}

interface Fixtures {
  studio_slug: string;
  instructor_slug: string;
  other_instructor_slug: string;
  today: Slot;
  tomorrow: Slot;
  distant: Slot;
  active: Slot;
}

const path = process.env.CANCELLATION_PUBLIC_FIXTURES;
const fixtures: Fixtures | null = path ? JSON.parse(readFileSync(path, "utf8")) : null;

async function expectCancelledDrawer(page: Page, title: string) {
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByText("Te zajęcia zostały odwołane")).toBeVisible();
  await expect(drawer.getByRole("heading", { name: title, exact: true }).last()).toBeVisible();
  await expect(drawer.getByText("Wolne miejsca")).toHaveCount(0);
  await expect(drawer.getByRole("button", { name: "Zarezerwuj" })).toHaveCount(0);
}

test.use({ timezoneId: "America/Los_Angeles" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "wy.cookie_consent.v1",
      JSON.stringify({ analytics: false, marketing: false }),
    );
  });
});

test("public schedules open and restore the exact cancellation on the correct profile", async ({
  page,
}) => {
  test.skip(!fixtures, "Set CANCELLATION_PUBLIC_FIXTURES to isolated public schedule fixtures.");
  const data = fixtures!;
  const studio = `/studio/${data.studio_slug}`;
  const instructor = `/instruktor/${data.instructor_slug}`;
  await page.goto(`${studio}/grafik?source=fixture`);
  await page.getByRole("button").filter({ hasText: data.today.title }).click();
  await expect(page).toHaveURL(new RegExp(`source=fixture&occurrence=${data.today.id}$`));
  await expectCancelledDrawer(page, data.today.title);
  await page.reload();
  await expectCancelledDrawer(page, data.today.title);
  await page.getByRole("dialog").getByRole("button", { name: "Zamknij", exact: true }).click();
  await expect(page).toHaveURL(/\?source=fixture$/);

  await page.goto(studio);
  const preview = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Najbliższe zajęcia",
      exact: true,
    }),
  });
  await expect(preview).toHaveCount(1);
  await expect(preview.getByRole("button")).toHaveCount(3);
  await preview.getByRole("button").filter({ hasText: data.tomorrow.title }).click();
  await expect(page).toHaveURL(new RegExp(`occurrence=${data.tomorrow.id}$`));
  await expectCancelledDrawer(page, data.tomorrow.title);

  for (const surface of [
    studio,
    `${studio}/grafik`,
    instructor,
    `${instructor}/grafik`,
    `${studio}/zajecia/${data.distant.class_slug}`,
  ]) {
    await page.goto(`${surface}?occurrence=${data.distant.id}`);
    await expectCancelledDrawer(page, data.distant.title);
  }

  await page.goto(`/instruktor/${data.other_instructor_slug}/grafik?occurrence=${data.distant.id}`);
  await expect(page.getByRole("dialog").getByText("Nie znaleziono zajęć.")).toBeVisible();
  await expect(page.getByRole("dialog").getByText(data.distant.title)).toHaveCount(0);
});

test("saved checkout explains a cancellation before login", async ({ page }) => {
  test.skip(!fixtures, "Set CANCELLATION_PUBLIC_FIXTURES to isolated public schedule fixtures.");
  const data = fixtures!;
  const fundingRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/booking-options"))
      fundingRequests.push(request.url());
  });

  await page.goto(`/book/class/${data.distant.id}`);
  await expect(page.getByRole("heading", { name: "Odwołane", exact: true })).toBeVisible();
  await expect(page.getByText(data.distant.title, { exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/book/class/${data.distant.id}$`));
  expect(fundingRequests).toHaveLength(0);

  await page.goto(`/book/class/${data.active.id}`);
  await expect(page).toHaveURL(/\/account\/login\?next=/);
});
