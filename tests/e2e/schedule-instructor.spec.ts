import { expect, type Page, test } from "@playwright/test";

function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

async function setup(page: Page, eligible = ["b"], instructorName = "Olga Testowa") {
  const state = {
    requests: [] as { path: string; method: string; data: Record<string, unknown> }[],
    delays: {} as Record<string, Promise<void> | undefined>,
    returned: [] as string[],
    failScope: false,
    failAssignable: false,
    imageRequests: [] as string[],
    extraTemplates: [] as { id: string; title: string; image_ids: string[] }[],
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
      image_ids: [] as string[],
    },
  };
  const olga = {
    id: "olga",
    name: instructorName,
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
    if (url.hostname === "res.cloudinary.com" && url.pathname.includes("template-test-")) {
      state.imageRequests.push(url.pathname);
      if (url.pathname.includes("template-test-broken")) return route.fulfill({ status: 404 });
      return route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="80"><rect width="96" height="80" fill="#89a794"/><circle cx="48" cy="40" r="18" fill="#dce8dc"/></svg>',
      });
    }
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
    } else if (path === "/class-templates" && method === "POST")
      json = { ...state.template, ...data, id: "created" };
    else if (path === "/class-templates")
      json = [
        state.template,
        {
          ...state.template,
          id: "empty",
          title: "Bez domyślnych",
          image_ids: [],
          default_instructor_id: null,
          default_capacity: null,
        },
        ...state.extraTemplates.map((template) => ({ ...state.template, ...template })),
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

for (const width of [390, 1440]) {
  test(`template thumbnails load and fall back in both lists (${width}px)`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await setup(page);
    state.template.image_ids = ["  ", "template-test-present"];
    state.extraTemplates = [
      { id: "broken", title: "Nieudane zdjęcie", image_ids: ["template-test-broken"] },
    ];

    for (const [url, role] of [
      ["/account/partner/class-templates", "link"],
      ["/account/partner/class-schedules/create", "button"],
    ] as const) {
      await page.goto(url);
      await cookies(page);
      const present = page.getByRole(role, { name: /^Flow/ });
      const missing = page.getByRole(role, { name: /^Bez domyślnych/ });
      const broken = page.getByRole(role, { name: /^Nieudane zdjęcie/ });
      await expect(present).toContainText("60 min · Olga Testowa");
      await expect(present.locator('span[aria-hidden="true"]')).toHaveClass(/bg-class-green-600/);
      for (const removed of ["Opis", "Vinyasa", "wszystkie poziomy", "limit 14"])
        await expect(present).not.toContainText(removed);
      const image = present.locator("img");
      await expect(image).toHaveCount(1);
      await expect(image).toHaveAttribute("alt", "");
      await expect
        .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
        .toBe(96);
      await expect(present.locator("svg.lucide-image")).toHaveCount(0);
      await expect(missing.locator("img")).toHaveCount(0);
      await expect(missing.locator("svg.lucide-image")).toBeVisible();
      await expect(broken.locator("img")).toHaveCount(0);
      await expect(broken.locator("svg.lucide-image")).toBeVisible();
      expect(state.imageRequests.some((request) => request.includes("template-test-present"))).toBe(
        true,
      );
      expect(state.imageRequests.some((request) => request.includes("template-test-broken"))).toBe(
        true,
      );
      for (const row of [present, missing, broken]) {
        const bounds = await row.boundingBox();
        expect(bounds!.width).toBeGreaterThan(96);
        expect(await row.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
          true,
        );
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: info.outputPath(`${role}-thumbnails.png`), fullPage: true });
    }
  });
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

const substitutionPath = "/account/partner/schedule/edit/occurrence?field=instructor&studio_id=a";

async function setupSubstitution(page: Page) {
  await setup(page);
  const state = {
    assignableScopes: [] as (string | null)[],
    rosterWrites: [] as { path: string; data: unknown }[],
    sessionWrites: [] as { path: string; data: unknown }[],
    added: false,
    failAdd: false,
    failRefresh: false,
    assignableAfterAdd: true,
  };
  await page.route("**/class-sessions/occurrence", (route) =>
    route.fulfill({
      json: {
        id: "occurrence",
        organizer_kind: "studio",
        studio_id: "b",
        template_title: "Flow",
        calendar_date: "2026-12-01",
        start_time: "2026-12-01T09:00:00Z",
        end_time: "2026-12-01T10:00:00Z",
        is_recurring: true,
        instructor_id: "overridden-instructor",
        instructor_name: "Zastępczyni",
        room_id: "room-extra",
        series_instructor_id: "olga",
        series_instructor_name: "Olga Testowa",
        series_room_id: "room-b",
      },
    }),
  );
  await page.route("**/studios/b/rooms", (route) =>
    route.fulfill({
      json: [
        { id: "room-b", name: "Sala B" },
        { id: "room-extra", name: "Sala dodatkowa" },
      ],
    }),
  );
  await page.route("**/instructors/assignable?**", (route) => {
    const studioId = new URL(route.request().url()).searchParams.get("studio_id");
    state.assignableScopes.push(studioId);
    if (state.added && state.failRefresh) return route.fulfill({ status: 503, json: {} });
    return route.fulfill({
      json: [
        { id: "olga", name: "Olga Testowa" },
        ...(state.added && state.assignableAfterAdd ? [{ id: "marta", name: "Marta Nowak" }] : []),
      ],
    });
  });
  await page.route("**/instructors/lookup?**", (route) =>
    route.fulfill({
      json: {
        items: [
          { instructor_id: "marta", name: "Marta Nowak", styles: [], claim_status: "unclaimed" },
        ],
      },
    }),
  );
  await page.route(/\/(?:studios\/[^/]+\/roster\/marta|instructors\/resolve)$/, (route) => {
    const path = new URL(route.request().url()).pathname;
    state.rosterWrites.push({ path, data: route.request().postDataJSON() });
    if (state.failAdd) return route.fulfill({ status: 400, json: { detail: "Błąd zapisu." } });
    state.added = true;
    return route.fulfill({ json: { instructor_id: "marta" } });
  });
  await page.route("**/class-sessions/edit/*", (route) => {
    const path = new URL(route.request().url()).pathname;
    state.sessionWrites.push({ path, data: route.request().postDataJSON() });
    return route.fulfill({
      json: path.endsWith("/preview")
        ? {
            items: [
              {
                calendar_date: "2026-12-01",
                status: "modified",
                diffs: [{ label: "Prowadzący", old: "Olga Testowa", new: "Marta Nowak" }],
                booked_count: 1,
              },
            ],
            total_affected: 1,
            notification_summary: { total_recipients: 1, total_booked_seats: 1 },
          }
        : {
            updated: ["occurrence"],
            created: [],
            cancelled: [],
            deleted: [],
            queued_recipients: 1,
          },
    });
  });
  return state;
}

async function openSubstitution(page: Page) {
  await page.goto(substitutionPath);
  await cookies(page);
  await page.getByRole("button", { name: /Tę i kolejne/ }).click();
  await page.getByRole("button", { name: "Dalej", exact: true }).click();
  await expect(page.getByText("Zakres: ta i kolejne", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Olga Testowa/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}

test("inline substitution links a second instructor and keeps the draft until confirmation", async ({
  page,
}) => {
  const state = await setupSubstitution(page);
  await openSubstitution(page);
  const roomField = page.getByRole("combobox", { name: /Sala/ });
  await expect(roomField).toContainText("Sala B");
  const preview = page.getByRole("button", { name: "Zobacz podgląd zmian" });
  await expect(preview).toBeDisabled();

  await roomField.click();
  await page.getByRole("option", { name: "Sala dodatkowa", exact: true }).click();
  await expect(preview).toBeEnabled();
  const add = page.getByRole("button", { name: "Dodaj instruktora", exact: true });
  const dialog = page.getByRole("dialog", { name: "Dodaj instruktora" });
  await add.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(add).toBeFocused();
  await expect(roomField).toContainText("Sala dodatkowa");
  expect(state.rosterWrites).toEqual([]);

  await add.click();
  await dialog.getByRole("button", { name: "Zamknij", exact: true }).click();
  await expect(add).toBeFocused();
  await expect(roomField).toContainText("Sala dodatkowa");
  await add.click();
  await dialog.getByLabel("Imię i nazwisko lub email").fill("Marta Nowak");
  await dialog.getByRole("button", { name: /Marta Nowak/ }).click();
  await expect(dialog).toBeHidden();
  await expect(add).toBeFocused();
  await expect(page).toHaveURL(substitutionPath);
  await expect(page.getByText("Zakres: ta i kolejne", { exact: true })).toBeVisible();
  await expect(roomField).toContainText("Sala dodatkowa");
  await expect(page.getByRole("button", { name: /Olga Testowa/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const marta = page.getByRole("button", { name: /Marta Nowak/ });
  await expect(marta).toHaveAttribute("aria-pressed", "false");
  expect(state.rosterWrites).toEqual([{ path: "/studios/b/roster/marta", data: {} }]);
  expect(state.assignableScopes).toEqual(["b", "b"]);
  expect(state.sessionWrites).toEqual([]);

  await marta.click();
  await preview.click();
  await expect(page.getByText(/Prowadzący:.*Olga Testowa.*→.*Marta Nowak/)).toBeVisible();
  await page.getByRole("button", { name: "Zapisz zmiany" }).click();
  await expect(page.getByRole("heading", { name: "Zapisano zmiany" })).toBeVisible();
  expect(state.sessionWrites.map(({ path }) => path)).toEqual([
    "/class-sessions/edit/preview",
    "/class-sessions/edit/commit",
  ]);
  for (const { data } of state.sessionWrites) {
    expect(data).toEqual({
      occurrence_id: "occurrence",
      scope: "this_and_future",
      instructor_id: "marta",
      room_id: "room-extra",
    });
  }
});

test("inline substitution retries the assignable read after adding a new instructor", async ({
  page,
}) => {
  const state = await setupSubstitution(page);
  state.failAdd = state.failRefresh = true;
  state.assignableAfterAdd = false;
  await openSubstitution(page);
  await page.getByRole("button", { name: "Dodaj instruktora", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Dodaj instruktora" });
  await dialog.getByRole("button", { name: /Dodaj bez zaproszenia/ }).click();
  await dialog.getByLabel("Imię i nazwisko", { exact: true }).fill("Marta Nowak");
  const submit = dialog.getByRole("button", { name: "Dodaj instruktora", exact: true });
  await submit.click();
  await expect(page.getByText("Błąd zapisu.", { exact: true })).toBeVisible();
  await expect(dialog).toBeVisible();
  state.failAdd = false;
  await submit.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Instruktor dodany. Nie udało się odświeżyć listy.")).toBeVisible();

  state.failRefresh = false;
  await page.getByRole("button", { name: "Odśwież listę instruktorów" }).click();
  await expect(
    page.getByText("Instruktor nie jest jeszcze dostępny do przypisania."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Marta Nowak/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Olga Testowa/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Zobacz podgląd zmian" })).toBeDisabled();
  expect(state.assignableScopes).toEqual(["b", "b", "b"]);
  expect(state.rosterWrites).toEqual(
    Array.from({ length: 2 }, () => ({
      path: "/instructors/resolve",
      data: { name: "Marta Nowak", studio_id: "b" },
    })),
  );
  expect(state.sessionWrites).toEqual([]);
});

test("inline save keeps its default through a same-studio read failure and retry", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/account/partner/class-schedules/create?studio_id=b");
  await cookies(page);
  await expect.poll(() => state.returned.includes("b")).toBe(true);
  await page.getByRole("button", { name: "Nowy szablon zajęć", exact: true }).click();
  await page.getByLabel("Nazwa", { exact: true }).fill("Nowy szablon");
  await page.getByRole("button", { name: /Zaproszona Oczekuje na zaproszenie/ }).click();

  // The studio result, not the independently refreshed union, settles eligibility.
  const union = gate();
  state.delays.union = union.promise;
  state.failScope = true;
  await page.getByRole("button", { name: "Zapisz i wybierz", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Godzina", exact: true })).toBeVisible();
  await expect(page.getByText("Nie udało się wczytać instruktorów.")).toBeVisible();
  await expect(page.getByText(/Ten instruktor nie jest dostępny/)).toHaveCount(0);
  await expect(page.getByText("Nowy szablon", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pn", exact: true }).click();
  await room(page, "B");
  await expect(page.getByRole("button", { name: "Podgląd →" })).toBeDisabled();

  state.failScope = false;
  const retry = gate();
  state.delays.b = retry.promise;
  await page.getByRole("button", { name: "Spróbuj ponownie", exact: true }).click();
  await expect(page.getByText("Ładowanie instruktorów…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Podgląd →" })).toBeDisabled();
  retry.release();
  const selected = page.getByRole("button", { name: /Zaproszona Oczekuje na zaproszenie/ });
  await expect(selected).toHaveCount(1);
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Studio", { exact: true })).toHaveValue("b");
  await page.getByRole("button", { name: "Podgląd →" }).click();
  await page.getByRole("button", { name: "Utwórz grafik", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Grafik utworzony" })).toBeVisible();
  union.release();
  expect(
    state.requests.filter((r) => r.method === "POST" && r.path === "/class-templates"),
  ).toHaveLength(1);
  const writes = state.requests.filter(
    (r) => r.method === "POST" && r.path.startsWith("/class-schedules"),
  );
  expect(writes.map((r) => r.path)).toEqual(["/class-schedules/preview", "/class-schedules"]);
  for (const request of writes)
    expect(request.data).toMatchObject({
      template_id: "created",
      studio_id: "b",
      instructor_ids: ["pending"],
    });
});

for (const width of [390, 1440]) {
  test(`accepted independent default survives save/reopen and infers its unique studio (${width}px)`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const instructorName = "Olga Testowa Kowalska Nowak — nauczycielka jogi i medytacji";
    const state = await setup(page, ["b"], instructorName);
    state.template.title = "Spokojna praktyka jogi i medytacji na zakończenie długiego dnia";
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
    const preview = page.getByRole("region", { name: "Podgląd zajęć", exact: true });
    await expect(preview).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByText(state.template.title, { exact: true })).toBeVisible();
    await expect(page.getByText("60 min · wszystkie poziomy", { exact: true })).toBeVisible();
    const summaryInstructor = page.getByText(instructorName, { exact: true });
    await expect(summaryInstructor).toBeVisible();
    await expect(page.getByText("Studio B · Sala B", { exact: true })).toBeVisible();
    expect(
      await summaryInstructor.evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("preview-summary.png"), fullPage: true });
    await page.getByRole("button", { name: "Wstecz", exact: true }).click();
    await page.getByRole("button", { name: /Zaproszona Oczekuje na zaproszenie/ }).click();
    await page.getByRole("button", { name: "Podgląd →" }).click();
    await expect(preview).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByText("Zaproszona", { exact: true })).toBeVisible();
    await expect(summaryInstructor).toHaveCount(0);
    await page.getByRole("button", { name: "Wstecz", exact: true }).click();
    await page.getByRole("button", { name: "Brak prowadzącego", exact: true }).click();
    await page.getByRole("button", { name: "Podgląd →" }).click();
    await expect(page.getByText("Prowadzący · Brak prowadzącego", { exact: true })).toBeVisible();
    await expect(page.getByText("Zaproszona", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Utwórz grafik", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Grafik utworzony" })).toBeVisible();
    const writes = state.requests.filter(
      (r) => r.path.startsWith("/class-schedules") && r.method === "POST",
    );
    expect(writes.map((request) => request.data.instructor_ids)).toEqual([
      ["olga"],
      ["pending"],
      [],
      [],
    ]);
    for (const request of writes)
      expect(request.data).toMatchObject({
        studio_id: "b",
        room_id: "room-b",
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
  await page.getByRole("button", { name: "Zmień szablon: Flow", exact: true }).click();
  await page.getByRole("button", { name: /Bez domyślnych/ }).click();
  await expect(page.getByLabel("Studio", { exact: true })).toHaveValue("a");
  await expect(
    page.getByRole("button", { name: "Brak prowadzącego", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('input[type="number"]')).toHaveValue("");
  await page.getByRole("button", { name: "Pn", exact: true }).click();
  await page.getByRole("button", { name: "Podgląd →" }).click();
  await expect(page.getByText("Bez domyślnych", { exact: true })).toBeVisible();
  await expect(page.getByText("Prowadzący · Brak prowadzącego", { exact: true })).toBeVisible();
  await expect(page.getByText("Studio A · Sala A", { exact: true })).toBeVisible();
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
