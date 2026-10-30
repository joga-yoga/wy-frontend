import { expect, type Page, test } from "@playwright/test";

import type {
  ImportJob,
  ImportRecord,
} from "../../src/app/account/partner/studio/import/fitssey/types";
const base = "/account/partner/studio/import/fitssey";
function record(kind: ImportRecord["kind"], key: string, data: ImportRecord["data"]): ImportRecord {
  return {
    id: key,
    source_id: key,
    kind,
    name: String(data.name),
    data,
    overrides: {},
    selected: true,
    issues: [],
    targets: {},
    destination: {},
    asset_state: "none",
    image_id: null,
  };
}
function job(state: ImportJob["state"] = "review"): ImportJob {
  return {
    id: "fixture-job",
    origin_studio_id: null,
    transfer_closed: state === "completed",
    source_uuid: "fixture-source",
    state,
    stage: "review",
    revision: 1,
    scope: { start_date: "2026-10-01", end_date: "2026-12-29", timezone: "Europe/Warsaw" },
    error_code: null,
    created_at: "2026-10-01T12:00:00Z",
    updated_at: "2026-10-01T12:00:00Z",
    expires_at: "2026-10-08T12:00:00Z",
    counts: { location: 1, member: 1, class: 1, pass: 1, session: 1 },
    selected_count: 5,
    imported_count: 0,
    asset_failed_count: 0,
    next_run_at: null,
    branches: [],
  };
}
async function mock(page: Page, initial = job()) {
  const branch = record("location", "branch1", {
    name: "Studio Centrum",
    address: "Długa 1",
    city: "Warszawa",
    currency: null,
    rooms: [{ id: "r1", name: "Sala A" }],
  });
  branch.issues = ["currency_required"];
  const rows = [
    branch,
    record("member", "teacher", { name: "Anna Nowak" }),
    record("class", "hatha", {
      name: "Hatha",
      duration_minutes: 60,
      color: "green",
      service_type: "TYPE_CLASSROOM_SERVICE",
    }),
    record("pass", "product", {
      name: "Karnet",
      price: "120.00",
      currency: null,
    }),
    record("session", "session", {
      name: "Hatha",
      starts_at: "2026-10-25T02:15:00+02:00",
      ends_at: "2026-10-25T02:15:00+01:00",
      capacity: 12,
      bookable: true,
    }),
  ];
  let current = { ...initial, branches: [branch] };
  const actions: string[] = [];
  const secrets: string[] = [];
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ sub: "fixture-user", email: "owner@example.com" }));
    localStorage.setItem("access_token", `e30.${payload}.fixture`);
  });
  await page.route(
    /https?:\/\/[^/]+\/(?:me|partner\/.*|studio-migrations.*|studios\/new-studio|notifications.*)(?:\?.*)?$/,
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const method = request.method();
      let json: unknown = {};
      let status = 200;
      if (path === "/me")
        json = {
          id: "fixture-user",
          email: "owner@example.com",
          partner: { id: "fixture-partner", phone_verified: true },
        };
      else if (path === "/partner/me") json = { id: "fixture-partner", phone_verified: true };
      else if (path === "/partner/capabilities")
        json = {
          business_mode: "studio",
          managed_studios: [],
          teaching_studios: [],
          has_events: false,
          has_instructor_profile: false,
          landing_tab: "grafik",
        };
      else if (path === "/studio-migrations/config") json = { enabled: true };
      else if (path === "/studio-migrations/transfer-offer")
        json = { enabled: true, eligible: true };
      else if (path === "/studio-migrations" && method === "GET") json = [current];
      else if (path === "/studio-migrations" && method === "POST") {
        secrets.push(request.postDataJSON().api_key);
        json = current;
        status = 202;
      } else if (path.endsWith("/records")) {
        const params = new URL(request.url()).searchParams;
        const filtered = rows.filter(
          (row) =>
            row.kind === params.get("kind") &&
            row.name.toLowerCase().includes((params.get("search") ?? "").toLowerCase()),
        );
        const offset = Number(params.get("offset") ?? 0);
        const limit = Number(params.get("limit") ?? 30);
        json = { total: filtered.length, items: filtered.slice(offset, offset + limit) };
      } else if (path.endsWith("/selection")) {
        const change = request.postDataJSON().records[0];
        const row = rows.find((row) => row.id === change.id)!;
        row.overrides = { ...row.overrides, ...change.overrides };
        if (change.selected !== undefined) row.selected = change.selected;
        if (change.destination !== undefined) row.destination = change.destination;
        if (row.overrides.currency) row.issues = [];
        current = {
          ...current,
          revision: current.revision + 1,
          selected_count: rows.filter((r) => r.selected).length,
        };
        json = current;
      } else if (path.endsWith("/import")) {
        current = {
          ...current,
          state: "completed",
          transfer_closed: true,
          imported_count: current.selected_count,
        };
        branch.targets = {
          studio_id: "new-studio",
          slug: "studio-centrum",
          published: false,
          booking_enabled: false,
        };
        json = current;
        actions.push("import");
      } else if (path === "/studios/new-studio")
        json = {
          name: "Studio Centrum",
          description: "Prowadzimy zajęcia jogi.",
          address: "Długa 1",
          currency: "PLN",
          rooms: [{ id: "room", name: "Sala A" }],
          passes: [{ id: "pass", name: "Karnet", price: 120, currency: null }],
          migration_pending: true,
        };
      else if (path.includes("/publish/")) {
        const body = request.postDataJSON();
        expect(body.reviewed).toBe(true);
        expect(body.enable_bookings).toBe(false);
        branch.targets = { ...branch.targets, published: true };
        json = current;
        actions.push("publish");
      } else if (path.endsWith("/cancel")) {
        current = { ...current, state: "cancelled" };
        json = current;
        actions.push("cancel");
      } else if (path.endsWith("/reconnect")) {
        secrets.push(request.postDataJSON().api_key);
        current = { ...current, state: "analyzing" };
        json = current;
        actions.push("reconnect");
      } else if (path.endsWith("/retry-assets")) {
        current = { ...current, state: "importing", stage: "asset" };
        json = current;
        actions.push("retry-assets");
      } else if (path.startsWith("/studio-migrations/")) json = current;
      else if (path.includes("notifications")) json = { items: [], unread_count: 0 };
      await route.fulfill({ status, json });
    },
  );
  return { actions, secrets, rows, getJob: () => current };
}

test("connect, correct, reopen, import and explicitly publish without booking activation", async ({
  page,
}) => {
  const fixture = await mock(page);
  await page.goto(base);
  await page.getByLabel("UUID konta Fitssey").fill("fixture-source");
  await page.getByLabel("Klucz API", { exact: true }).fill("fixture-secret-only");
  await page.getByRole("button", { name: "Połącz i sprawdź dane" }).click();
  await expect(page).toHaveURL(`${base}/fixture-job`);
  await page.getByRole("button", { name: "Sprawdź i popraw" }).click();
  await page.getByLabel("Waluta (np. PLN)").fill("PLN");
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
  await expect(page.getByText("Potwierdź walutę", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Warszawa · 1 sal · PLN", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Sprawdź podsumowanie" }).click();
  await page.getByRole("checkbox", { name: "Sprawdzono wybór", exact: false }).check();
  await page.getByRole("button", { name: "Rozpocznij import", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sprawdź studia", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sprawdź i opublikuj", exact: true }).click();
  await expect(page.getByRole("button", { name: "Opublikuj studio", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: "Sprawdzono profil", exact: false }).check();
  await page.getByRole("button", { name: "Opublikuj studio", exact: true }).click();
  await expect(
    page.getByText("Opublikowano · Rezerwacje wyłączone", { exact: true }),
  ).toBeVisible();
  expect(fixture.actions).toEqual(["import", "publish"]);
  const storage = await page.evaluate(() =>
    JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }),
  );
  expect(storage).not.toContain("fixture-secret-only");
  expect(page.url()).not.toContain("fixture-secret-only");
});

for (const width of [375, 1440])
  test(`review supports keyboard and has no overflow at ${width}px`, async ({ page }, testInfo) => {
    await mock(page);
    await page.setViewportSize({ width, height: 850 });
    await page.goto(`${base}/fixture-job`);
    await expect(
      page.getByRole("heading", { name: "Wybierz dane do przeniesienia" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ),
    ).toBe(false);
    await page.getByRole("button", { name: "Grafik 1", exact: true }).click();
    await expect(page.getByText("Limit: 12", { exact: false })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`wy-fitssey-review-${width}.png`),
      fullPage: true,
    });
    const checkbox = page.getByRole("checkbox", { name: "Przenieś: Hatha" });
    await checkbox.focus();
    await page.keyboard.press("Space");
    await expect(checkbox).not.toBeChecked();
    await page.reload();
    await page.getByRole("button", { name: "Grafik 1", exact: true }).click();
    await expect(page.getByRole("checkbox", { name: "Przenieś: Hatha" })).not.toBeChecked();
  });

test("cooldown and revoked credential states are actionable", async ({ page }) => {
  const state = job("reconnect_required");
  state.error_code = "api_allowance_wait";
  state.next_run_at = "2026-10-01T18:00:00Z";
  const fixture = await mock(page, state);
  await page.goto(`${base}/fixture-job`);
  await expect(page.getByText("Fitssey ogranicza częstotliwość", { exact: false })).toBeVisible();
  await page.getByLabel("Nowy klucz API").fill("replacement-fixture-key");
  await page.getByRole("button", { name: "Połącz ponownie", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sprawdzamy konfigurację" })).toBeVisible();
  expect(fixture.actions).toEqual(["reconnect"]);
  await page.getByRole("button", { name: "Zatrzymaj import", exact: true }).click();
  await page.getByRole("button", { name: "Zatrzymaj", exact: true }).click();
  await expect(page.getByText("Import został zatrzymany", { exact: false })).toBeVisible();
});

test("empty source has a manual creation path", async ({ page }) => {
  const initial = job();
  initial.counts = {};
  const fixture = await mock(page, initial);
  await page.goto(`${base}/fixture-job`);
  await expect(
    page.getByText("Nie znaleziono lokalizacji w Fitssey", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Utwórz studio ręcznie", exact: true }),
  ).toBeVisible();
  expect(fixture.actions).toEqual([]);
});

test("large paginated selection survives search and reopening", async ({ page }) => {
  const fixture = await mock(page);
  for (let index = 0; index < 1000; index++)
    fixture.rows.push(record("member", `staff-${index}`, { name: `Staff ${index}` }));
  fixture.getJob().counts.member = 1001;
  await page.goto(`${base}/fixture-job`);
  await page.getByRole("button", { name: "Zespół 1001", exact: true }).click();
  await expect(page.getByText("1–30 z 1001", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Następna", exact: true }).click();
  const choice = page.getByRole("checkbox", { name: "Przenieś: Staff 29", exact: true });
  await choice.click();
  await expect(choice).not.toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Zespół 1001", exact: true }).click();
  await page.getByRole("textbox", { name: "Szukaj rekordów", exact: true }).fill("Staff 29");
  await expect(
    page.getByRole("checkbox", { name: "Przenieś: Staff 29", exact: true }),
  ).not.toBeChecked();
});

test("partial image failure can be retried on the same completed job", async ({ page }) => {
  const initial = job("completed");
  initial.imported_count = 5;
  initial.asset_failed_count = 2;
  const fixture = await mock(page, initial);
  fixture.getJob().branches[0].targets = {
    studio_id: "new-studio",
    slug: "studio-centrum",
    published: false,
    booking_enabled: false,
  };
  await page.goto(`${base}/fixture-job`);
  await expect(
    page.getByText("2 zdjęć nie zostało przeniesionych.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ponów przenoszenie zdjęć", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Przenosimy zdjęcia", exact: true }),
  ).toBeVisible();
  expect(fixture.actions).toEqual(["retry-assets"]);
  expect(page.url()).toContain("fixture-job");
});

test("known destination is saved before import can start", async ({ page }) => {
  await mock(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let selected: unknown;
  await page.route("**/studio-migrations/fixture-job/selection", async (route) => {
    selected = route.request().postDataJSON().records[0].destination;
    await gate;
    await route.fallback();
  });
  await page.goto(`${base}/fixture-job?studioId=new-studio`);
  await expect.poll(() => selected).toEqual({ studio_id: "new-studio" });
  await expect(page.getByRole("button", { name: "Sprawdź podsumowanie" })).toBeDisabled();
  release();
  await expect(page.getByRole("button", { name: "Sprawdź podsumowanie" })).toBeEnabled();
});

test("returning from source preview opens the editor with known source fields", async ({
  page,
}) => {
  const fixture = await mock(page);
  fixture.getJob().branches[0].destination = {
    identity: { kind: "directory", id: "chosen-directory" },
  };
  await page.goto(`${base}/fixture-job`);
  await page.getByRole("link", { name: "Wróć do edycji studia" }).click();
  await expect(page.getByRole("textbox", { name: "Nazwa studia", exact: true })).toHaveValue(
    "Studio Centrum",
  );
  await expect(page.getByPlaceholder("Wpisz adres, aby wyszukać...")).toHaveValue("Długa 1");
  await page.getByRole("textbox", { name: "Nazwa studia", exact: true }).fill("My correction");
  await page.getByRole("link", { name: "Wróć do importu", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === `${base}/fixture-job`);
  await expect
    .poll(() => fixture.getJob().branches[0].destination?.profile)
    .toMatchObject({ name: "My correction" });
  expect(fixture.getJob().branches[0].destination?.identity).toEqual({
    kind: "directory",
    id: "chosen-directory",
  });
  await page.getByRole("link", { name: "Wróć do edycji studia" }).click();
  await expect(page.getByRole("textbox", { name: "Nazwa studia", exact: true })).toHaveValue(
    "My correction",
  );
});

test("multiple branches return to separate editor sessions and only update the chosen branch", async ({
  page,
}) => {
  const fixture = await mock(page);
  const second = record("location", "branch2", {
    name: "Studio Mokotów",
    address: "Krótka 2",
    city: "Warszawa",
  });
  fixture.rows.push(second);
  fixture.getJob().branches.push(second);
  fixture.getJob().counts.location = 2;
  await page.goto(`${base}/fixture-job`);
  await expect(page.getByRole("link", { name: "Wróć do edycji studia" })).toHaveCount(0);
  await page.getByRole("link", { name: "Edytuj studio: Studio Mokotów" }).click();
  const name = page.getByRole("textbox", { name: "Nazwa studia", exact: true });
  await expect(name).toHaveValue("Studio Mokotów");
  await name.fill("Mokotów correction");
  await page.getByRole("link", { name: "Wróć do importu", exact: true }).click();
  await expect(page).toHaveURL(/fixture-job.*importBranch=branch2/);
  await expect
    .poll(() => second.destination?.profile)
    .toMatchObject({ name: "Mokotów correction" });
  expect(fixture.getJob().branches[0].destination).toEqual({});
  await page.getByRole("link", { name: "Edytuj studio: Studio Centrum" }).click();
  await expect(name).toHaveValue("Studio Centrum");
  await page.getByRole("link", { name: "Wróć do importu", exact: true }).click();
  await expect(page).toHaveURL(/fixture-job.*importBranch=branch1/);
  await page.getByRole("link", { name: "Edytuj studio: Studio Mokotów" }).click();
  await expect(name).toHaveValue("Mokotów correction");
});

test("existing configuration conflicts require an explicit separate-addition choice", async ({
  page,
}) => {
  const fixture = await mock(page);
  fixture.getJob().branches[0].issues = [];
  await page.route("**/studio-migrations/fixture-job/import", async (route) => {
    if (fixture.getJob().branches[0].destination?.add_separate_configuration)
      return route.fallback();
    return route.fulfill({
      status: 409,
      json: {
        detail: {
          code: "migration_configuration_conflict",
          record_id: "branch1",
          configuration: [{ kind: "pass", name: "Karnet" }],
        },
      },
    });
  });
  await page.goto(`${base}/fixture-job?studioId=new-studio`);
  await page.getByRole("button", { name: "Sprawdź podsumowanie" }).click();
  await page.getByRole("checkbox", { name: "Sprawdzono wybór", exact: false }).check();
  await page.getByRole("button", { name: "Rozpocznij import", exact: true }).click();
  await expect(page.getByText("Definicja karnetu: Karnet")).toBeVisible();
  expect(fixture.actions).toEqual([]);
  await page.getByRole("button", { name: "Dodaj osobne pozycje" }).click();
  await expect
    .poll(() => fixture.getJob().branches[0].destination?.add_separate_configuration)
    .toBe(true);
  await page.getByRole("button", { name: "Sprawdź podsumowanie" }).click();
  await page.getByRole("checkbox", { name: "Sprawdzono wybór", exact: false }).check();
  await page.getByRole("button", { name: "Rozpocznij import", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sprawdź studia", exact: true })).toBeVisible();
  expect(fixture.actions).toEqual(["import"]);
});

test("import preview precedes SMS and verification resumes the same job and destination", async ({
  page,
}) => {
  const fixture = await mock(page);
  fixture.getJob().branches[0].issues = [];
  fixture.getJob().branches[0].overrides = { name: "Reviewed owner name", currency: "PLN" };
  let verified = false;
  const requests: unknown[] = [];
  await page.route("**/partner/send-verification-code", (route) => route.fulfill({ json: {} }));
  await page.route("http://localhost:8000/partner", (route) => {
    expect(route.request().postDataJSON().verification_code).toBe("123456");
    verified = true;
    return route.fulfill({ json: {} });
  });
  await page.route("**/studio-migrations/fixture-job/import", (route) => {
    requests.push(route.request().postDataJSON());
    if (!verified)
      return route.fulfill({
        status: 403,
        json: { detail: { code: "phone_verification_required" } },
      });
    return route.fallback();
  });
  await page.goto(`${base}/fixture-job?studioId=new-studio`);
  const phone = page.getByRole("dialog", { name: "Zweryfikuj numer telefonu" });
  await expect(phone).toHaveCount(0);
  await page.getByRole("button", { name: "Sprawdź podsumowanie" }).click();
  await page.getByRole("checkbox", { name: "Sprawdzono wybór", exact: false }).check();
  await page.getByRole("button", { name: "Rozpocznij import", exact: true }).click();
  await phone.getByLabel("Numer telefonu *").fill("501234567");
  await phone.getByRole("button", { name: "Wyślij kod SMS" }).click();
  await phone.getByLabel("Kod weryfikacyjny *").fill("123456");
  await phone.getByRole("button", { name: "Potwierdź kod" }).click();
  await expect(page.getByRole("heading", { name: "Sprawdź studia", exact: true })).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual(requests[0]);
  expect(fixture.getJob().branches[0].destination).toEqual({ studio_id: "new-studio" });
  expect(fixture.getJob().branches[0].overrides.name).toBe("Reviewed owner name");
  expect(fixture.actions).toEqual(["import"]);
});

test("changing the catalogue destination keeps edits and uses the newly selected identity", async ({
  page,
}) => {
  const fixture = await mock(page);
  fixture.getJob().branches[0].destination = {
    identity: { kind: "directory", id: "first-source" },
  };
  await page.route("**/studio-setup/search*", (route) =>
    route.fulfill({
      json: [
        {
          kind: "directory",
          id: "second-source",
          name: "Second source",
          address: "Krótka 2",
          city: "Warszawa",
          action: "claim",
        },
      ],
    }),
  );
  let saved: Record<string, unknown> | undefined;
  await page.route("**/studio-setup/save", (route) => {
    saved = route.request().postDataJSON();
    return route.fulfill({
      json: { id: "new-studio", name: "Owner correction", is_listed: false },
    });
  });
  await page.goto(`${base}/fixture-job`);
  await page.getByRole("link", { name: "Wróć do edycji studia" }).click();
  const name = page.getByRole("textbox", { name: "Nazwa studia", exact: true });
  await expect(name).toHaveValue("Studio Centrum");
  await name.fill("Owner correction");
  await page.getByRole("link", { name: "Wróć do importu", exact: true }).click();
  await expect(page).toHaveURL(/fixture-job/);
  await page.getByRole("button", { name: "Zmień", exact: true }).click();
  await page.getByRole("textbox", { name: "Nazwa studia", exact: true }).fill("Second source");
  await page.getByRole("button", { name: "To moje studio", exact: true }).click();
  await expect
    .poll(() => fixture.getJob().branches[0].destination?.identity)
    .toEqual({ kind: "directory", id: "second-source" });
  await page.getByRole("link", { name: "Wróć do edycji studia" }).click();
  await expect(name).toHaveValue("Owner correction");
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect.poll(() => saved?.identity).toEqual({ kind: "directory", id: "second-source" });
  expect(saved?.profile).toMatchObject({ name: "Owner correction" });
});

test("explicit new destination survives reopening an import with an existing origin", async ({
  page,
}) => {
  const fixture = await mock(page);
  fixture.getJob().origin_studio_id = "new-studio";
  await page.goto(`${base}/fixture-job?studioId=new-studio`);
  await expect.poll(() => fixture.getJob().branches[0].destination?.studio_id).toBe("new-studio");
  await page.getByRole("button", { name: "Zmień", exact: true }).click();
  await page.getByRole("button", { name: "Dodaj inną lokalizację" }).click();
  await expect.poll(() => fixture.getJob().branches[0].destination?.new_studio).toBe(true);
  await page.reload();
  await page.getByRole("link", { name: "Wróć do edycji studia" }).click();
  await expect(page).toHaveURL(/\/studio\/create\?/);
  await expect(page.getByRole("textbox", { name: "Nazwa studia", exact: true })).toHaveValue(
    "Studio Centrum",
  );
  expect(fixture.getJob().branches[0].destination).toEqual({ new_studio: true });
});

test("disabled runtime keeps saved jobs readable and prevents a new connection", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/studio-migrations/transfer-offer**", (route) =>
    route.fulfill({ json: { enabled: false, eligible: true, visible: true } }),
  );
  await page.goto(base);
  await expect(
    page.getByText("Nowe importy są chwilowo niedostępne.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("UUID konta Fitssey")).toHaveCount(0);
  await expect(page.locator('a[href$="/fitssey/fixture-job"]')).toBeVisible();
});
