import { randomUUID } from "node:crypto";

import { expect, type Page, test as base } from "@playwright/test";

import { buildCookieConsent, COOKIE_CONSENT_STORAGE_KEY } from "../../src/lib/cookieConsent";
import { certificateOwnerToken } from "./certificate-fixture-api";

const test = base.extend<{ publicPage: Page }>({
  publicPage: async ({ browser, baseURL }, provide) => {
    const context = await browser.newContext({ baseURL });
    await context.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: COOKIE_CONSENT_STORAGE_KEY,
      value: JSON.stringify(buildCookieConsent({ analytics: false, marketing: false })),
    });
    try {
      await provide(await context.newPage());
    } finally {
      await context.close();
    }
  },
});

const fixtureApi = "http://127.0.0.1:4010";
const threeCertificates = [
  { name: "RYT200", image_id: null },
  { name: "RYT500", image_id: null },
  { name: "Karma Yoga", image_id: null },
];

async function prepareEditor(page: Page) {
  await page.addInitScript((token) => {
    localStorage.setItem("access_token", token);
  }, certificateOwnerToken);
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "res.cloudinary.com")
      return route.fulfill({ path: "public/images/certificates/ryt-200.png" });
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) return route.abort();
    if (!["8000", "8010", "4010"].includes(url.port)) return route.continue();
    if (/^\/instructors\/certificate-/.test(url.pathname)) {
      const response = await route.fetch({ url: `${fixtureApi}${url.pathname}` });
      return route.fulfill({ response });
    }
    let json: unknown = [];
    if (url.pathname === "/me")
      json = { id: "certificate-owner", email: "owner@example.com", partner: { id: "partner" } };
    else if (url.pathname === "/partner/me") json = { id: "partner", phone_verified: true };
    else if (url.pathname === "/partner/capabilities")
      json = { business_mode: "studio", managed_studios: [], teaching_studios: [] };
    else if (url.pathname === "/instructors/image-upload")
      json = { image_id: "uploaded-certificate-document" };
    return route.fulfill({ json });
  });
}

async function save(page: Page) {
  const button = page.getByRole("button", { name: "Zapisz profil", exact: true });
  await Promise.all([
    page.waitForResponse((response) => Boolean(response.request().headers()["next-action"])),
    button.click(),
  ]);
  await expect(button).toBeEnabled();
  await expect(
    page.getByText("Zmiany zostały pomyślnie zapisane.", { exact: true }).last(),
  ).toBeVisible();
}

async function certificateNames(page: Page, names: string[]) {
  const cards = page.locator("#certificates article");
  await expect(cards).toHaveCount(names.length);
  for (const [index, name] of names.entries()) await expect(cards.nth(index)).toContainText(name);
}

test("saved certificates immediately replace a warm public cache, including rename and empty lists", async ({
  page,
  publicPage,
  request,
}) => {
  const id = `certificate-${randomUUID()}`;
  await request.post(`${fixtureApi}/__certificates`, {
    data: { id, certificates: threeCertificates.slice(0, 1) },
  });
  await prepareEditor(page);
  await publicPage.goto(`/instruktor/${id}`);
  await certificateNames(publicPage, ["RYT200"]);
  await page.goto(`/account/partner/instructors/${id}/edit`);
  const fields = page.getByPlaceholder("Nazwa certyfikatu");
  await expect(fields).toHaveCount(1);
  for (const name of ["RYT500", "Karma Yoga"]) {
    await page.getByRole("button", { name: "Dodaj certyfikat", exact: true }).click();
    await fields.last().fill(name);
  }
  await save(page);
  await publicPage.reload();
  await certificateNames(
    publicPage,
    threeCertificates.map((item) => item.name),
  );
  const summary = publicPage.getByTestId("instructor-highlight-certificate");
  await expect(summary).toContainText("RYT200");
  await expect(summary).toContainText("+2");
  for (const width of [390, 1440]) {
    await publicPage.setViewportSize({ width, height: 844 });
    await expect(summary.getByText("+2", { exact: true })).toBeVisible();
    await summary.focus();
    await publicPage.keyboard.press("Enter");
    await expect(publicPage.locator("#certificates")).toBeInViewport();
    expect(
      await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy();
    await publicPage.screenshot({
      path: `/mnt/c/joga.yoga/output/playwright/certificates-profile-${width}.png`,
      fullPage: true,
    });
  }
  const longName = "Długie szkolenie nauczycielskie ".repeat(8);
  await fields.first().fill(longName);
  await save(page);
  await publicPage.reload();
  await publicPage.setViewportSize({ width: 390, height: 844 });
  const counter = publicPage
    .getByTestId("instructor-highlight-certificate")
    .getByText("+2", { exact: true });
  await expect(counter).toBeVisible();
  expect(
    (await counter.boundingBox())!.x + (await counter.boundingBox())!.width,
  ).toBeLessThanOrEqual(390);
  await fields.first().fill("RYT200");
  await page.getByRole("textbox", { name: /^Imię i nazwisko/ }).fill("Renamed Teacher");
  await save(page);
  await publicPage.goto(`/instruktor/${id}-renamed`);
  await certificateNames(
    publicPage,
    threeCertificates.map((item) => item.name),
  );
  // A renamed instructor must not leave their old cached profile publicly visible.
  await publicPage.goto(`/instruktor/${id}`);
  await expect(publicPage.locator("#certificates article")).toHaveCount(0);
  await expect(publicPage.getByRole("heading", { name: "This page couldn’t load" })).toHaveCount(0);
  const rows = fields.locator("xpath=../..");
  while (await fields.count()) await rows.last().getByRole("button").last().click();
  await save(page);
  await publicPage.goto(`/instruktor/${id}-renamed`);
  await expect(publicPage.locator("#certificates")).toHaveCount(0);
  await expect(publicPage.getByTestId("instructor-highlight-certificate")).toHaveCount(0);
  await page.getByRole("button", { name: "Dodaj certyfikat", exact: true }).click();
  await fields.first().fill("RYT500");
  await save(page);
  await publicPage.reload();
  await certificateNames(publicPage, ["RYT500"]);
  await expect(publicPage.getByTestId("instructor-highlight-certificate")).not.toContainText("+");
});

test("editor marks follow the label while uploaded documents retain priority", async ({
  page,
  publicPage,
  request,
}) => {
  test.setTimeout(60_000);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  publicPage.on("pageerror", (error) => browserErrors.push(error.message));
  const id = `certificate-${randomUUID()}`;
  await request.post(`${fixtureApi}/__certificates`, {
    data: { id, certificates: threeCertificates },
  });
  await prepareEditor(page);
  await page.goto(`/account/partner/instructors/${id}/edit`);
  await page.setViewportSize({ width: 390, height: 844 });
  const field = page.getByPlaceholder("Nazwa certyfikatu").first();
  const row = field.locator("xpath=../..");
  await expect(field).toHaveValue("RYT200");
  await expect(row.getByRole("img", { name: "Logo RYT200", exact: true })).toBeVisible();
  await page.screenshot({
    path: "/mnt/c/joga.yoga/output/playwright/certificates-editor-mobile.png",
    fullPage: true,
  });
  for (const [label, file] of [
    ["RYT200", "ryt-200"],
    ["RYT500", "ryt-500"],
    ["E‑RYT 200", "e-ryt-200"],
    ["E-RYT500", "e-ryt-500"],
    ["RYS200 (Yoga Alliance)", "rys-200"],
    ["RYS-300", "rys-300"],
    ["Registered Yoga School 500", "rys-500"],
    ["RCYT", "rcyt"],
    ["RPYT", "rpyt"],
    ["RCYS", "rcys"],
    ["RPYS", "rpys"],
    ["YACEP", "yacep"],
    ["Joga Iyengara", "iyengar-certification-mark"],
    ["Iyengar", "iyengar-certification-mark"],
    ["Certyfikat Iyengara — Poziom II", "iyengar-certification-mark"],
  ]) {
    await field.fill(label);
    const logo = row.getByRole("img", { name: `Logo ${label}`, exact: true });
    await expect(logo).toHaveAttribute("src", new RegExp(file));
    await expect
      .poll(() =>
        logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBeTruthy();
  }
  await field.fill("Karma Yoga");
  await expect(field.locator("xpath=../..").getByRole("img", { name: /^Logo / })).toHaveCount(0);
  await expect(row.getByText("Dodaj zdjęcie", { exact: true })).toBeVisible();
  await field.fill("RYT200");
  await row.locator('input[type="file"]').setInputFiles("public/images/certificates/ryt-500.png");
  await expect(row.getByRole("img", { name: "Preview", exact: true })).toHaveAttribute(
    "src",
    /uploaded-certificate-document/,
  );
  await field.fill("RYT500");
  await expect(row.getByRole("img", { name: "Preview", exact: true })).toBeVisible();
  await save(page);
  await publicPage.route("https://res.cloudinary.com/**", (route) =>
    route.fulfill({ path: "public/images/certificates/ryt-500.png" }),
  );
  await publicPage.goto("/instruktor/" + id);
  const firstPublicImage = publicPage.locator("#certificates article").first().locator("img");
  await expect(firstPublicImage).toHaveAttribute("src", /uploaded-certificate-document/);
  await expect
    .poll(() =>
      firstPublicImage.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    )
    .toBeTruthy();
  await row.getByRole("button", { name: "Usuń zdjęcie", exact: true }).click();
  await expect(row.getByRole("img", { name: "Logo RYT500", exact: true })).toBeVisible();
  const fields = page.getByPlaceholder("Nazwa certyfikatu");
  await fields.nth(0).fill("Certyfikat Jogi Iyengara");
  await fields.nth(1).fill("Yoga Alliance RYS200");
  await row.screenshot({
    path: "/mnt/c/joga.yoga/output/playwright/certificates-polish-editor.png",
  });
  await save(page);
  await publicPage.reload();
  await certificateNames(publicPage, [
    "Certyfikat Jogi Iyengara",
    "Yoga Alliance RYS200",
    "Karma Yoga",
  ]);
  for (const width of [390, 1440]) {
    await publicPage.setViewportSize({ width, height: 900 });
    for (const [index, file] of ["iyengar-certification-mark", "rys-200"].entries()) {
      const image = publicPage.locator("#certificates article").nth(index).locator("img");
      await expect(image).toHaveAttribute("src", new RegExp(file));
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
          ),
        )
        .toBeTruthy();
    }
    await expect(publicPage.locator("#certificates article").nth(2).locator("img")).toHaveCount(0);
    await publicPage.locator("#certificates").screenshot({
      path: "/mnt/c/joga.yoga/output/playwright/certificates-variants-" + width + ".png",
    });
  }
  const state = await (await request.get(fixtureApi + "/__certificates/" + id)).json();
  expect(
    state.profile.certificates.map(
      (certificate: { image_id: string | null }) => certificate.image_id,
    ),
  ).toEqual([null, null, null]);
  expect(browserErrors).toEqual([]);
});

test("publication refreshes cached certificates and refresh failure does not repeat a successful save", async ({
  page,
  publicPage,
  request,
}) => {
  const id = `certificate-${randomUUID()}`;
  await request.post(`${fixtureApi}/__certificates`, {
    data: { id, certificates: threeCertificates, is_published: false },
  });
  await prepareEditor(page);
  await publicPage.goto(`/instruktor/${id}`);
  await expect(publicPage.locator("#certificates")).toHaveCount(0);
  await page.goto(`/account/partner/instructors/${id}/edit`);
  await page.getByRole("button", { name: "Opublikuj profil", exact: true }).click();
  await expect(
    page.getByText("Publiczna strona nauczyciela jogi jest już dostępna.", { exact: true }),
  ).toBeVisible();
  await publicPage.reload();
  await certificateNames(
    publicPage,
    threeCertificates.map((item) => item.name),
  );
  await request.post(`${fixtureApi}/__certificates/${id}`, { data: { denyRead: true } });
  await page.getByPlaceholder("Nazwa certyfikatu").first().fill("Changed certificate");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await expect(
    page.getByText(/^Zmiany zapisano, ale nie udało się odświeżyć/).first(),
  ).toBeVisible();
  const state = await (await request.get(`${fixtureApi}/__certificates/${id}`)).json();
  expect(state.writes).toBe(1);
  expect(state.profile.certificates[0].name).toBe("Changed certificate");
  await publicPage.reload();
  await certificateNames(
    publicPage,
    threeCertificates.map((item) => item.name),
  );
});
