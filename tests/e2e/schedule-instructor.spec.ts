import { expect, type Page, test } from "@playwright/test";

function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

async function setup(page: Page, eligible = ["b"]) {
  const state = {
    requests: [] as { path: string; method: string; data: Record<string, unknown> }[],
    delays: {} as Record<string, Promise<void> | undefined>,
    returned: [] as string[],
    failScope: false,
    failAssignable: false,
    template: {
      id: "flow",
      title: "Flow",
      duration_minutes: 60,
      level: "all_levels",
      default_instructor_id: "olga" as string | null,
      default_capacity: 14,
      description: "Opis",
      style: "Vinyasa",
      color: "green",
      language: "polski",
      image_ids: [],
    },
  };
  const olga = {
    id: "olga",
    name: "Olga Testowa",
    row_state: "linked",
    eligible_studio_ids: eligible,
  };
  const anna = { id: "anna", name: "Anna", row_state: "linked", eligible_studio_ids: ["a"] };
  const pending = {
    id: "pending",
    name: "Zaproszona",
    row_state: "awaiting",
    eligible_studio_ids: ["b"],
  };
  await page.addInitScript(() => {
    localStorage.setItem(
      "access_token",
      `e30.${btoa(JSON.stringify({ sub: "owner", email: "owner@example.com" }))}.fixture`,
    );
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) return route.abort();
    if (!["8000", "8010"].includes(url.port)) return route.continue();
    const path = url.pathname,
      method = route.request().method();
    const data = ["POST", "PATCH", "PUT"].includes(method) ? route.request().postDataJSON() : {};
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
        business_mode: "studio",
        managed_studios: [
          { id: "a", name: "Studio A" },
          { id: "b", name: "Studio B" },
        ],
        teaching_studios: [],
        has_events: false,
        has_instructor_profile: false,
        landing_tab: "grafik",
      };
    else if (path === "/instructors")
      json = []; // independent profiles are not editable by this owner
    else if (path === "/instructors/assignable") {
      const scope = url.searchParams.get("studio_id") || "union";
      const rows = [olga, anna, pending].filter(
        (row) => scope === "union" || row.eligible_studio_ids.includes(scope),
      );
      if (state.delays[scope]) await state.delays[scope];
      if (state.failAssignable || (scope !== "union" && state.failScope)) {
        status = 503;
        json = { detail: "Unavailable" };
      } else json = rows;
      state.returned.push(scope);
    } else if (path.endsWith("/rooms")) {
      const studio = path.split("/")[2];
      json = [{ id: `room-${studio}`, name: `Sala ${studio.toUpperCase()}` }];
    } else if (path === "/class-templates/flow") {
      if (method === "PATCH") state.template = { ...state.template, ...data };
      json = state.template;
    } else if (path === "/class-templates")
      json = [
        state.template,
        {
          ...state.template,
          id: "empty",
          title: "Bez domyślnych",
          default_instructor_id: null,
          default_capacity: null,
        },
      ];
    else if (path === "/class-schedules/preview")
      json = {
        total: 1,
        occurrences: [
          {
            calendar_date: "2026-12-01",
            start_time: "2026-12-01T09:00:00Z",
            end_time: "2026-12-01T10:00:00Z",
            instructor_id: data.instructor_ids?.[0] ?? null,
          },
        ],
      };
    else if (path === "/class-schedules") json = { total_created: 1, occurrences: [] };
    else if (path.startsWith("/notifications")) json = { items: [], unread_count: 0 };
    await route.fulfill({ status, json });
  });
  return state;
}
async function cookies(page: Page) {
  const button = page.getByRole("button", { name: "Tylko niezbędne" });
  try {
    await button.waitFor({ timeout: 1500 });
    await button.click();
  } catch {}
}
async function room(page: Page, studio: string) {
  await page.getByRole("combobox", { name: /Sala/ }).click();
  await page.getByRole("option", { name: `Sala ${studio}`, exact: true }).click();
}
const wizard = "/account/partner/class-schedules/create?templateId=flow";

for (const width of [390, 1440]) {
  test(`accepted independent default survives save/reopen and infers its unique studio (${width}px)`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const state = await setup(page);
    await page.goto("/account/partner/class-templates/flow/edit");
    await cookies(page);
    const olga = page.getByRole("button", { name: /Olga Testowa/ });
    await expect(olga).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
    await expect.poll(() => state.requests.filter((r) => r.method === "PATCH").length).toBe(1);
    expect(state.template.default_instructor_id).toBe("olga");
    await page.goto("/account/partner/class-templates/flow/edit");
    await expect(olga).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("link", { name: "Dodaj do grafiku" }).click();
    await expect(page.getByLabel("Studio", { exact: true })).toHaveValue("b");
    await expect(olga).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: /Zaproszona Oczekuje na zaproszenie/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Pn", exact: true }).click();
    await room(page, "B");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath("inferred.png"), fullPage: true });
    await page.getByRole("button", { name: "Podgląd →" }).click();
    await page.getByRole("button", { name: "Utwórz grafik", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Grafik utworzony" })).toBeVisible();
    const writes = state.requests.filter(
      (r) => r.path.startsWith("/class-schedules") && r.method === "POST",
    );
    expect(writes).toHaveLength(2);
    for (const request of writes)
      expect(request.data).toMatchObject({
        studio_id: "b",
        room_id: "room-b",
        instructor_ids: ["olga"],
        capacity: 14,
      });
  });
}

for (const eligible of [["a", "b"], []]) {
  test(`ambiguous or missing eligibility requires studio selection (${eligible.join() || "none"})`, async ({
    page,
  }) => {
    const state = await setup(page, eligible);
    await page.goto(wizard);
    await cookies(page);
    await expect.poll(() => state.returned.includes("union")).toBe(true);
    await expect(page.getByLabel("Studio", { exact: true })).toHaveValue("");
    await expect(page.getByText("Wybierz studio.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Podgląd →" })).toBeDisabled();
    await page.getByLabel("Studio", { exact: true }).selectOption("b");
    if (eligible.length)
      await expect(page.getByRole("button", { name: /Olga Testowa/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    else {
      await expect(page.getByText(/Ten instruktor nie jest dostępny/)).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Brak prowadzącego", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
    }
  });
}

test("studio changes clear rooms and invalid instructor; template changes clear default capacity and instructor", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto(wizard);
  await cookies(page);
  await expect(page.getByLabel("Studio", { exact: true })).toHaveValue("b");
  await room(page, "B");
  await page.getByLabel("Studio", { exact: true }).selectOption("a");
  await expect(page.getByText(/Ten instruktor nie jest dostępny/)).toBeVisible();
  await expect(page.getByRole("combobox", { name: /Sala/ })).toContainText("Wybierz salę");
  await page.getByRole("button", { name: /Anna/ }).click();
  await room(page, "A");
  await page.getByRole("button", { name: "Zmień", exact: true }).click();
  await page.getByRole("button", { name: /Bez domyślnych/ }).click();
  await expect(page.getByLabel("Studio", { exact: true })).toHaveValue("a");
  await expect(
    page.getByRole("button", { name: "Brak prowadzącego", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('input[type="number"]')).toHaveValue("");
  await page.getByRole("button", { name: "Pn", exact: true }).click();
  await page.getByRole("button", { name: "Podgląd →" }).click();
  expect(state.requests.find((r) => r.path === "/class-schedules/preview")?.data).toMatchObject({
    template_id: "empty",
    studio_id: "a",
    instructor_ids: [],
  });
});

test("explicit studio link is retained and beats unique inference", async ({ page }) => {
  await setup(page);
  await page.goto("/account/partner/class-templates/flow/edit?studio_id=a");
  await cookies(page);
  const link = page.getByRole("link", { name: "Dodaj do grafiku" });
  await expect(link).toHaveAttribute("href", /studio_id=a/);
  await link.click();
  await expect(page.getByLabel("Studio", { exact: true })).toHaveValue("a");
  await expect(page.getByText(/Ten instruktor nie jest dostępny/)).toBeVisible();
});

test("late union result cannot replace a manual studio or instructor choice", async ({ page }) => {
  const state = await setup(page),
    delayed = gate();
  state.delays.union = delayed.promise;
  await page.goto(wizard);
  await cookies(page);
  await page.getByLabel("Studio", { exact: true }).selectOption("a");
  await page.getByRole("button", { name: /Anna/ }).click();
  delayed.release();
  await expect.poll(() => state.returned.includes("union")).toBe(true);
  await expect(page.getByLabel("Studio", { exact: true })).toHaveValue("a");
  await expect(page.getByRole("button", { name: /Anna/ })).toHaveAttribute("aria-pressed", "true");
});

test("scope retry, stale response and explicit later choice preserve empty selection in preview and create", async ({
  page,
}) => {
  const state = await setup(page),
    delayed = gate();
  state.delays.a = delayed.promise;
  await page.goto(`${wizard}&studio_id=a`);
  await cookies(page);
  await expect(page.getByText("Ładowanie instruktorów…")).toBeVisible();
  state.failScope = true;
  await page.getByLabel("Studio", { exact: true }).selectOption("b");
  await expect(page.getByText("Nie udało się wczytać instruktorów.")).toBeVisible();
  state.failScope = false;
  await page.getByRole("button", { name: "Spróbuj ponownie", exact: true }).click();
  await expect(page.getByRole("button", { name: /Olga Testowa/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Brak prowadzącego", exact: true }).click();
  delayed.release();
  await expect.poll(() => state.returned.includes("a")).toBe(true);
  await expect(page.getByRole("button", { name: /Anna/ })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Brak prowadzącego", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await room(page, "B");
  await page.getByRole("button", { name: "Pn", exact: true }).click();
  await page.getByRole("button", { name: "Podgląd →" }).click();
  await page.getByRole("button", { name: "Utwórz grafik", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Grafik utworzony" })).toBeVisible();
  for (const r of state.requests.filter(
    (r) => r.path.startsWith("/class-schedules") && r.method === "POST",
  ))
    expect(r.data.instructor_ids).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`template catalogue and picker show only duration and saved default (${width}px)`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    const state = await setup(page);
    state.failAssignable = true;
    await page.goto("/account/partner/class-templates");
    await cookies(page);
    const flow = page.getByRole("link", { name: /^Flow/ });
    await expect(flow).toContainText("Nie udało się wczytać prowadzącego");
    await expect(flow).not.toContainText("nie został jeszcze wybrany");
    state.failAssignable = false;
    await page.getByRole("button", { name: "Odśwież prowadzących" }).click();
    await expect(flow).toContainText("60 min · Olga Testowa");
    for (const removed of ["Opis", "Vinyasa", "wszystkie poziomy", "limit 14"])
      await expect(flow).not.toContainText(removed);
    await expect(flow.locator("img")).toHaveCount(0);
    await expect(flow.locator('span[aria-hidden="true"]')).toHaveClass(/bg-class-green-600/);
    await expect(page.getByRole("link", { name: /^Bez domyślnych/ })).toContainText(
      "Prowadzący nie został jeszcze wybrany",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("catalogue.png"), fullPage: true });
    await page.goto("/account/partner/class-schedules/create");
    const choice = page.getByRole("button", { name: /^Flow/ });
    await expect(choice).toContainText("60 min · Olga Testowa");
    await expect(choice).not.toContainText("Opis");
    expect(state.requests.some((r) => r.path.startsWith("/class-sessions"))).toBe(false);
    await page.screenshot({ path: info.outputPath("template-picker.png"), fullPage: true });
    await choice.click();
    await expect(page.getByRole("button", { name: /Olga Testowa/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
}
