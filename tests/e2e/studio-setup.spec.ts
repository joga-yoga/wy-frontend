import { expect, type Page, test } from "@playwright/test";

const savedStudio = {
  id: "saved-studio",
  name: "Studio Łąka",
  address: "Długa 12/3",
  status: "claimed",
  rooms: [],
  passes: [],
  sport_card_acceptances: [],
  amenity_ids: [],
  instructor_links: [],
  social_links: [],
  image_ids: [],
  slug: "studio-laka",
  is_listed: false,
};

test("anonymous draft entry keeps its identity and setup in the login return", async ({ page }) => {
  await page.route("http://localhost:8000/me", (route) =>
    route.fulfill({ status: 401, json: { detail: "Not authenticated" } }),
  );
  const destination = "/account/partner/studio/create?draft=public-token&setup=private-session";
  await page.goto(destination);
  await expect(page).toHaveURL(/\/account\/login\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe(destination);
});
async function ownerSession(page: Page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("fixture-auth-initialized")) return;
    sessionStorage.setItem("fixture-auth-initialized", "true");
    const token = btoa(JSON.stringify({ sub: "fixture-user", email: "owner@example.com" }));
    localStorage.setItem("access_token", `e30.${token}.fixture`);
  });
  await page.route("http://localhost:8000/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = [];
    if (path === "/me")
      json = {
        id: "fixture-user",
        email: "owner@example.com",
        partner: { id: "fixture-partner", phone_verified: false },
      };
    else if (path === "/partner/me") json = { id: "fixture-partner", phone_verified: false };
    else if (path === "/partner/capabilities")
      json = {
        business_mode: "studio",
        managed_studios: [],
        teaching_studios: [],
        has_events: false,
        has_instructor_profile: false,
        landing_tab: "grafik",
      };
    else if (path === "/studio-setup/duplicates")
      json = { matches: [], fingerprint: "empty", requires_choice: false };
    else if (path === "/studios/saved-studio") json = savedStudio;
    else if (path.includes("notifications")) json = { items: [], unread_count: 0 };
    else if (path === "/studio-migrations/transfer-offer")
      json = { enabled: true, eligible: true, visible: true };
    return route.fulfill({ json });
  });
}

test("manual save confirms a duplicate choice and resumes the same operation after late SMS", async ({
  page,
}) => {
  await ownerSession(page);
  const submissions: Record<string, unknown>[] = [];
  let verified = false;
  await page.route("**/partner/send-verification-code", (route) => route.fulfill({ json: {} }));
  await page.route("http://localhost:8000/partner", (route) => {
    expect(route.request().postDataJSON().verification_code).toBe("123456");
    verified = true;
    return route.fulfill({ json: {} });
  });
  await page.route("**/studio-setup/save", (route) => {
    const body = route.request().postDataJSON();
    submissions.push(body);
    if (!body.duplicate_ack)
      return route.fulfill({
        status: 409,
        json: {
          detail: {
            code: "studio_match_required",
            matches: [],
            fingerprint: "opaque-choice",
            requires_choice: true,
          },
        },
      });
    if (!verified)
      return route.fulfill({
        status: 403,
        json: { detail: { code: "phone_verification_required" } },
      });
    return route.fulfill({ json: savedStudio });
  });
  await page.goto("/account/partner/studio/create?step=manual&setup=fixture-manual");
  await page.getByRole("textbox", { name: "Nazwa studia", exact: true }).fill("Studio Łąka");
  await expect(page.getByRole("dialog", { name: "Zweryfikuj numer telefonu" })).toHaveCount(0);
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(page.getByText("Sprawdź nazwę i adres.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "To inne studio" }).click();
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  const phone = page.getByRole("dialog", { name: "Zweryfikuj numer telefonu" });
  await phone.getByLabel("Numer telefonu *").fill("501234567");
  await phone.getByRole("button", { name: "Wyślij kod SMS" }).click();
  await phone.getByLabel("Kod weryfikacyjny *").fill("123456");
  await phone.getByRole("button", { name: "Potwierdź kod" }).click();
  await expect(page).toHaveURL(/\/studio\/saved-studio\/edit$/);
  expect(submissions).toHaveLength(3);
  expect(new Set(submissions.map((s) => s.operation_key)).size).toBe(1);
  expect(submissions[2].duplicate_ack).toBe("opaque-choice");
  expect(submissions[2].profile).toMatchObject({ name: "Studio Łąka" });
});

test("a late directory match attaches to the current studio instead of creating another", async ({
  page,
}) => {
  await ownerSession(page);
  await page.route("**/studio-setup/duplicates", (route) =>
    route.fulfill({
      json: {
        matches: [
          {
            kind: "directory",
            id: "directory-1",
            name: "Studio Łąka",
            address: "Długa 12/3",
            city: "Łódź",
            action: "claim",
          },
        ],
        fingerprint: "directory-match",
        requires_choice: true,
      },
    }),
  );
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/studio-setup/save", (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ json: savedStudio });
  });
  await page.goto("/account/partner/studio/saved-studio/edit");
  await page.getByRole("button", { name: "To moje studio" }).click();
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect
    .poll(() => submitted)
    .toMatchObject({
      studio_id: "saved-studio",
      identity: { kind: "directory", id: "directory-1" },
    });
  expect(submitted?.operation_key).toBeTruthy();
});

test("navigation restores this account's edits; logout and another account keep the shared snapshot isolated", async ({
  page,
}) => {
  await ownerSession(page);
  await page.route("**/studio-setup/drafts/shared-public", (route) =>
    route.fulfill({
      json: {
        public_token: "shared-public",
        profile: { name: "Public catalogue name" },
        identity: { kind: "directory", id: "catalogue-one" },
        enrichment_state: "completed",
      },
    }),
  );
  const editor = "/account/partner/studio/create?draft=shared-public&setup=shared-setup";
  await page.goto(editor);
  const name = page.getByRole("textbox", { name: "Nazwa studia", exact: true });
  await expect(name).toHaveValue("Public catalogue name");
  await name.fill("Account A private edit");
  await page.goto("/account/partner/menu");
  await page.goBack();
  await expect(name).toHaveValue("Account A private edit");
  await page.goto("/account/partner/menu");
  await page.getByRole("button", { name: "Twój profil instruktora" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Wyloguj się" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("access_token"))).toBeNull();
  await page.route("http://localhost:8000/me", (route) =>
    route.fulfill({
      json: {
        id: "account-b",
        email: "second@example.com",
        partner: { id: "partner-b", phone_verified: false },
      },
    }),
  );
  await page.route("http://localhost:8000/partner/me", (route) =>
    route.fulfill({ json: { id: "partner-b", phone_verified: false } }),
  );
  await page.evaluate(() => {
    const token = btoa(JSON.stringify({ sub: "account-b", email: "second@example.com" }));
    localStorage.setItem("access_token", `e30.${token}.fixture`);
  });
  await page.goto(editor);
  await expect(name).toHaveValue("Public catalogue name");
  await expect(page.getByText("Account A private edit", { exact: true })).toHaveCount(0);
});

test("late enrichment leaves edited and focused fields untouched", async ({ page }) => {
  await ownerSession(page);
  let calls = 0;
  await page.route("**/studio-setup/drafts/late-source", (route) => {
    calls += 1;
    return route.fulfill({
      json: {
        public_token: "late-source",
        identity: { kind: "directory", id: "catalogue-one" },
        enrichment_state: calls === 1 ? "pending" : "completed",
        profile:
          calls === 1
            ? { name: "Catalogue name", description: "Original description" }
            : { name: "Enriched name", description: "Late description", currency: "EUR" },
      },
    });
  });
  await page.goto("/account/partner/studio/create?draft=late-source");
  const name = page.getByRole("textbox", { name: "Nazwa studia", exact: true });
  await expect(name).toHaveValue("Catalogue name");
  await name.fill("Owner correction");
  const description = page.locator("#description");
  await description.focus();
  await expect.poll(() => calls).toBe(2);
  await expect(name).toHaveValue("Owner correction");
  await expect(description).toHaveValue("Original description");
});

test("catalogue address is visible and a manual correction survives navigation", async ({
  page,
}) => {
  await ownerSession(page);
  await page.route("**/studio-setup/drafts/address-source", (route) =>
    route.fulfill({
      json: {
        profile: { name: "Catalogue name", address: "Długa 1", city: "Łódź" },
        identity: { kind: "directory", id: "address-row" },
        enrichment_state: "completed",
      },
    }),
  );
  await page.goto("/account/partner/studio/create?draft=address-source");
  const address = page.getByPlaceholder("Wpisz adres, aby wyszukać...");
  await expect(address).toHaveValue("Długa 1");
  await address.fill("Krótka 2");
  await page.goto("/account/partner/menu");
  await page.goBack();
  await expect(address).toHaveValue("Krótka 2");
});

for (const studioCount of [0, 1, 2]) {
  test(`main import entry confirms account dismissal with ${studioCount} studios`, async ({
    page,
  }) => {
    await ownerSession(page);
    let account = "fixture-user";
    const hidden = new Set<string>();
    let writes = 0;
    await page.route("**/me", (route) =>
      route.fulfill({
        json: {
          id: account,
          email: `${account}@example.com`,
          partner: { id: account, phone_verified: false },
        },
      }),
    );
    await page.route("**/partner/capabilities", (route) =>
      route.fulfill({
        json: {
          business_mode: "studio",
          managed_studios: Array.from({ length: studioCount }, (_, i) => ({
            id: i ? "second-studio" : "saved-studio",
            name: `Studio ${i}`,
          })),
          teaching_studios: [],
          has_events: false,
          has_instructor_profile: false,
          landing_tab: "grafik",
        },
      }),
    );
    await page.route("**/studio-migrations/menu-preference", (route) =>
      route.fulfill({ json: { enabled: true, visible: !hidden.has(account) } }),
    );
    await page.route("**/studio-migrations/menu-preference/hide", (route) => {
      writes++;
      hidden.add(account);
      return route.fulfill({ json: { visible: false } });
    });
    await page.route("http://localhost:8000/studio-migrations", (route) =>
      route.fulfill({
        json: [
          {
            id: "existing-job",
            source_uuid: "saved-source",
            state: "review",
            transfer_closed: false,
          },
        ],
      }),
    );
    await page.goto("/account/partner/menu");
    const entry = page.getByRole("link", { name: "Przenieś studio z Fitssey", exact: false });
    await expect(entry).toHaveCount(1);
    await expect(entry).toBeVisible();
    await page.getByRole("button", { name: "Ukryj import danych" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText("Ukryć import danych?", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
    expect(writes).toBe(0);
    await expect(entry).toBeVisible();
    await page.getByRole("button", { name: "Ukryj import danych" }).click();
    await dialog.getByRole("button", { name: "Ukryj", exact: true }).click();
    await expect(entry).toHaveCount(0);
    expect(writes).toBe(1);
    await expect(page.getByRole("button", { name: "Cofnij", exact: true })).toHaveCount(0);
    const saved = page.locator('a[href$="/fitssey/existing-job"]');
    await expect(saved).toBeVisible();
    await page.reload();
    await expect(saved).toBeVisible();
    await expect(entry).toHaveCount(0);
    await page.getByRole("button", { name: "Twój profil instruktora" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Wyloguj się" }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("access_token"))).toBeNull();
    async function login(id: string) {
      account = id;
      await page.evaluate(
        (sub) =>
          localStorage.setItem("access_token", `e30.${btoa(JSON.stringify({ sub }))}.fixture`),
        id,
      );
      await page.goto("/account/partner/menu");
      await page.getByRole("button", { name: "Twój profil instruktora" }).click();
      const drawer = page.getByRole("dialog");
      await expect(drawer.getByRole("button", { name: "Wyloguj się" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
    }
    await login("fixture-user");
    await expect(saved).toBeVisible();
    await expect(entry).toHaveCount(0);
    await login("other-account");
    await expect(entry).toBeVisible();
    await login("fixture-user");
    await expect(saved).toBeVisible();
    await expect(entry).toHaveCount(0);
    await page.goto("/account/partner/studio/saved-studio/edit");
    await expect(page.getByRole("textbox", { name: "Nazwa studia", exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Pokaż import danych w menu" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Przenieś.*Fitssey/ })).toHaveCount(0);
    await page.goto("/account/partner/menu/studio/saved-studio");
    await expect(page.getByRole("link", { name: /Przenieś.*Fitssey/ })).toHaveCount(0);
  });
}

test("failed account dismissal leaves the menu entry available", async ({ page }) => {
  await ownerSession(page);
  await page.route("**/studio-migrations/menu-preference", (route) =>
    route.fulfill({ json: { enabled: true, visible: true } }),
  );
  await page.route("**/studio-migrations/menu-preference/hide", (route) =>
    route.fulfill({ status: 503, json: { detail: "Unavailable" } }),
  );
  await page.goto("/account/partner/menu");
  await page.getByRole("button", { name: "Ukryj import danych" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Ukryj", exact: true }).click();
  await expect(page.getByText("Nie udało się zapisać ustawienia. Spróbuj ponownie.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Przenieś studio z Fitssey/ })).toBeVisible();
});

test("published claim keeps canonical preview and complete pricing through SMS and reload", async ({
  page,
}) => {
  await ownerSession(page);
  const snapshot = {
    name: "Source business",
    slug: "exact-published-url",
    is_listed: true,
    address: "Plac 2/16",
    city: "Warszawa",
    latitude: 52.2,
    longitude: 21.0,
    drop_in_price: 55,
    currency: "EUR",
    passes: [
      {
        name: "Four visits",
        price: 140,
        currency: "EUR",
        session_count: 4,
        duration_days: null,
        duration_unknown: true,
      },
    ],
  };
  let preparations = 0;
  let verified = false;
  const submissions: Array<{ profile: Record<string, unknown>; operation_key: string }> = [];
  await page.route("**/studio-setup/drafts", (route) => {
    preparations++;
    return route.fulfill({ json: {} });
  });
  await page.route("**/studio-setup/drafts/published-source", (route) =>
    route.fulfill({
      json: {
        profile: snapshot,
        identity: { kind: "directory", id: "source-one" },
        enrichment_state: "failed",
        source_public: true,
        source_slug: snapshot.slug,
      },
    }),
  );
  await page.route("**/studio-setup/save", (route) => {
    submissions.push(route.request().postDataJSON());
    return verified
      ? route.fulfill({ json: { ...savedStudio, ...snapshot } })
      : route.fulfill({
          status: 403,
          json: { detail: { code: "phone_verification_required" } },
        });
  });
  await page.route("**/partner/send-verification-code", (route) => route.fulfill({ json: {} }));
  await page.route("http://localhost:8000/partner", (route) => {
    verified = true;
    return route.fulfill({ json: {} });
  });
  await page.goto("/account/partner/studio/create?draft=published-source&setup=published-setup");
  const name = page.getByRole("textbox", { name: "Nazwa studia", exact: true });
  await expect(name).toHaveValue(snapshot.name);
  await expect(page.locator('[data-setup-field="currency"]')).toHaveText("EUR");
  await expect(page.locator("#slug")).toHaveValue(snapshot.slug);
  await expect(page.getByRole("button", { name: "Opublikuj", exact: false })).toHaveCount(0);
  await expect(page.getByText("Strona publiczna", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Zobacz profil" })).toHaveAttribute(
    "href",
    `/studio/${snapshot.slug}`,
  );
  await name.fill("Owner correction");
  await page.reload();
  await expect(name).toHaveValue("Owner correction");
  await expect(page.locator('[data-setup-field="currency"]')).toHaveText("EUR");
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  const phone = page.getByRole("dialog", { name: "Zweryfikuj numer telefonu" });
  await phone.getByLabel("Numer telefonu *").fill("501234567");
  await phone.getByRole("button", { name: "Wyślij kod SMS" }).click();
  await phone.getByLabel("Kod weryfikacyjny *").fill("123456");
  await phone.getByRole("button", { name: "Potwierdź kod" }).click();
  await expect(page).toHaveURL(/\/studio\/saved-studio\/edit$/);
  expect(submissions).toHaveLength(2);
  expect(new Set(submissions.map((s) => s.operation_key)).size).toBe(1);
  expect(submissions[1].profile).toMatchObject({
    name: "Owner correction",
    slug: snapshot.slug,
    drop_in_price: 55,
    currency: "EUR",
    passes: [{ id: null, duration_days: null, duration_unknown: true, session_count: 4 }],
  });
  expect(preparations).toBe(0);
});
