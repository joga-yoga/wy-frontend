import { expect, test } from "@playwright/test";

import { getCertificateMark } from "../../src/components/page-contents/instructor/components/certificateMarks";

test("certificate marks accept common title variants and keep distinct credentials separate", () => {
  for (const [label, file] of [
    ["RYT200", "ryt-200"],
    ["  ryt 500  ", "ryt-500"],
    ["E-RYT200", "e-ryt-200"],
    ["E‑RYT 500", "e-ryt-500"],
    ["E RYT 200 (Yoga Alliance)", "e-ryt-200"],
    ["Szkolenie RYT200h", "ryt-200"],
    ["Registered Yoga Teacher (500 hours)", "ryt-500"],
    ["Experienced Registered Yoga Teacher 200", "e-ryt-200"],
    ["RYS200", "rys-200"],
    ["Yoga Alliance – RYS 300", "rys-300"],
    ["Registered Yoga School 500", "rys-500"],
    ["RCYT®", "rcyt"],
    ["Registered Children’s Yoga Teacher", "rcyt"],
    ["RPYT", "rpyt"],
    ["Registered Prenatal Yoga Teacher", "rpyt"],
    ["RCYS", "rcys"],
    ["Registered Children's Yoga School", "rcys"],
    ["RPYS", "rpys"],
    ["Registered Prenatal Yoga School", "rpys"],
    ["YACEP", "yacep"],
    ["Yoga Alliance Continuing Education Provider", "yacep"],
    ["Iyengar", "iyengar-certification-mark"],
    ["Joga Iyengara", "iyengar-certification-mark"],
    ["Certyfikat nauczyciela jogi Iyengara — Poziom II", "iyengar-certification-mark"],
    ["B.K.S. Iyengar Introductory II", "iyengar-certification-mark"],
    ["CIYT", "iyengar-certification-mark"],
  ]) {
    expect(getCertificateMark(label)).toBe(`/images/certificates/${file}.png`);
  }
  for (const label of [
    "",
    "200 hours",
    "RYT 300",
    "RYT2000",
    "RYT",
    "RYS",
    "Yoga Alliance",
    "Karma Yoga",
    "IYENGARIAN",
    "RYT500/YACEP",
    "RYT 200 / RYS 200",
  ]) {
    expect(getCertificateMark(label)).toBeNull();
  }
});

function expectCloseTo(value: number, expected: number, tolerance = 3) {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(tolerance);
}

test.describe("instructor profile hero", () => {
  test("scales the same hero system on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/instructor/hero-fixture");

    const heroCard = page.getByTestId("instructor-hero-card");
    const avatar = page.getByTestId("instructor-hero-avatar");
    const info = page.getByTestId("instructor-hero-info");
    const highlights = page.getByTestId("instructor-highlights");

    await expect(page.getByTestId("instructor-hero")).toBeVisible();
    await expect(highlights).toContainText("Asztanga");

    const heroCardBox = await heroCard.boundingBox();
    const avatarBox = await avatar.boundingBox();
    const infoBox = await info.boundingBox();

    expect(heroCardBox).not.toBeNull();
    expect(avatarBox).not.toBeNull();
    expect(infoBox).not.toBeNull();

    expect(heroCardBox!.width).toBeGreaterThan(900);
    expectCloseTo(heroCardBox!.height, 260);
    expectCloseTo(avatarBox!.width, 190);
    expectCloseTo(avatarBox!.height, 190);
    expectCloseTo(infoBox!.height, 196);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("does not render sample sections on a real instructor profile", async ({ page }) => {
    await page.goto("/instructor/hero-fixture");

    await expect(page.getByText("Dane przykładowe")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Zajęcia", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Wyjazdy", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Wydarzenia", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Zrealizowano", exact: true })).toHaveCount(0);
  });

  test("labels sample data only on the generated preview", async ({ page }) => {
    await page.goto("/instruktor/dodaj/preview/preview-fixture");

    await expect(page.getByText("Dane przykładowe").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wyjazdy", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wydarzenia", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zrealizowano", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zajęcia", exact: true })).toHaveCount(0);
  });
});
