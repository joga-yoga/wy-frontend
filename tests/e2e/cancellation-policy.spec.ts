import { expect, type Page, test } from "@playwright/test";

async function setup(page: Page, soloSetup = false) {
  const writes: Record<string, unknown>[] = [];
  let policy = {
    cancellation_policy_mode: "by_time_of_day",
    cancellation_morning_deadline_time: "20:00:00",
    cancellation_afternoon_hours_before: 48,
  };
  await page.addInitScript(() => {
    localStorage.setItem(
      "access_token",
      `e30.${btoa(JSON.stringify({ sub: "owner", email: "owner@example.com" }))}.fixture`,
    );
  });
  await page.route(
    /https?:\/\/[^/]+\/(?:me|partner\/.*|studios\/policy-studio.*|notifications.*)(?:\?.*)?$/,
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      let json: unknown = {};
      if (path === "/me")
        json = {
          id: "owner",
          email: "owner@example.com",
          partner: { id: "partner", phone_verified: true },
        };
      else if (path === "/partner/me") json = { id: "partner", phone_verified: true };
      else if (path === "/partner/capabilities")
        json = {
          business_mode: soloSetup ? null : "studio",
          managed_studios: soloSetup ? [] : [{ id: "policy-studio", name: "Studio" }],
          teaching_studios: [],
          has_events: false,
          has_instructor_profile: true,
          landing_tab: "grafik",
        };
      else if (path === "/studios/policy-studio" || path === "/partner/solo-booking") {
        if (["PUT", "POST"].includes(route.request().method())) {
          const body = route.request().postDataJSON();
          writes.push(body);
          policy = { ...policy, ...body };
        }
        json = { id: "policy-studio", name: "Studio", ...policy };
      } else if (path.endsWith("/payment-providers"))
        json = { providers: [], previous: [], current: null };
      else if (path.startsWith("/notifications")) json = { items: [], unread_count: 0 };
      await route.fulfill({ json });
    },
  );
  const url = soloSetup
    ? "/account/partner/solo-booking"
    : "/account/partner/studio/policy-studio/payments";
  await page.goto(url);
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
  return { writes, url };
}

for (const width of [390, 1440])
  test(`cancellation clock edits preserve hours-before duration at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const { writes, url } = await setup(page);
    const time = page.getByLabel("Zajęcia poranne (start przed 12:00)", { exact: true });
    const hours = page.getByLabel("Zajęcia popołudniowe (start od 12:00)", { exact: true });
    await expect(time).toHaveValue("20:00");
    await expect(time).toHaveAttribute("type", "text");
    await expect(hours).toHaveValue("48");
    await expect(hours).toHaveAttribute("type", "number");
    for (const invalid of ["", "12:", "24:00", "12:60"]) {
      await time.fill(invalid);
      await time.blur();
      await page.getByRole("button", { name: "Zapisz", exact: true }).click();
      await expect(page.getByText("Wpisz godzinę w formacie HH:mm.")).toBeVisible();
      expect(writes).toHaveLength(0);
    }
    await time.fill("09:07");
    const trigger = page.getByRole("button", { name: "Wybierz godzinę", exact: true });
    await trigger.focus();
    await trigger.press("Enter");
    const chooser = page.getByRole("dialog", { name: "Wybierz godzinę i minutę" });
    await expect(chooser.getByRole("radio", { name: "Godziny: 09", exact: true })).toBeChecked();
    await expect(chooser.getByRole("radio", { name: "Minuty: 07", exact: true })).toBeChecked();
    await chooser.getByRole("radio", { name: "Godziny: 23", exact: true }).click();
    await chooser.getByRole("radio", { name: "Minuty: 17", exact: true }).click();
    await expect(time).toHaveValue("23:17");
    await page.screenshot({ path: info.outputPath(`clock-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await chooser.getByRole("button", { name: "Gotowe" }).click();
    await page.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({
      cancellation_policy_mode: "by_time_of_day",
      cancellation_morning_deadline_time: "23:17",
      cancellation_afternoon_hours_before: 48,
    });
    await page.goto(url);
    await expect(time).toHaveValue("23:17");
    await expect(hours).toHaveValue("48");
    await page.getByRole("button", { name: "Zawsze bezpłatnie", exact: true }).click();
    await page.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect.poll(() => writes.length).toBe(2);
    expect(writes[1]).toMatchObject({
      cancellation_policy_mode: "always_free",
      cancellation_morning_deadline_time: null,
      cancellation_afternoon_hours_before: null,
    });
  });

test("solo setup uses the shared clock and preserves zero hours before", async ({ page }) => {
  const { writes } = await setup(page, true);
  await page.getByRole("button", { name: "Wg pory zajęć", exact: true }).click();
  const time = page.getByLabel("Zajęcia poranne (start przed 12:00)", { exact: true });
  await time.fill("25:00");
  await page.getByLabel("Zajęcia popołudniowe (start od 12:00)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Zapisz ustawienia", exact: true }).click();
  expect(writes).toHaveLength(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await time.fill("00:01");
  await page.getByRole("button", { name: "Zapisz ustawienia", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Potwierdź i zapisz", exact: true })
    .click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({
    cancellation_policy_mode: "by_time_of_day",
    cancellation_morning_deadline_time: "00:01",
    cancellation_afternoon_hours_before: 0,
  });
});
