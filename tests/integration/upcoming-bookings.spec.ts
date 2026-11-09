import { expect, test } from "@playwright/test";

import type { MyBookingItem } from "../../src/app/account/types";

test("upcoming classes use stable timestamp order, preserve other sections and open their booking", async ({
  page,
}, info) => {
  const booking = (
    id: string,
    start_time: string | null,
    extra: Partial<MyBookingItem> = {},
  ): MyBookingItem => ({
    booking_id: id,
    occurrence_id: `session-${id}`,
    event_title: id,
    event_type: "class",
    studio_name: "Studio testowe",
    start_time,
    status: "booked",
    funding: "drop_in",
    is_past: false,
    color: "green",
    duration_minutes: 60,
    ...extra,
  });
  let bookings = [
    booking("Dalszy dzień", "2099-11-12T08:00:00Z"),
    booking("Brak daty", null),
    booking("Później tego dnia", "2099-11-10T10:00:00Z"),
    booking("Remis A", "2099-11-10T09:00:00Z"),
    booking("Niepoprawna data", "invalid"),
    booking("Najbliższe", "2099-11-10T09:00:00+02:00"),
    booking("Kolejny dzień", "2099-11-11T08:00:00Z"),
    booking("Remis B", "2099-11-10T10:00:00+01:00"),
    booking("Minione B", "2020-11-12T08:00:00Z", { is_past: true }),
    booking("Minione A", "2020-11-10T08:00:00Z", { is_past: true }),
    booking("Odwołane", "2099-11-09T08:00:00Z", { status: "cancelled" }),
    booking("Wyjazd B", "2099-11-12T08:00:00Z", { event_type: "retreat" }),
    booking("Wyjazd A", "2099-11-10T08:00:00Z", { event_type: "workshop" }),
  ];
  let inquiries = ["Zapytanie B", "Zapytanie A"].map((event_title, index) => ({
    id: `inquiry-${index}`,
    kind: "event",
    status: "open",
    event_title,
    event_type: "retreat",
    created_at: "2099-11-09T08:00:00Z",
    is_past: false,
  }));
  await page.addInitScript(() => {
    localStorage.setItem("access_token", `e30.${btoa(JSON.stringify({ sub: "viewer" }))}.fixture`);
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) return route.abort();
    if (url.port !== "8000") return route.continue();
    expect(route.request().method()).toBe("GET");
    let json: unknown = [];
    if (url.pathname === "/me") json = { id: "viewer", email: "viewer@example.com" };
    if (url.pathname === "/users/me/bookings")
      json = {
        bookings,
        inquiries,
        upcoming_count: bookings.length,
        inquiry_count: inquiries.length,
      };
    if (url.pathname.startsWith("/bookings/"))
      json = { id: "Najbliższe", occurrence_id: "session-nearest", status: "booked" };
    if (url.pathname === "/public/occurrences/session-nearest/detail")
      json = {
        id: "session-nearest",
        template_title: "Najbliższe",
        start_time: "2099-11-10T07:00:00Z",
        end_time: "2099-11-10T08:00:00Z",
        status: "scheduled",
        studio: { id: "studio", name: "Studio testowe", passes: [], sport_card_acceptances: [] },
      };
    await route.fulfill({ json });
  });
  const upcoming = page.locator("section").filter({ hasText: "Nadchodzące zajęcia" });
  const past = page.locator("section").filter({ hasText: "Minione" });
  const trips = page.locator("section").filter({ hasText: "Wyjazdy i wydarzenia" });
  const expected = [
    "Najbliższe",
    "Remis A",
    "Remis B",
    "Później tego dnia",
    "Kolejny dzień",
    "Dalszy dzień",
    "Brak daty",
    "Niepoprawna data",
  ];
  for (const width of [390, 360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/account/bookings");
    const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
    if (await cookies.isVisible()) await cookies.click();
    await expect(upcoming.getByRole("button").locator("p.font-semibold")).toHaveText(expected);
    await expect(past.getByRole("button").locator("p.font-semibold")).toHaveText([
      "Minione B",
      "Minione A",
    ]);
    await expect(trips.locator("p.truncate.font-semibold")).toHaveText([
      "Wyjazd B",
      "Wyjazd A",
      "Zapytanie B",
      "Zapytanie A",
    ]);
    await expect(page.getByText("Odwołane", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: info.outputPath(`bookings-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await upcoming.getByRole("button").first().click();
  await expect(page).toHaveURL(/\/account\/bookings\/Najbli/);
  await expect(page.getByRole("heading", { name: "Najbliższe", exact: true })).toBeVisible();
  bookings = [booking("Jedne zajęcia", "2099-11-10T09:00:00Z")];
  inquiries = [];
  await page.goto("/account/bookings");
  await expect(upcoming.getByRole("button")).toHaveCount(1);
  bookings = [];
  await page.reload();
  await expect(page.getByText("Brak rezerwacji.", { exact: true })).toBeVisible();
});
