import { readFileSync } from "node:fs";

import { type BrowserContext, expect, test } from "@playwright/test";

interface Identity {
  token: string;
  name: string;
  studio_id?: string;
}

// Two fresh, verified local accounts without self profiles; studio already owns one studio.
// This test never seeds/resets the database or invokes invitation/verification delivery.
const fixturePath = process.env.SOLO_ONBOARDING_IDENTITIES;
const fixtures: { api_url: string; solo: Identity; studio: Identity } | undefined = fixturePath
  ? JSON.parse(readFileSync(fixturePath, "utf8"))
  : undefined;
const apiUrl = "http://localhost:8000";

async function capabilities(context: BrowserContext, identity: Identity) {
  const response = await context.request.get(`${apiUrl}/partner/capabilities`, {
    headers: { Authorization: `Bearer ${identity.token}` },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test.beforeEach(async ({ context, page }) => {
  test.skip(!fixtures, "Set SOLO_ONBOARDING_IDENTITIES to fresh local test accounts.");
  expect(fixtures!.api_url).toBe(apiUrl);
  page.setDefaultTimeout(20_000);
  // The local dev indicator otherwise overlaps the pinned save button on mobile.
  await context.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.appendChild(style);
    });
  });
  // Keep the journeys local and prevent accidental delivery/payment actions.
  await context.route(/\/partner\/(?:send|verify)|\/instructors\/resolve|\/payments\//, (route) => {
    const request = route.request();
    if (request.url().endsWith("/instructors/resolve") && !request.postDataJSON()?.email)
      return route.continue();
    return route.abort();
  });
});

test("solo entry edits self directly, reuses it and commits mode only after setup confirmation", async ({
  context,
  page,
}, testInfo) => {
  const identity = fixtures!.solo;
  await page.setViewportSize({ width: 390, height: 844 });
  await context.addInitScript(
    (token) => localStorage.setItem("access_token", token),
    identity.token,
  );
  const initial = await capabilities(context, identity);
  expect(initial.business_mode).toBeNull();
  expect(initial.self_instructor_id).toBeNull();
  let selfRequests = 0;
  let businessRequests = 0;
  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    if (request.url() === `${apiUrl}/instructors/self`) selfRequests++;
    if (request.url() === `${apiUrl}/partner/solo-booking`) businessRequests++;
  });
  await page.goto("/account/partner/menu");
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
  await page.getByRole("link", { name: /Włącz zapisy na moje zajęcia/ }).click();
  await expect(
    page.getByRole("heading", { name: "Uzupełnij swój profil instruktora" }),
  ).toBeVisible();
  const name = page.getByRole("textbox", { name: "Imię i nazwisko *", exact: true });
  await expect(name).toHaveValue(identity.name);
  await expect(page.getByText(/To ja —/)).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: /E-mail instruktora/ })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("solo-profile-mobile.png") });
  const opened = await capabilities(context, identity);
  expect(opened.self_instructor_id).toBeNull();
  expect(opened.business_mode).toBeNull();
  expect(selfRequests).toBe(0);
  await name.fill("");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await expect(page.getByText("Imię i nazwisko jest wymagane", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Wróć do menu" }).click();
  expect((await capabilities(context, identity)).self_instructor_id).toBeNull();
  await page.getByRole("link", { name: /Włącz zapisy na moje zajęcia/ }).click();
  await expect(name).toHaveValue(identity.name);
  await name.fill("Alicja Instruktorka Testowa");
  await page
    .getByRole("textbox", { name: /Twoje zdanie o sobie/ })
    .fill("Prowadzę własne zajęcia testowe.");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/partner\/solo-booking$/);
  await expect(page.getByRole("button", { name: "Zapisz ustawienia" })).toBeVisible();
  const profile = await capabilities(context, identity);
  expect(profile.business_mode).toBeNull();
  expect(profile.self_instructor_id).toBeTruthy();
  expect(selfRequests).toBe(1);
  const savedProfile = await context.request.get(
    `${apiUrl}/instructors/${profile.self_instructor_id}`,
    {
      headers: { Authorization: `Bearer ${identity.token}` },
    },
  );
  expect(savedProfile.ok()).toBeTruthy();
  expect(await savedProfile.json()).toMatchObject({
    name: "Alicja Instruktorka Testowa",
    short_bio: "Prowadzę własne zajęcia testowe.",
    languages: ["pl"],
  });
  await page.getByRole("button", { name: "Zapisz ustawienia" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Własny grafik zajęć", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Wróć", exact: true }).click();
  expect(businessRequests).toBe(0);
  expect((await capabilities(context, identity)).business_mode).toBeNull();

  // Re-entering with an existing self profile goes straight to business settings.
  await page.goto("/account/partner/menu");
  await page.getByRole("link", { name: /Włącz zapisy na moje zajęcia/ }).click();
  await expect(page.getByRole("button", { name: "Zapisz ustawienia" })).toBeVisible();
  // Old solo profile URLs also reuse the same identity instead of creating a duplicate.
  await page.goto("/account/partner/instructors/create?returnTo=solo");
  await expect(name).toHaveValue("Alicja Instruktorka Testowa");
  expect(selfRequests).toBe(1);
  expect((await capabilities(context, identity)).self_instructor_id).toBe(
    profile.self_instructor_id,
  );
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/partner\/solo-booking$/);
  await page.getByRole("button", { name: "Zapisz ustawienia" }).click();
  await dialog.getByRole("button", { name: "Potwierdź i zapisz" }).click();
  await expect(page).toHaveURL(/\/account\/partner\/menu$/);
  const configured = await capabilities(context, identity);
  expect(configured.business_mode).toBe("solo");
  expect(configured.self_instructor_id).toBe(profile.self_instructor_id);
  expect(configured.solo_studio_id).toBeTruthy();
  expect(businessRequests).toBe(1);
});

test("ordinary studio addition preserves email, other-instructor and self roster paths", async ({
  context,
  page,
}, testInfo) => {
  const identity = fixtures!.studio;
  await context.addInitScript(
    (token) => localStorage.setItem("access_token", token),
    identity.token,
  );
  expect((await capabilities(context, identity)).self_instructor_id).toBeNull();
  // The unscoped studio entry retains its existing self/other choices too.
  await page.goto("/account/partner/instructors/create");
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
  await expect(
    page.getByRole("main").getByRole("heading", { name: "Dodaj instruktora" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "E-mail instruktora", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /To ja —/ })).toBeVisible();

  const addUrl = `/account/partner/instructors/create?studioId=${identity.studio_id}`;
  await page.goto(addUrl);
  await expect(page.getByRole("button", { name: /To ja —/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("studio-add-instructor.png") });
  await page
    .getByRole("textbox", { name: "Imię i nazwisko lub email" })
    .fill("nobody-onboarding@example.com");
  await expect(page.getByRole("button", { name: "Utwórz nowy profil" })).toBeVisible();
  await page.getByRole("button", { name: "Dodaj bez zaproszenia (bez emaila)" }).click();
  await page
    .getByRole("textbox", { name: "Imię i nazwisko", exact: true })
    .fill("Instruktor Gościnny Testowy");
  await page.getByRole("button", { name: "Dodaj instruktora", exact: true }).click();
  await expect(page.getByText("Instruktor Gościnny Testowy", { exact: true })).toBeVisible();
  await page.goto(addUrl);
  await page.getByRole("button", { name: /To ja —/ }).click();
  await expect(page).toHaveURL(/\/instructors\/[^/]+\/edit$/);
  await expect(page.getByRole("textbox", { name: "Imię i nazwisko *", exact: true })).toBeVisible();
  const caps = await capabilities(context, identity);
  expect(caps.business_mode).toBe("studio");
  expect(caps.self_instructor_id).toBeTruthy();
  const roster = await context.request.get(`${apiUrl}/studios/${identity.studio_id}/roster`, {
    headers: { Authorization: `Bearer ${identity.token}` },
  });
  expect(roster.ok()).toBeTruthy();
  const { items } = await roster.json();
  expect(items).toHaveLength(2);
  expect(items.find((item: { id: string }) => item.id === caps.self_instructor_id)).toMatchObject({
    row_state: "self",
    link_status: "accepted",
  });
});
