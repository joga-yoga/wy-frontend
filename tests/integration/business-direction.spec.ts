import { expect, type Page, test } from "@playwright/test";

/** Browser-scoped API fixtures: no accounts, studios or other shared data are written. */
async function directionSession(page: Page, hasInstructorProfile = true) {
  const state = {
    mode: null as "studio" | "solo" | null,
    writes: [] as string[],
    soloSaves: 0,
    studioSaves: 0,
  };
  const studio = {
    id: "direction-studio",
    name: "Studio testowe",
    slug: "studio-testowe",
    status: "claimed",
    is_listed: false,
    rooms: [],
    passes: [],
    sport_card_acceptances: [],
    amenity_ids: [],
    instructor_links: [],
    social_links: [],
    image_ids: [],
  };
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ sub: "direction-user", email: "ui@example.com" }));
    localStorage.setItem("access_token", `e30.${payload}.fixture`);
  });
  await page.route("http://localhost:8000/**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") state.writes.push(path);
    let json: unknown = [];
    if (path === "/me")
      json = {
        id: "direction-user",
        email: "ui@example.com",
        name: "Osoba testowa",
        partner: { id: "direction-partner", phone_verified: true },
      };
    else if (path === "/partner/me") json = { id: "direction-partner", phone_verified: true };
    else if (path === "/partner/capabilities")
      json = {
        business_mode: state.mode,
        solo_studio_id: state.mode === "solo" ? studio.id : null,
        self_instructor_id: hasInstructorProfile ? "direction-instructor" : null,
        managed_studios: state.mode === "studio" ? [studio] : [],
        teaching_studios: [],
        has_events: false,
        has_instructor_profile: hasInstructorProfile,
        landing_tab: "rezerwacje",
      };
    else if (path === "/studio-setup/duplicates")
      json = { matches: [], fingerprint: "empty", requires_choice: false };
    else if (path === `/studios/${studio.id}`) json = studio;
    else if (path.includes("unread-count")) json = { unread_count: 0 };
    else if (path.includes("invitations")) json = { items: [], unread_count: 0 };
    else if (path === "/studio-migrations/transfer-offer")
      json = { enabled: false, eligible: false, visible: false };
    else if (path === "/partner/solo-booking" || path === "/studio-setup/save") {
      const solo = path === "/partner/solo-booking";
      const attempt = solo ? ++state.soloSaves : ++state.studioSaves;
      if (attempt === 1)
        return route.fulfill({
          status: 500,
          json: { detail: "Nie udało się zapisać. Spróbuj ponownie." },
        });
      state.mode = solo ? "solo" : "studio";
      json = solo ? { studio_id: studio.id, instructor_id: "direction-instructor" } : studio;
    }
    return route.fulfill({ json });
  });
  return state;
}

test("cards match the responsive layout, cancel restores focus and only confirmation navigates", async ({
  page,
}, info) => {
  const state = await directionSession(page, false);
  await page.goto("/account/partner/menu");
  const cookies = page.getByRole("button", { name: "Tylko niezbędne", exact: true });
  if (await cookies.isVisible()) await cookies.click();
  const studio = page.getByRole("button", { name: /^Utwórz studio/ });
  const solo = page.getByRole("button", { name: /^Solo Instruktor/ });
  for (const width of [390, 320, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(studio).toBeVisible();
    await expect(solo).toBeVisible();
    const left = await studio.boundingBox();
    const right = await solo.boundingBox();
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(right!.y).toBeCloseTo(left!.y, 0);
    expect(right!.height).toBeCloseTo(left!.height, 0);
    expect(right!.width).toBeCloseTo(left!.width, 0);
    expect(right!.x - left!.x - left!.width).toBeCloseTo(16, 0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    for (const card of [studio, solo]) {
      const image = card.locator("img");
      await expect(image).toBeVisible();
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
      expect(await image.getAttribute("src")).toContain("%2Fimages%2Flogo%2Flogo-");
    }
    await page.screenshot({ path: info.outputPath(`directions-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await studio.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCount(1);
  await expect(dialog).toContainText("Zarządzanie studiem");
  await dialog.getByRole("button", { name: "Wróć", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(studio).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(studio).toBeFocused();
  await studio.click();
  await dialog.getByRole("button", { name: "Zamknij", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(studio).toBeFocused();
  expect(state.writes).toEqual([]);
  expect(state.mode).toBeNull();
  await studio.click();
  await expect(dialog).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: info.outputPath("direction-confirmation-mobile.png"),
    animations: "disabled",
  });
  await dialog.getByRole("button", { name: "Potwierdź i kontynuuj" }).click();
  await expect(page.getByRole("heading", { name: "Znajdź swoje studio" })).toBeVisible();
  expect(state.writes).toEqual([]);
  expect(state.mode).toBeNull();
  await page.goto("/account/partner/menu");
  await solo.click();
  await expect(dialog).toContainText("Własny grafik zajęć");
  await dialog.getByRole("button", { name: "Potwierdź i kontynuuj" }).click();
  await expect(
    page.getByRole("heading", { name: "Uzupełnij swój profil instruktora" }),
  ).toBeVisible();
  expect(state.mode).toBeNull();
  expect(state.writes).toEqual([]);
});

test("direct solo setup and failed-save retry have no direction warning", async ({ page }) => {
  const state = await directionSession(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/account/partner/solo-booking");
  const save = page.getByRole("button", { name: "Zapisz ustawienia", exact: true });
  await expect(save).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await save.click();
  await expect.poll(() => state.soloSaves).toBe(1);
  await expect(save).toBeEnabled();
  expect(state.mode).toBeNull();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await save.click();
  await expect(page).toHaveURL(/\/account\/partner\/menu$/);
  expect(state.soloSaves).toBe(2);
  expect(state.mode).toBe("solo");
  await expect(page.getByRole("button", { name: /^Solo Instruktor/ })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("direct studio setup saves and retries without a direction warning", async ({ page }) => {
  const state = await directionSession(page);
  await page.goto("/account/partner/studio/create?step=manual&setup=direction-fixture");
  const name = page.getByRole("textbox", { name: "Nazwa studia", exact: true });
  await name.fill("Studio testowe");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const save = page.getByRole("button", { name: "Zapisz", exact: true });
  await save.click();
  await expect.poll(() => state.studioSaves).toBe(1);
  await expect(save).toBeEnabled();
  expect(state.mode).toBeNull();
  await expect(name).toHaveValue("Studio testowe");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await save.click();
  await expect(page).toHaveURL(/\/studio\/direction-studio\/edit$/);
  expect(state.studioSaves).toBe(2);
  expect(state.mode).toBe("studio");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
