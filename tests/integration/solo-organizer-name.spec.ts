import { existsSync, readFileSync } from "node:fs";

import { type Browser, expect, test } from "@playwright/test";

interface Identity {
  token: string;
}
interface Fixtures {
  owner: Identity;
  student: Identity;
  instructor_id: string;
  slug: string;
  purchases: string[];
  bookings: string[];
  passes: string[];
  own_occurrence_ids: string[];
}

const fixturePath = process.env.SOLO_ORGANIZER_FIXTURES;
const fixtures: Fixtures | undefined = fixturePath
  ? JSON.parse(readFileSync(fixturePath, "utf8"))
  : undefined;
const apiUrl = process.env.INTEGRATION_API_URL ?? "http://localhost:18000";

async function signedIn(browser: Browser, identity: Identity) {
  const context = await browser.newContext({ locale: "pl-PL", timezoneId: "Europe/Warsaw" });
  await context.addInitScript(
    (token) => localStorage.setItem("access_token", token),
    identity.token,
  );
  return context;
}

test("existing customer cards, details and inbox follow public renames on desktop and mobile", async ({
  browser,
}) => {
  test.skip(
    !fixtures,
    "Set SOLO_ORGANIZER_FIXTURES to isolated name-regression fixture identities.",
  );
  const fixture = fixtures!;
  const owner = await signedIn(browser, fixture.owner);
  const student = await signedIn(browser, fixture.student);
  try {
    const page = await student.newPage();
    const inbox = await owner.newPage();
    for (const [name, width] of [
      ["Maria Solo Instructor", 1280],
      ["Maria Nowe Nazwisko", 390],
    ] as const) {
      const renamed = await owner.request.put(`${apiUrl}/instructors/${fixture.instructor_id}`, {
        headers: { Authorization: `Bearer ${fixture.owner.token}` },
        data: { name, slug: fixture.slug },
      });
      expect(renamed.ok()).toBeTruthy();
      await page.setViewportSize({ width, height: 844 });
      // The hub intentionally previews only the newest wallet (the ordinary studio
      // purchase in this fixture). Full lists below include both organizer kinds.
      await page.goto("/account");
      await expect(page.getByText("Studio Kontrolne", { exact: true })).toBeVisible();
      await expect(page.getByText(/legacy-organizer-setup-label/)).toHaveCount(0);
      for (const path of ["/account/bookings", "/account/passes"]) {
        await page.goto(path);
        const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
        if (await cookies.isVisible()) await cookies.click();
        await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
        await page.reload();
        await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
        await expect(page.getByText("Studio Kontrolne", { exact: true }).first()).toBeVisible();
        await expect(page.getByText(/legacy-organizer-setup-label/)).toHaveCount(0);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        ).toBeTruthy();
        await page.screenshot({
          path: `/tmp/joga-solo-acceptance/organizer-${width}-${path.split("/").at(-1)}.png`,
        });
      }
      await page.goto(`/account/bookings/${fixture.bookings[0]}`);
      await expect(page.getByText(`${name} · Własne zajęcia`, { exact: true })).toBeVisible();
      await expect(page.getByText(/legacy-organizer-setup-label/)).toHaveCount(0);
      await page.goto(`/account/passes/${fixture.purchases[0]}`);
      await expect(page.getByText(name, { exact: true })).toBeVisible();
      await expect(page.getByText(name, { exact: false }).last()).toContainText(name);
      await page.goto(`/book/class/${fixture.own_occurrence_ids[1]}`);
      await expect(
        page.getByText("Joga własna — nazwa organizatora", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText(/legacy-organizer-setup-label/)).toHaveCount(0);
      await page.goto(`/book/pass/${fixture.passes[0]}`);
      await expect(page.getByText("Karnet własny — nazwa", { exact: true })).toBeVisible();
      await expect(page.getByText(/legacy-organizer-setup-label/)).toHaveCount(0);
      await inbox.setViewportSize({ width, height: 844 });
      await inbox.goto("/account/partner/menu");
      const cookies = inbox.getByRole("button", { name: "Tylko niezbędne" });
      if (await cookies.isVisible()) await cookies.click();
      await inbox.getByRole("button", { name: /^Powiadomienia/ }).click();
      const notifications = inbox.getByRole("button", {
        name: new RegExp(`Nadano dostęp: ${name}`),
      });
      // Both existing grants (public Instructor and internal solo carrier) must
      // show the current public name, not just the already-correct profile row.
      await expect(notifications).toHaveCount(2);
      const notification = notifications.first();
      await expect(notification).toBeVisible();
      await notification.click();
      await expect(
        inbox.getByText(`Otrzymano dostęp do: ${name} (rola: owner).`, { exact: true }),
      ).toBeVisible();
      await expect(inbox.getByText(/legacy-organizer-setup-label/)).toHaveCount(0);
      await inbox.screenshot({ path: `/tmp/joga-solo-acceptance/organizer-${width}-inbox.png` });
      const headers = { Authorization: `Bearer ${fixture.student.token}` };
      const bookings = await (
        await student.request.get(`${apiUrl}/users/me/bookings`, { headers })
      ).json();
      expect(bookings.bookings.map((row: { booking_id: string }) => row.booking_id).sort()).toEqual(
        [...fixture.bookings].sort(),
      );
      const passes = await (
        await student.request.get(`${apiUrl}/users/me/passes`, { headers })
      ).json();
      expect(passes.map((row: { id: string }) => row.id).sort()).toEqual(
        [...fixture.purchases].sort(),
      );
    }
  } finally {
    // Leave synthetic fixtures reusable; do not touch the requester's Maria account.
    await owner.request.put(`${apiUrl}/instructors/${fixture.instructor_id}`, {
      headers: { Authorization: `Bearer ${fixture.owner.token}` },
      data: { name: "Maria Solo Instructor", slug: fixture.slug },
    });
    await student.close();
    await owner.close();
  }
});

test("actual local fallback email HTML shows the resolved organizer on mobile", async ({
  page,
}) => {
  const directory = process.env.SOLO_ORGANIZER_EMAIL_ARTIFACTS;
  test.skip(!directory, "Set SOLO_ORGANIZER_EMAIL_ARTIFACTS to actual backend test output.");
  for (const [filename, expectedName] of [
    ["solo-booking_confirmed.html", "Maria Nowe Nazwisko"],
    ["solo-rescheduled.html", "Maria Nowe Nazwisko"],
    ["solo-cancelled.html", "Maria Nowe Nazwisko"],
    ["solo-dropin.html", "Maria <Nowa> & Yoga"],
    ["studio-booking_confirmed.html", "Studio Przestrzeń"],
  ]) {
    const path = `${directory}/${filename}`;
    expect(existsSync(path)).toBeTruthy();
    const html = readFileSync(path, "utf8");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setContent(html);
    await expect(page.locator("body")).toContainText(expectedName);
    await expect(page.locator("body")).not.toContainText("generated-carrier-setup-label");
    expect(html).not.toContain("generated-carrier-setup-label");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBeTruthy();
    if (filename === "solo-dropin.html") {
      await expect(page.locator("body")).toContainText("47,00 PLN");
      await expect(page.locator("body")).toContainText("ul. Zachowana 7");
    }
    await page.screenshot({
      path: `/tmp/joga-solo-acceptance/organizer-email-${filename.replace(".html", ".png")}`,
    });
  }
});
