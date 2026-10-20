import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const fixturePath = process.env.TEMPLATE_UX_IDENTITIES;
const fixtures:
  | { api_url: string; solo: { token: string }; studio: { token: string } }
  | undefined = fixturePath ? JSON.parse(readFileSync(fixturePath, "utf8")) : undefined;
const apiUrl = "http://localhost:8000";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

for (const mode of ["studio", "solo"] as const) {
  test(`${mode}: template level persistence and local delete confirmation`, async ({
    context,
    page,
  }, testInfo) => {
    test.skip(!fixtures, "Set TEMPLATE_UX_IDENTITIES to existing local studio/solo test accounts.");
    expect(fixtures!.api_url).toBe(apiUrl);
    const identity = fixtures![mode];
    const headers = { Authorization: `Bearer ${identity.token}` };
    await context.addInitScript(
      (token) => localStorage.setItem("access_token", token),
      identity.token,
    );
    // This journey may write only its disposable templates, never schedules or delivery.
    await context.route("**/*", (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!["http://localhost:3000", apiUrl].includes(url.origin)) return route.abort();
      if (url.pathname.startsWith("/places/") || url.pathname === "/public/class-venues/search")
        return route.abort();
      if (
        !["GET", "HEAD", "OPTIONS"].includes(request.method()) &&
        !(url.origin === apiUrl && /^\/class-templates(?:\/[^/]+)?$/.test(url.pathname))
      )
        return route.abort();
      return route.continue();
    });
    page.setDefaultTimeout(15_000);

    await page.goto("/account/partner/class-templates/create");
    const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
    if (await cookies.isVisible()) await cookies.click();
    const level = page.getByRole("combobox", { name: "Poziom", exact: true });
    await expect(level).toHaveText("Wszystkie poziomy");
    await level.click();
    await page.getByRole("option", { name: "Zaawansowany", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Nazwa", exact: true })
      .fill(`Template UX ${mode} ${Date.now()}`);
    if (mode === "solo") {
      await page.getByLabel("Cena jednego wejścia", { exact: true }).fill("45");
      await page
        .getByRole("combobox", { name: "Miejsce zajęć", exact: true })
        .fill("ul. Testowa 10, Warszawa");
    } else {
      await expect(page.getByLabel("Cena jednego wejścia", { exact: true })).toHaveCount(0);
    }
    await expect(level).toHaveText("Zaawansowany"); // Other field rerenders preserve the choice.
    await level.click();
    await page.getByRole("option", { name: "Wszystkie poziomy", exact: true }).click();
    const createdResponse = page.waitForResponse(
      (response) =>
        response.url() === `${apiUrl}/class-templates` && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Zapisz szablon", exact: true }).click();
    const created = await createdResponse;
    expect(created.status()).toBe(201);
    const template = await created.json();
    expect(template.level).toBe("all_levels");
    const templateUrl = `${apiUrl}/class-templates/${template.id}`;
    const editUrl = `/account/partner/class-templates/${template.id}/edit`;

    await page.goto(editUrl);
    await expect(level).toHaveText("Wszystkie poziomy");
    await level.click();
    await page.getByRole("option", { name: "Początkujący", exact: true }).click();
    await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
    await expect(page).toHaveURL(/\/class-templates$/);
    await page.goto(editUrl);
    await expect(level).toHaveText("Początkujący"); // Existing saved levels are not defaulted.
    await page
      .getByRole("textbox", { name: "Nazwa", exact: true })
      .fill(`${template.title} edited`);
    await expect(level).toHaveText("Początkujący");
    await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
    await expect(page).toHaveURL(/\/class-templates$/);
    const saved = await (await context.request.get(templateUrl, { headers })).json();
    expect(saved.level).toBe("beginner");
    expect(saved.price).toBe(template.price);
    expect(saved.location).toEqual(template.location);
    await page.goto(editUrl);
    await expect(level).toHaveText("Początkujący");

    let deleteRequests = 0;
    page.on("request", (request) => {
      if (request.url() === templateUrl && request.method() === "DELETE") deleteRequests++;
    });
    const trigger = page.getByRole("button", { name: "Usuń szablon", exact: true });
    const dialog = page.getByRole("dialog", { name: "Usunąć szablon?", exact: true });
    await trigger.tap();
    await expect(dialog).toBeVisible();
    expect(deleteRequests).toBe(0);
    const cancel = dialog.getByRole("button", { name: "Anuluj", exact: true });
    await expect(cancel).toBeFocused();
    const confirm = dialog.getByRole("button", { name: "Tak, usuń", exact: true });
    await dialog.evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    const triggerBox = (await trigger.boundingBox())!;
    const confirmBox = (await confirm.boundingBox())!;
    expect(confirmBox.height).toBeGreaterThanOrEqual(44);
    expect(
      Math.abs(confirmBox.x + confirmBox.width / 2 - triggerBox.x - triggerBox.width / 2),
    ).toBeLessThan(100);
    expect(
      Math.abs(confirmBox.y + confirmBox.height / 2 - triggerBox.y - triggerBox.height / 2),
    ).toBeLessThan(150);
    await page.screenshot({ path: testInfo.outputPath(`${mode}-delete-mobile.png`) });
    await cancel.tap();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.press("Enter");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.press("Space");
    await expect(dialog).toBeVisible();
    await page.getByText("Domyślne ustawienia", { exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(deleteRequests).toBe(0);

    // Hold a failed request to verify pending protection and the existing error/retry UI.
    let releaseFailure!: () => void;
    const failureGate = new Promise<void>((resolve) => {
      releaseFailure = resolve;
    });
    await page.route(templateUrl, async (route) => {
      if (route.request().method() !== "DELETE") return route.continue();
      await failureGate;
      return route.fulfill({ status: 503, json: { detail: "Temporary test failure" } });
    });
    await trigger.tap();
    await confirm.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
    await expect.poll(() => deleteRequests).toBe(1);
    await expect(dialog.getByRole("button", { name: "Usuwanie...", exact: true })).toBeDisabled();
    releaseFailure();
    await expect(page.getByText("Nie udało się usunąć szablonu.", { exact: true })).toBeVisible();
    await expect(confirm).toBeEnabled();
    await page.unroute(templateUrl);
    const deletedResponse = page.waitForResponse(
      (response) => response.url() === templateUrl && response.request().method() === "DELETE",
    );
    await cancel.press("Tab");
    await expect(confirm).toBeFocused();
    await confirm.press("Enter");
    expect((await deletedResponse).ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/class-templates$/);
    expect(deleteRequests).toBe(2);
    expect((await context.request.get(templateUrl, { headers })).status()).toBe(404);
  });
}
