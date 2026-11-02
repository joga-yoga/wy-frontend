import { expect, type Page, test } from "@playwright/test";

async function setup(page: Page, mode: "multi" | "single" | "solo" = "multi", empty = false) {
  const state = {
    roster: empty ? [] : [{ id: "old", name: "Anna", row_state: "active", image_id: null }],
    partnerList: [
      {
        id: "old",
        name: "Anna",
        image_id: null,
        claim_status: "claimed",
        claimed_at: "2026-01-01",
      },
    ],
    fail: false,
    omitAdded: false,
    failRefresh: false,
    requests: [] as { path: string; method: string; data: Record<string, unknown> | null }[],
    template: {
      id: "template",
      title: "Hatha",
      description: "Opis",
      duration_minutes: 60,
      level: "all_levels",
      style_id: "hatha",
      language: "polski",
      color: "green",
      default_capacity: 12,
      default_instructor_id: "old",
      image_ids: [] as string[],
      terms_locked: mode === "solo",
    },
  };
  await page.addInitScript(() => {
    localStorage.setItem(
      "access_token",
      `e30.${btoa(JSON.stringify({ sub: "owner", email: "owner@example.com" }))}.fixture`,
    );
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = "nextjs-portal{display:none!important}";
      document.head.append(s);
    });
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "res.cloudinary.com")
      return route.fulfill({
        path: "public/images/marketing/studios/yoga-first.webp",
        contentType: "image/webp",
      });
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) return route.abort();
    if (!["8000", "8010"].includes(url.port)) return route.continue();
    const path = url.pathname,
      method = route.request().method();
    const data =
      ["POST", "PUT", "PATCH"].includes(method) && !path.endsWith("image-upload")
        ? route.request().postDataJSON()
        : null;
    state.requests.push({ path, method, data });
    let json: unknown = [],
      status = 200;
    if (path === "/me")
      json = {
        id: "owner",
        email: "owner@example.com",
        partner: { id: "partner", phone_verified: true },
      };
    else if (path === "/partner/me") json = { id: "partner", phone_verified: true };
    else if (path === "/partner/capabilities")
      json = {
        business_mode: mode === "solo" ? "solo" : "studio",
        managed_studios:
          mode === "solo"
            ? []
            : mode === "single"
              ? [{ id: "studio-b", name: "B" }]
              : [
                  { id: "studio-a", name: "A" },
                  { id: "studio-b", name: "B" },
                ],
        solo_studio_id: mode === "solo" ? "solo" : null,
        self_instructor_id: mode === "solo" ? "self" : null,
        teaching_studios: [],
        has_events: false,
        has_instructor_profile: false,
        landing_tab: "grafik",
      };
    else if (path === "/instructors/assignable") {
      if (state.failRefresh) {
        status = 503;
        json = { detail: "Błąd odświeżania" };
      } else
        json = url.searchParams.has("studio_id")
          ? state.roster
          : [
              ...state.partnerList.map((row) => ({
                ...row,
                row_state: row.claim_status === "invited" ? "awaiting" : undefined,
              })),
              ...state.roster,
            ];
    } else if (path.endsWith("/roster") && method === "GET") {
      if (state.failRefresh) {
        status = 503;
        json = { detail: "Błąd odświeżania" };
      } else json = { items: state.roster };
    } else if (path.includes("/roster/") && method === "POST") {
      if (state.fail) {
        status = 503;
        json = { detail: "Spróbuj ponownie — dodanie nie powiodło się." };
      } else if (!state.omitAdded)
        state.roster = [
          ...state.roster.filter((i) => i.id !== "added"),
          { id: "added", name: "Anna", image_id: null, row_state: "awaiting" },
        ];
    } else if (path === "/instructors") json = state.partnerList;
    else if (path === "/instructors/lookup")
      json = url.searchParams.has("q")
        ? {
            items: [
              {
                instructor_id: "added",
                name: "Anna",
                image_id: null,
                claim_status: "claimed",
                styles: [],
              },
            ],
          }
        : { found: "none" };
    else if (path === "/instructors/resolve") {
      if (state.fail) {
        status = 503;
        json = { detail: "Spróbuj ponownie — dodanie nie powiodło się." };
      } else {
        json = {
          instructor_id: "new",
          name: data?.name || "Nowa osoba",
          claim_status: "invited",
          created: !data?.studio_id,
          resolution_type: "new_instructor",
          is_owned: true,
        };
        if (data?.studio_id && !state.omitAdded)
          state.roster.push({
            id: "new",
            name: String(data.name),
            image_id: null,
            row_state: "awaiting",
          });
      }
    } else if (path === "/instructors/new" && method === "PUT") {
      json = { id: "new", ...data };
      if (!state.omitAdded)
        state.partnerList.push({
          id: "new",
          name: String(data?.name),
          image_id: null,
          claim_status: "invited",
          claimed_at: "",
        });
    } else if (path === "/class-templates/template") {
      if (method === "PATCH") state.template = { ...state.template, ...data };
      json = state.template;
    } else if (path === "/class-templates")
      json = method === "POST" ? { id: "created", ...data } : [state.template];
    else if (path === "/events/image-upload") json = { image_id: "template-image" };
    else if (path === "/yoga-styles")
      json = [
        { id: "hatha", name: "Hatha" },
        { id: "yin", name: "Yin" },
      ];
    else if (path.startsWith("/notifications")) json = { items: [], unread_count: 0 };
    await route.fulfill({ status, json });
  });
  return state;
}
async function dismissCookies(page: Page) {
  const button = page.getByRole("button", { name: "Tylko niezbędne" });
  try {
    await button.waitFor({ timeout: 1500 });
    await button.click();
  } catch {}
}
async function select(page: Page, id: string, option: string) {
  await page.locator(`#${id}`).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("studio template keeps all fields through cancel and retry; selects returned pending ID then clears explicitly", async ({
  page,
}, info) => {
  const state = await setup(page);
  await page.goto("/account/partner/class-templates/template/edit?studio_id=studio-b");
  await dismissCookies(page);
  await page.getByLabel("Nazwa", { exact: true }).fill("Zmieniona nazwa");
  await page.locator("#description").fill("Zmieniony opis");
  await select(page, "duration", "75 min");
  await select(page, "level", "Zaawansowany");
  await page.getByRole("button", { name: "Yin", exact: true }).click();
  await select(page, "language", "Angielski");
  await page.getByRole("button", { name: "Lawendowy", exact: true }).click();
  await page.locator("#capacity").fill("19");
  await page
    .locator("input[type=file]")
    .setInputFiles("public/images/marketing/studios/yoga-first.webp");
  const add = page.getByRole("button", { name: "Dodaj instruktora", exact: true });
  await expect(page.getByRole("button", { name: /Anna$/ })).toHaveAttribute("aria-pressed", "true");
  await add.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Imię i nazwisko lub email").fill("Anna");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(add).toBeFocused();
  await expect(page.getByLabel("Nazwa", { exact: true })).toHaveValue("Zmieniona nazwa");
  await add.click();
  await dialog.getByLabel("Imię i nazwisko lub email").fill("Anna");
  state.fail = true;
  await dialog.getByRole("button", { name: /Anna/ }).click();
  await expect(page.getByText("Spróbuj ponownie — dodanie nie powiodło się.")).toBeVisible();
  await expect(dialog.getByLabel("Imię i nazwisko lub email")).toHaveValue("Anna");
  state.fail = false;
  await dialog.getByRole("button", { name: /Anna/ }).click();
  await expect(dialog).toBeHidden();
  const pending = page.getByRole("button", { name: /Anna Oczekuje na zaproszenie$/ });
  await expect(pending).toHaveAttribute("aria-pressed", "true");
  await expect(pending).toHaveCount(1);
  expect(
    state.requests.filter((r) => r.method !== "GET" && r.path.includes("class-templates")),
  ).toHaveLength(0);
  expect(
    state.requests
      .filter((r) => r.path.includes("/roster/added"))
      .every((r) => r.path === "/studios/studio-b/roster/added"),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("pending-desktop.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
  await expect.poll(() => state.requests.filter((r) => r.method === "PATCH").length).toBe(1);
  expect(state.template).toMatchObject({
    title: "Zmieniona nazwa",
    description: "Zmieniony opis",
    duration_minutes: 75,
    level: "advanced",
    style_id: "yin",
    language: "angielski",
    color: "lavender",
    default_capacity: 19,
    default_instructor_id: "added",
    image_ids: ["template-image"],
  });
  await page.goto("/account/partner/class-templates/template/edit?studio_id=studio-b");
  await page.getByRole("button", { name: "Wybiorę później", exact: true }).click();
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
  await expect.poll(() => state.template.default_instructor_id).toBe(null);
});

test("mobile inline creation uses single studio, retains parent on child retry and preserves pending invitation", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const state = await setup(page, "single", true);
  await page.goto("/account/partner/class-schedules/create");
  await dismissCookies(page);
  await page.getByRole("button", { name: "Nowy szablon zajęć", exact: true }).click();
  await page.getByLabel("Nazwa", { exact: true }).fill("Nowy szablon");
  await page.getByRole("button", { name: "Dodaj instruktora", exact: true }).click();
  const d = page.getByRole("dialog");
  await d.getByRole("button", { name: "Dodaj bez zaproszenia (bez emaila)" }).click();
  await d.getByLabel("Imię i nazwisko", { exact: true }).fill("Nowa osoba");
  await d.getByLabel("Email", { exact: true }).fill("new@example.com");
  state.fail = true;
  await d.getByRole("button", { name: "Dodaj i wyślij zaproszenie" }).click();
  await expect(page.getByText("Spróbuj ponownie — dodanie nie powiodło się.")).toBeVisible();
  await expect(d.getByLabel("Imię i nazwisko", { exact: true })).toHaveValue("Nowa osoba");
  await page.screenshot({ path: info.outputPath("addition-mobile.png"), animations: "disabled" });
  state.fail = false;
  await d.getByRole("button", { name: "Dodaj i wyślij zaproszenie" }).click();
  await expect(d).toBeHidden();
  await expect(page.getByLabel("Nazwa", { exact: true })).toHaveValue("Nowy szablon");
  await expect(
    page.getByRole("button", { name: "Nowa osoba Oczekuje na zaproszenie" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    state.requests.filter((r) => r.method === "POST" && r.path === "/class-templates"),
  ).toHaveLength(0);
  const resolve = state.requests.filter((r) => r.path === "/instructors/resolve").at(-1)!;
  expect(resolve.data).toMatchObject({
    studio_id: "studio-b",
    name: "Nowa osoba",
    email: "new@example.com",
  });
  await page.screenshot({ path: info.outputPath("selected-mobile.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Zapisz i wybierz", exact: true }).click();
  await expect(page.getByText("Krok 2 z 3")).toBeVisible();
  expect(
    state.requests.find((r) => r.method === "POST" && r.path === "/class-templates")?.data,
  ).toMatchObject({ title: "Nowy szablon", default_instructor_id: "new" });
});

test("unresolved multi-studio context uses partner operations and keeps previous default without a selectable result", async ({
  page,
}) => {
  const state = await setup(page);
  state.omitAdded = true;
  await page.goto("/account/partner/class-templates/template/edit");
  await dismissCookies(page);
  await page.getByRole("button", { name: "Dodaj instruktora", exact: true }).click();
  const d = page.getByRole("dialog");
  await d.getByLabel("E-mail instruktora", { exact: true }).fill("new@example.com");
  await d.getByRole("button", { name: "Dalej →", exact: true }).click();
  await d.getByLabel("Imię i nazwisko *", { exact: true }).fill("Nowa osoba");
  await d.getByRole("button", { name: "Dodaj instruktora", exact: true }).click();
  await expect(d).toBeHidden();
  await expect(page.getByText(/Instruktor nie jest jeszcze dostępny/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Anna$/ })).toHaveAttribute("aria-pressed", "true");
  expect(state.requests.some((r) => r.path.includes("/studios/"))).toBe(false);
  expect(state.requests.find((r) => r.path === "/instructors/resolve")?.data).toEqual({
    email: "new@example.com",
  });
  state.partnerList.push({
    id: "new",
    name: "Nowa osoba",
    image_id: null,
    claim_status: "invited",
    claimed_at: "",
  });
  await page.getByRole("button", { name: "Odśwież listę instruktorów" }).click();
  await expect(
    page.getByRole("button", { name: "Nowa osoba Oczekuje na zaproszenie" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("solo template remains self-led without later or another-instructor actions", async ({
  page,
}) => {
  const state = await setup(page, "solo");
  await page.goto("/account/partner/class-templates/template/edit");
  await dismissCookies(page);
  await expect(page.getByLabel("Nazwa", { exact: true })).toHaveValue("Hatha");
  await expect(page.getByRole("button", { name: "Dodaj instruktora", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Wybiorę później", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
  await expect.poll(() => state.requests.filter((r) => r.method === "PATCH").length).toBe(1);
  expect(state.template.default_instructor_id).toBe("self");
});

test("empty roster refresh failure is retryable; repeating an add keeps one option per ID", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const state = await setup(page, "single", true);
  await page.goto("/account/partner/class-templates/create");
  await dismissCookies(page);
  await page.getByLabel("Nazwa", { exact: true }).fill("Niezapisany szablon");
  const add = page.getByRole("button", { name: "Dodaj instruktora", exact: true });
  await add.click();
  const d = page.getByRole("dialog");
  await d.getByLabel("Imię i nazwisko lub email").fill("Anna");
  await expect(d.getByRole("button", { name: /Anna/ })).toBeVisible();
  expect(await d.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("lookup-mobile.png"), animations: "disabled" });
  state.failRefresh = true;
  await d.getByRole("button", { name: /Anna/ }).click();
  await expect(
    page.getByText("Instruktor dodany. Nie udało się odświeżyć listy instruktorów."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Wybiorę później", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  state.failRefresh = false;
  await page.getByRole("button", { name: "Odśwież listę instruktorów" }).click();
  const pending = page.getByRole("button", { name: /Anna Oczekuje na zaproszenie$/ });
  await expect(pending).toHaveAttribute("aria-pressed", "true");
  await add.click();
  await d.getByLabel("Imię i nazwisko lub email").fill("Anna");
  await d.getByRole("button", { name: /Anna/ }).click();
  await expect(d).toBeHidden();
  await expect(pending).toHaveCount(1);
  await expect(page.getByLabel("Nazwa", { exact: true })).toHaveValue("Niezapisany szablon");
  expect(
    state.requests.filter((r) => r.method === "POST" && r.path === "/class-templates"),
  ).toHaveLength(0);
  await page.screenshot({ path: info.outputPath("selected-mobile.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  expect(state.roster.map((i) => i.id)).toEqual(["added"]);
});

test("extracted studio add route retains its URL step and return navigation", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/account/partner/instructors/create?studioId=studio-b");
  await dismissCookies(page);
  await page.getByRole("button", { name: "Dodaj bez zaproszenia (bez emaila)" }).click();
  await expect(page).toHaveURL(/step=new/);
  await page.getByLabel("Imię i nazwisko", { exact: true }).fill("Nowa osoba");
  await page.getByRole("button", { name: "Dodaj instruktora", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/partner\/instructors$/);
  expect(state.requests.find((r) => r.path === "/instructors/resolve")?.data?.studio_id).toBe(
    "studio-b",
  );
});
