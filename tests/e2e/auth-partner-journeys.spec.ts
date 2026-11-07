import { type BrowserContext, expect, type Page, test } from "@playwright/test";

const email = "owner@example.com";
const token = `e30.${Buffer.from(JSON.stringify({ sub: "fixture-user", email })).toString("base64url")}.fixture`;
const destination = "/account/partner/studio/create?draft=public-token&setup=private-session";

type Fixture = {
  partner: boolean;
  verified: boolean;
  creates: number;
  inviteReads: number;
  registeredNext?: string;
  resetNext?: string;
};
async function fixture(
  context: BrowserContext,
  options: {
    partner?: boolean;
    verified?: boolean;
    invites?: boolean;
    failInvites?: boolean;
    failMe?: boolean;
    exists?: boolean;
    userEmail?: string;
  } = {},
) {
  const state: Fixture = {
    partner: options.partner ?? false,
    verified: options.verified ?? true,
    creates: 0,
    inviteReads: 0,
  };
  await context.route("http://localhost:8000/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = [];
    let status = 200;
    const partner = {
      id: "fixture-partner",
      user_id: "fixture-user",
      phone_verified: state.verified,
    };
    if (path === "/me") {
      if (options.failMe) status = 503;
      json = {
        id: "fixture-user",
        email: options.userEmail ?? email,
        partner: state.partner ? partner : null,
      };
    } else if (path === "/partner/me") {
      status = state.partner ? 200 : 404;
      json = state.partner ? partner : { detail: "User is not a partner" };
    } else if (path === "/partner/instant") {
      state.creates++;
      state.partner = true;
      json = partner;
    } else if (path === "/check-email") json = { exists: options.exists ?? false };
    else if (path === "/register") {
      state.registeredNext = route.request().postDataJSON().next;
      json = {};
    } else if (["/verify-email", "/login", "/reset-password"].includes(path))
      json = { access_token: token };
    else if (path === "/forgot-password") {
      state.resetNext = route.request().postDataJSON().next;
      json = {};
    } else if (path === "/users/me/invitations") {
      state.inviteReads++;
      status = options.failInvites ? 503 : 200;
      json = options.invites ? [{ id: "invite", kind: "studio_claim" }] : [];
    } else if (path === "/partner/capabilities")
      json = {
        business_mode: null,
        managed_studios: [],
        teaching_studios: [],
        has_events: false,
        has_instructor_profile: false,
        landing_tab: "rezerwacje",
      };
    else if (path.includes("inbox") || path.includes("notifications"))
      json = { items: [], unread_count: 0 };
    else if (path.endsWith("/class-templates")) json = { total: 0, items: [] };
    else if (path === "/studio-setup/drafts/public-token")
      json = {
        public_token: "public-token",
        status: "pending",
        profile: {
          name: "Studio Test",
          slug: "studio-test",
          address: "Długa 1",
          prices: [],
          passes: [],
          rooms: [],
        },
      };
    else if (path === "/studio-migrations/menu-preference") json = { enabled: true, visible: true };
    else if (path === "/studio-migrations/transfer-offer")
      json = { enabled: true, eligible: true, visible: true };
    else if (path === "/studio-setup/duplicates")
      json = { matches: [], fingerprint: "empty", requires_choice: false };
    else if (route.request().method() !== "GET") throw new Error(`Unexpected mutation: ${path}`);
    await route.fulfill({ status, json });
  });
  return state;
}
async function session(page: Page, stale = false) {
  await page.addInitScript(
    ({ token, stale }) => {
      localStorage.setItem("access_token", token);
      if (stale) {
        localStorage.setItem("wy_last_mode", "b2b");
        localStorage.setItem(
          "wy_auth_next",
          "/account/partner/studio/create?draft=another-account",
        );
      }
    },
    { token, stale },
  );
}
async function signup(page: Page) {
  await page.getByLabel("Adres e-mail", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Dalej", exact: true }).click();
  await page.locator("#signup-password").fill("fixture-password");
  await page.getByRole("button", { name: "Zarejestruj się", exact: true }).click();
}

test("fresh direct business registration continues in another browser without role switching", async ({
  page,
  context,
  browser,
}) => {
  const first = await fixture(context);
  await page.goto(destination);
  await expect(page).toHaveURL(/account\/login\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe(destination);
  await signup(page);
  await expect.poll(() => first.registeredNext).toBe(destination);
  expect(first.creates).toBe(0);
  const fresh = await browser.newContext();
  try {
    const state = await fixture(fresh);
    const verify = await fresh.newPage();
    const visits: string[] = [];
    verify.on("framenavigated", (frame) => {
      if (frame === verify.mainFrame()) visits.push(new URL(frame.url()).pathname);
    });
    await verify.goto(
      `http://localhost:3000/account/auth/verify-email?token=verification&next=${encodeURIComponent(first.registeredNext!)}`,
    );
    await expect(verify).toHaveURL(`http://localhost:3000${destination}`);
    await expect.poll(() => state.creates).toBe(1);
    await expect(verify.getByRole("textbox", { name: "Nazwa studia", exact: true })).toBeVisible();
    expect(visits).not.toContain("/account");
    expect(state.partner).toBe(true);
  } finally {
    await fresh.close();
  }
});

test("direct manual business entry creates once; refresh and existing switches keep Partner", async ({
  page,
  context,
}) => {
  const state = await fixture(context);
  await session(page);
  await page.goto(
    "/account/partner/studio/create?step=manual&name=Studio%20Test&setup=manual-session",
  );
  await expect(page.getByRole("textbox", { name: "Nazwa studia", exact: true })).toHaveValue(
    "Studio Test",
  );
  expect(state.creates).toBe(1);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Nazwa studia", exact: true })).toBeVisible();
  expect(state.creates).toBe(1);
  await page.goto("/account");
  await expect(page.getByRole("link", { name: "Przełącz na konto partnera" })).toBeVisible();
  await page.goto("/account/partner/menu");
  await expect(page.getByRole("link", { name: /Przełącz na konto osobiste/ })).toHaveAttribute(
    "href",
    "/account",
  );
  expect(state.creates).toBe(1);
});

for (const entry of [
  "/account/login?email=owner%40example.com",
  "/account/login?email=owner%40example.com&next=%2Faccount%2Fpartner",
]) {
  test(`invitation entry ${entry}`, async ({ page, context }) => {
    const state = await fixture(context, { invites: true });
    await session(page);
    await page.goto(entry);
    await expect(page).toHaveURL(/account\/partner\/bookings/);
    expect(state.creates).toBe(1);
    expect(state.inviteReads).toBe(entry.includes("next=") ? 0 : 1);
  });
}
for (const options of [
  {},
  { failInvites: true },
  { invites: true, userEmail: "other@example.com" },
]) {
  test(`legacy invitation rejects absent, expired, mismatch or failed evidence ${JSON.stringify(options)}`, async ({
    page,
    context,
  }) => {
    const state = await fixture(context, options);
    await session(page, true);
    await page.goto("/account/login?email=owner%40example.com");
    await expect(page).toHaveURL("http://localhost:3000/account");
    expect(state.creates).toBe(0);
    expect(state.partner).toBe(false);
  });
}

test("legacy signup carries email-only context through verification and OAuth", async ({
  page,
  context,
}) => {
  const state = await fixture(context, { invites: true });
  await page.goto("/account/login?email=owner%40example.com");
  await page.locator("#signup-password").fill("fixture-password");
  await page.getByRole("button", { name: "Zarejestruj się", exact: true }).click();
  await expect.poll(() => state.registeredNext).toBe("/account/login?email=owner%40example.com");
  await page.goto(
    `/account/auth/callback?token=${token}&next=${encodeURIComponent(state.registeredNext!)}`,
  );
  await expect(page).toHaveURL(/account\/partner\/bookings/);
  expect(state.creates).toBe(1);
});

for (const path of [
  "/account/login",
  `/account/auth/callback?token=${token}`,
  "/account/auth/verify-email?token=verification",
  "/account/login?email=owner%40example.com&next=%2Faccount",
  "/account/login?next=%2Fbook%2Fpass%2Ffixture-pass",
  "/account/login?next=%2Fbook%2Fclass%2Ffixture-class",
  "/platnosc/powrot",
]) {
  test(`customer journey never provisions: ${path}`, async ({ page, context }) => {
    const state = await fixture(context, { invites: true });
    await session(page, true);
    await page.goto(path);
    if (path.includes("next="))
      await expect(page).toHaveURL(
        `http://localhost:3000${new URL(path, "http://localhost").searchParams.get("next")}`,
      );
    else if (!path.includes("platnosc"))
      await expect(page).toHaveURL("http://localhost:3000/account");
    await expect(page.locator("body")).toBeVisible();
    expect(state.creates).toBe(0);
    expect(state.partner).toBe(false);
    expect(state.inviteReads).toBe(0);
  });
}

for (const [partner, next, expected] of [
  [false, "", "/account"],
  [true, "", "/account/partner/bookings"],
  [false, "/account", "/account"],
  [
    false,
    "/account/partner/studio/create?step=manual",
    "/account/partner/studio/create?step=manual",
  ],
] as const) {
  test(`reset existing account partner=${partner} next=${next}`, async ({ page, context }) => {
    const state = await fixture(context, { partner });
    await page.goto(
      `/account/reset-password?token=${token}${next ? `&next=${encodeURIComponent(next)}` : ""}`,
    );
    await page.getByLabel("Nowe hasło", { exact: true }).fill("changed-password");
    await page.getByRole("button", { name: "Zaktualizuj", exact: true }).click();
    await expect(page).toHaveURL(`http://localhost:3000${expected}`);
    await expect.poll(() => state.creates).toBe(!partner && next.includes("/partner") ? 1 : 0);
  });
}

test("failed authoritative account read after reset cannot provision", async ({
  page,
  context,
}) => {
  const state = await fixture(context, { failMe: true });
  await page.goto(`/account/reset-password?token=${token}`);
  await page.getByLabel("Nowe hasło", { exact: true }).fill("changed-password");
  await page.getByRole("button", { name: "Zaktualizuj", exact: true }).click();
  await expect(page).toHaveURL(/account\/login/);
  expect(state.creates).toBe(0);
});

for (const width of [390, 1280]) {
  test(`studio avatar preserves customer and Partner destinations at ${width}px`, async ({
    page,
    context,
    request,
  }) => {
    const studios = (await (await request.get("http://localhost:8000/public/studios")).json()) as {
      slug: string;
    }[];
    expect(studios.length).toBeGreaterThan(0);
    const state = await fixture(context);
    await session(page, true);
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/studio/${studios[0].slug}`);
    const avatar = page.locator('header a[href="/account"]');
    await expect(avatar).toBeVisible();
    await avatar.click();
    await expect(page).toHaveURL("http://localhost:3000/account");
    await expect(page.getByRole("link", { name: "Przełącz na konto partnera" })).toHaveCount(0);
    expect(state.creates).toBe(0);
    expect(state.partner).toBe(false);
    state.partner = true;
    await page.goto(`/studio/${studios[0].slug}`);
    await expect(page.locator('header a[href="/account/partner"]')).toBeVisible();
    expect(state.creates).toBe(0);
  });
}

for (const partner of [false, true]) {
  test(`password login waits for confirmed account with stale B2B; partner=${partner}`, async ({
    page,
    context,
  }) => {
    const state = await fixture(context, { partner, exists: true });
    await page.addInitScript(() => localStorage.setItem("wy_last_mode", "b2b"));
    await page.goto("/account/login");
    await page.getByLabel("Adres e-mail", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Dalej", exact: true }).click();
    await page.locator("#login-password").fill("fixture-password");
    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(page).toHaveURL(
      `http://localhost:3000${partner ? "/account/partner/bookings" : "/account"}`,
    );
    expect(state.creates).toBe(0);
    expect(state.partner).toBe(partner);
  });
}

test("ordinary signup does not convert device preference into a business next", async ({
  page,
  context,
}) => {
  const state = await fixture(context);
  await page.addInitScript(() => {
    localStorage.setItem("wy_last_mode", "b2b");
    localStorage.setItem("wy_auth_next", "/account/partner");
  });
  await page.goto("/account/login");
  const registered = page.waitForRequest((req) => new URL(req.url()).pathname === "/register");
  await signup(page);
  expect((await registered).postDataJSON()).not.toHaveProperty("next");
  await page.goto("/account/auth/verify-email?token=verification");
  await expect(page).toHaveURL("http://localhost:3000/account");
  expect(state.creates).toBe(0);
  expect(state.partner).toBe(false);
});

for (const path of [
  "/account/partner/studio/import/fitssey?name=Studio&draft=token&setup=session",
  "/account/partner/workshops/create?source=url",
]) {
  test(`business continuation ${path}`, async ({ page, context }) => {
    const state = await fixture(context);
    await session(page);
    await page.goto(path);
    await expect.poll(() => state.creates).toBe(1);
    await expect(page).toHaveURL(`http://localhost:3000${path}`);
    await expect(page.locator("main").first()).toBeVisible();
  });
}

test("marketing CTA retains automatic Partner", async ({ page, context }) => {
  const state = await fixture(context);
  await session(page);
  await page.goto("/partners");
  await page.locator('a[href="/account/partner"]:visible').first().click();
  await expect(page).toHaveURL(/account\/partner\/bookings/);
  expect(state.creates).toBe(1);
});

for (const alreadyVerified of [false, true]) {
  test(`instructor claim completes in usable editor; verified=${alreadyVerified}`, async ({
    page,
    context,
  }) => {
    const state = await fixture(context, {
      partner: alreadyVerified,
      verified: alreadyVerified,
      exists: true,
    });
    if (alreadyVerified) await session(page);
    const events: string[] = [];
    await context.route("**/instructor-profile-drafts/teacher-token/claim", async (route) => {
      events.push("claim");
      await route.fulfill(
        state.verified
          ? {
              json: {
                instructor_id: "teacher",
                edit_url: "/account/partner/instructors/teacher/edit",
                status: "claimed",
              },
            }
          : { status: 403, json: { detail: { code: "partner_required" } } },
      );
    });
    await context.route("**/instructors/teacher", (route) =>
      route.fulfill({
        json: {
          id: "teacher",
          name: "Anna Test",
          yoga_styles: [],
          social_links: [],
          is_claimed: true,
          is_published: false,
          languages: ["pl"],
          cities: [],
          certificates: [],
          photo_ids: [],
        },
      }),
    );
    await context.route("**/partner/send-verification-code", (route) => {
      events.push("sms");
      return route.fulfill({ json: {} });
    });
    await context.route("http://localhost:8000/partner", (route) => {
      if (route.request().postDataJSON().verification_code !== "123456")
        return route.fulfill({ status: 400, json: { detail: "Nieprawidłowy kod" } });
      state.verified = true;
      events.push("verified");
      return route.fulfill({
        json: {
          id: "fixture-partner",
          user_id: "fixture-user",
          phone_verified: true,
          phone_number: "+48501234567",
        },
      });
    });
    await page.goto("/instruktor/dodaj/claim/teacher-token");
    if (!alreadyVerified) {
      await expect(page).toHaveURL(/account\/login\?next=/);
      expect(new URL(page.url()).searchParams.get("next")).toBe(
        "/instruktor/dodaj/claim/teacher-token",
      );
      await page.getByLabel("Adres e-mail", { exact: true }).fill(email);
      await page.getByRole("button", { name: "Dalej", exact: true }).click();
      await page.locator("#login-password").fill("fixture-password");
      await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
      await expect(page).toHaveURL(/become-partner\?next=/);
      expect(new URL(page.url()).searchParams.get("next")).toBe(
        "/instruktor/dodaj/claim/teacher-token",
      );
      await page.getByLabel("Numer telefonu *").fill("501234567");
      await page.getByRole("button", { name: "Wyślij kod SMS" }).click();
      await page.getByLabel("Kod weryfikacyjny *").fill("000000");
      await page.getByRole("button", { name: "Potwierdź kod" }).click();
      await expect(page.getByText("Nieprawidłowy kod", { exact: true })).toBeVisible();
      expect(events).toEqual(["claim", "sms"]);
      await page.getByLabel("Kod weryfikacyjny *").fill("123456");
      await page.getByRole("button", { name: "Potwierdź kod" }).click();
    }
    await expect(page).toHaveURL(/instructors\/teacher\/edit/);
    await expect(page.getByLabel("Imię i nazwisko *")).toHaveValue("Anna Test");
    await page.getByLabel("Imię i nazwisko *").fill("Anna Edited");
    await expect(page.getByLabel("Imię i nazwisko *")).toHaveValue("Anna Edited");
    expect(events).toEqual(alreadyVerified ? ["claim"] : ["claim", "sms", "verified", "claim"]);
    expect(state.creates).toBe(alreadyVerified ? 0 : 1);
  });
}

test("existing create Partner action still uses instant once", async ({ page, context }) => {
  const state = await fixture(context);
  await session(page);
  await page.goto("/account");
  await page.getByRole("button", { name: "Załóż konto partnera", exact: true }).click();
  await expect(page).toHaveURL(/account\/partner\/bookings/);
  expect(state.creates).toBe(1);
});

test("recovery request carries only the currently selected destination", async ({
  page,
  context,
}) => {
  const state = await fixture(context, { exists: true });
  await page.goto(`/account/login?next=${encodeURIComponent(destination)}`);
  await page.getByLabel("Adres e-mail", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Dalej", exact: true }).click();
  await page.getByText("Nie pamiętasz hasła?", { exact: true }).click();
  await page.locator("#forgot-email").fill(email);
  await page.getByRole("button", { name: "Wyślij link resetujący" }).click();
  await expect.poll(() => state.resetNext).toBe(destination);
  expect(state.creates).toBe(0);
});

test("paid pass return keeps customer account and studio destinations", async ({
  page,
  context,
}) => {
  const state = await fixture(context, { invites: true });
  await session(page, true);
  await context.route("**/payments/state?*", (route) =>
    route.fulfill({
      json: { state: "paid", studio_slug: "fixture-studio", pass_id: "fixture-pass" },
    }),
  );
  await page.goto("/platnosc/powrot?pass=fixture-user-pass");
  await page.getByRole("button", { name: "Moje karnety" }).click();
  await expect(page).toHaveURL("http://localhost:3000/account");
  expect(state.creates).toBe(0);
  expect(state.partner).toBe(false);
});

for (const failure of ["read", "create-confirmed", "create-failed", "expired"] as const) {
  test(`bootstrap recovery: ${failure}`, async ({ page, context }) => {
    const state = await fixture(context);
    await session(page);
    let reads = 0;
    let recovered = false;
    const partner = { id: "fixture-partner", user_id: "fixture-user", phone_verified: true };
    await context.route("**/partner/me", (route) => {
      reads++;
      const confirmed = recovered || (failure === "create-confirmed" && reads > 1);
      return route.fulfill(
        confirmed
          ? { json: partner }
          : {
              status: failure === "read" ? 503 : failure === "expired" ? 401 : 404,
              json: { detail: "fixture failure" },
            },
      );
    });
    await context.route("**/partner/instant", (route) => {
      state.creates++;
      return route.fulfill({ status: 503, json: { detail: "ambiguous create" } });
    });
    await page.goto("/account/partner/menu");
    if (failure === "expired") {
      await expect(page).toHaveURL(/account\/login\?next=/);
      expect(new URL(page.url()).searchParams.get("next")).toBe("/account/partner/menu");
      expect(state.creates).toBe(0);
      return;
    }
    if (failure !== "create-confirmed") {
      await expect(
        page.getByRole("alert").filter({ hasText: "Nie udało się otworzyć" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: /Przełącz na konto osobiste/ })).toHaveCount(0);
      expect(state.creates).toBe(failure === "read" ? 0 : 1);
      recovered = true;
      await page.getByRole("button", { name: "Spróbuj ponownie", exact: true }).click();
    }
    await expect(page.getByRole("link", { name: /Przełącz na konto osobiste/ })).toBeVisible();
    expect(state.creates).toBe(failure === "read" ? 0 : 1);
    expect(reads).toBe(failure === "create-failed" ? 3 : 2);
  });
}

for (const [kind, publicPath, existing] of [
  ["retreat", "/wyjazdy/dodaj", false],
  ["workshop", "/wydarzenia/dodaj", true],
] as const) {
  test(`CTA ${kind} reaches prefilled import form`, async ({ page, context }) => {
    const state = await fixture(context, { partner: existing, exists: true });
    if (existing) await session(page);
    await page.goto(publicPath);
    const url = `https://example.com/${kind}?a=1&b=2`;
    await page.locator('input[id*="source-url"]:visible').first().fill(url);
    await page
      .getByRole("button", {
        name: kind === "retreat" ? "Utwórz stronę z linku" : "Utwórz stronę wydarzenia",
        exact: true,
      })
      .filter({ visible: true })
      .first()
      .click();
    const target = `/account/partner/${kind === "retreat" ? "retreats" : "workshops"}/create?source=url`;
    if (!existing) {
      await expect(page).toHaveURL(/account\/login\?next=/);
      expect(new URL(page.url()).searchParams.get("next")).toBe(target);
      await page.getByLabel("Adres e-mail", { exact: true }).fill(email);
      await page.getByRole("button", { name: "Dalej", exact: true }).click();
      await page.locator("#login-password").fill("fixture-password");
      await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    }
    await expect(page).toHaveURL(`http://localhost:3000${target}`);
    await expect(page.getByLabel("URL wydarzenia")).toHaveValue(url);
    expect(state.creates).toBe(existing ? 0 : 1);
  });
}

test("retreat manual CTA reaches usable manual form", async ({ page, context }) => {
  await fixture(context, { partner: true });
  await session(page);
  await page.goto("/wyjazdy/dodaj");
  await page.getByRole("link", { name: "Stwórz stronę wyjazdu od zera" }).click();
  await expect(page).toHaveURL("http://localhost:3000/account/partner/retreats/create");
  await page
    .locator(".bg-card")
    .filter({ hasText: "RĘCZNIE" })
    .getByRole("button", { name: "Wybierz" })
    .click();
  await page.getByPlaceholder("Tytuł", { exact: true }).fill("Wyjazd testowy");
  await expect(page.getByPlaceholder("Tytuł", { exact: true })).toHaveValue("Wyjazd testowy");
});

for (const width of [390, 1280]) {
  test(`menu and personal settings preservation ${width}`, async ({ page, context }) => {
    const state = await fixture(context, { partner: true });
    await session(page);
    await page.setViewportSize({ width, height: 900 });
    await context.route("**/partner/me", (route) =>
      route.fulfill({ status: 503, json: { detail: "redundant read unavailable" } }),
    );
    await page.goto("/account/partner/menu");
    await expect(page.locator('a[href="/account/partner/profile"]')).toHaveCount(0);
    for (const name of ["Utwórz studio", "Solo Instruktor"]) {
      const card = page.getByRole("button", { name: new RegExp(name) });
      await expect(card).toBeVisible();
      await expect(card.locator("img")).toBeVisible();
    }
    await expect(page.getByText("Przenieś studio z Fitssey", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: /Przełącz na konto osobiste/ }).click();
    await expect(page.getByRole("link", { name: "Przełącz na konto partnera" })).toBeVisible();
    for (const path of ["/account/profile", "/account/partner/profile"]) {
      await page.goto(path);
      await expect(page.locator("#profile-email")).toHaveValue(email);
    }
    expect(state.creates).toBe(0);
  });
}

test("same-account refresh keeps partner content mounted", async ({ page, context }) => {
  const state = await fixture(context, { partner: true });
  await session(page);
  let name = "Anna";
  await context.route("http://localhost:8000/me", (route) => {
    if (route.request().method() === "PATCH") name = route.request().postDataJSON().name;
    return route.fulfill({
      json: {
        id: "fixture-user",
        email,
        name,
        partner: { id: "fixture-partner", user_id: "fixture-user", phone_verified: true },
      },
    });
  });
  await page.goto("/account/partner/profile");
  const input = page.getByLabel("Imię", { exact: true });
  await expect(input).toHaveValue("Anna");
  const original = await input.elementHandle();
  await input.fill("Anna Updated");
  await page.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(page.getByText("Profil zaktualizowany.", { exact: true })).toBeVisible();
  expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(input).toHaveValue("Anna Updated");
  expect(state.creates).toBe(0);
});

for (const scenario of ["sms", "verified", "save-failure", "dismiss"] as const) {
  test(`Solo setup continuation: ${scenario}`, async ({ page, context }) => {
    const state = await fixture(context, { partner: true, verified: scenario === "verified" });
    await session(page);
    let activated = false;
    let failSave = scenario === "save-failure";
    const events: string[] = [];
    const payloads: unknown[] = [];
    const instructor = {
      id: "solo-teacher",
      partner_id: "fixture-partner",
      name: "Anna Solo",
      claimed_at: "2026-11-07T12:00:00Z",
      is_claimed: true,
      slug: null,
      yoga_styles: [],
      social_links: [],
      languages: ["pl"],
      cities: [],
    };
    await context.route("http://localhost:8000/instructors", (route) =>
      route.fulfill({ json: [instructor] }),
    );
    await context.route("http://localhost:8000/instructors/solo-teacher", (route) =>
      route.fulfill({ json: instructor }),
    );
    await context.route("**/partner/capabilities", (route) =>
      route.fulfill({
        json: {
          business_mode: activated ? "solo" : null,
          solo_studio_id: activated ? "solo-studio" : null,
          self_instructor_id: instructor.id,
          has_instructor_profile: true,
          managed_studios: [],
          teaching_studios: [],
          has_events: false,
          landing_tab: "grafik",
        },
      }),
    );
    await context.route("http://localhost:8000/partner/solo-booking", async (route) => {
      events.push("save");
      payloads.push(route.request().postDataJSON());
      if (!state.verified)
        return route.fulfill({
          status: 403,
          json: {
            detail: {
              error_code: "PHONE_VERIFICATION_REQUIRED",
              message: "Zweryfikuj numer telefonu, aby włączyć zapisy.",
            },
          },
        });
      if (failSave)
        return route.fulfill({
          status: 503,
          json: { detail: "Nie udało się zapisać ustawień. Spróbuj ponownie." },
        });
      activated = true;
      await route.fulfill({ json: { studio_id: "solo-studio", instructor_id: instructor.id } });
    });
    await context.route("**/partner/send-verification-code", (route) => {
      events.push("sms");
      return route.fulfill({ json: {} });
    });
    await context.route("http://localhost:8000/partner", (route) => {
      if (route.request().postDataJSON().verification_code !== "123456")
        return route.fulfill({ status: 400, json: { detail: "Nieprawidłowy kod" } });
      state.verified = true;
      events.push("verified");
      return route.fulfill({
        json: {
          id: "fixture-partner",
          user_id: "fixture-user",
          phone_verified: true,
          phone_number: "+48501234567",
        },
      });
    });
    await page.goto("/account/partner/solo-booking");
    await page.getByRole("button", { name: "Wg pory zajęć", exact: true }).click();
    const morning = page.getByLabel("Zajęcia poranne (start przed 12:00)");
    const afternoon = page.getByLabel("Zajęcia popołudniowe (start od 12:00)");
    await morning.fill("19:30");
    await afternoon.fill("4");
    const save = page.getByRole("button", { name: "Zapisz ustawienia", exact: true });
    await save.click();
    if (scenario !== "verified") {
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      if (scenario === "dismiss") {
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(morning).toHaveValue("19:30");
        await expect(afternoon).toHaveValue("4");
        await expect(save).toBeEnabled();
        expect(activated).toBe(false);
        expect(events).toEqual(["save"]);
        return;
      }
      await page.getByLabel("Numer telefonu *").fill("501234567");
      await page.getByRole("button", { name: "Wyślij kod SMS", exact: true }).click();
      await page.getByLabel("Kod weryfikacyjny *").fill("000000");
      await page.getByRole("button", { name: "Potwierdź kod", exact: true }).click();
      await expect(page.getByText("Nieprawidłowy kod", { exact: true })).toBeVisible();
      expect(events).toEqual(["save", "sms"]);
      await page.getByLabel("Kod weryfikacyjny *").fill("123456");
      await page.getByRole("button", { name: "Potwierdź kod", exact: true }).click();
      if (scenario === "save-failure") {
        await expect(
          page.getByText("Nie udało się zapisać ustawień. Spróbuj ponownie.", { exact: true }),
        ).toBeVisible();
        await expect(page).toHaveURL("http://localhost:3000/account/partner/solo-booking");
        await expect(dialog).toHaveCount(0);
        await expect(morning).toHaveValue("19:30");
        await expect(afternoon).toHaveValue("4");
        await expect(save).toBeEnabled();
        expect(activated).toBe(false);
        expect(events).toEqual(["save", "sms", "verified", "save"]);
        failSave = false;
        await save.click();
      }
    }
    await expect(page).toHaveURL("http://localhost:3000/account/partner/menu");
    await expect(page.getByRole("heading", { name: "Własne zajęcia", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Płatności i odwołania/ })).toHaveAttribute(
      "href",
      "/account/partner/studio/solo-studio/payments",
    );
    await expect(page.getByRole("link", { name: /Karnety Opcjonalne/ })).toBeVisible();
    await page.getByRole("button", { name: "Twój profil instruktora", exact: true }).click();
    await expect(page.getByText("Anna Solo", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Edytuj", exact: true }).click();
    await expect(page).toHaveURL(
      "http://localhost:3000/account/partner/instructors/solo-teacher/edit",
    );
    await expect(page.getByLabel("Imię i nazwisko *")).toHaveValue("Anna Solo");
    expect(events).toEqual(
      scenario === "verified"
        ? ["save"]
        : scenario === "save-failure"
          ? ["save", "sms", "verified", "save", "save"]
          : ["save", "sms", "verified", "save"],
    );
    for (const payload of payloads)
      expect(payload).toEqual({
        cancellation_policy_mode: "by_time_of_day",
        cancellation_morning_deadline_time: "19:30",
        cancellation_afternoon_hours_before: 4,
      });
    expect(state.creates).toBe(0);
  });
}
