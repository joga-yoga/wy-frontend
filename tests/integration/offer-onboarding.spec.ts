import { expect, type Page, test } from "@playwright/test";

import { expectIntactDismissal } from "../popup-dismissal";

// All browser API traffic is fulfilled locally. No shared accounts or provider jobs.
async function offerSession(page: Page) {
  const state = {
    partner: true,
    creates: 0,
    mode: null as "studio" | "solo" | null,
    studios: [] as Array<{
      id: string;
      name: string;
      slug: string | null;
      image_id: string | null;
      status: string;
      migration_pending?: boolean;
    }>,
    teaching: false,
    solo: false,
    self: false,
    instructorName: "Alicja Instruktorka",
    instructorSlug: "alicja",
    publicInstructor: true,
    failedStudio: "",
    failCapabilities: false,
    offers: false,
    writes: [] as string[],
  };
  await page.context().addInitScript(() => {
    localStorage.setItem(
      "access_token",
      `e30.${btoa(JSON.stringify({ sub: "h423-user", email: "h423@example.com" }))}.fixture`,
    );
  });
  await page.context().route("http://localhost:8000/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") state.writes.push(path);
    let json: unknown = [];
    if (path === "/me")
      json = {
        id: "h423-user",
        email: "h423@example.com",
        name: "Nazwa konta",
        partner: state.partner ? { id: "h423-partner", phone_verified: true } : null,
      };
    else if (path === "/partner/me") {
      if (!state.partner) return route.fulfill({ status: 404, json: { detail: "No partner" } });
      json = { id: "h423-partner", phone_verified: true };
    } else if (path === "/partner/instant") {
      state.partner = true;
      state.creates++;
      json = { id: "h423-partner", phone_verified: true };
    } else if (path === "/partner/capabilities") {
      if (state.failCapabilities) return route.fulfill({ status: 503, json: {} });
      json = {
        business_mode: state.mode,
        managed_studios: state.studios,
        teaching_studios: state.teaching
          ? [{ id: "teaching", name: "Cudze studio", image_id: null }]
          : [],
        solo_studio_id: state.solo ? "solo-context" : null,
        self_instructor_id: state.self ? "self" : null,
        has_instructor_profile: state.self,
        has_events: state.offers,
        landing_tab: state.studios.length || state.teaching || state.solo ? "grafik" : "rezerwacje",
      };
    } else if (path === "/instructors/self") {
      json = {
        id: "self",
        name: state.instructorName,
        slug: state.instructorSlug,
        image_id: null,
        is_published: true,
        is_listed: false,
        languages: [],
        cities: [],
        yoga_styles: [],
        social_links: [],
        photo_ids: [],
        certificates: [],
      };
    } else if (path.startsWith("/instructor/")) {
      if (!state.publicInstructor) return route.fulfill({ status: 404, json: {} });
      json = { instructor: { name: state.instructorName } };
    } else if (path.startsWith("/studios/")) {
      const id = path.split("/")[2];
      if (id === state.failedStudio) return route.fulfill({ status: 503, json: {} });
      json = {
        ...state.studios.find((studio) => studio.id === id),
        rooms: [],
        passes: [],
        sport_card_acceptances: [],
        amenity_ids: [],
        instructor_links: [],
        social_links: [],
        is_listed: false,
      };
    } else if (["/workshops", "/retreats", "/courses"].includes(path) && state.offers) {
      const kind = path.slice(1);
      json = [false, true].map((past) => ({
        id: `${kind}-${past ? "past" : "live"}`,
        slug: kind === "courses" ? "" : `${kind}-${past ? "past" : "live"}`,
        title: `${kind} ${past ? "archiwum" : "aktywny"} — długa nazwa wydarzenia z dodatkowymi informacjami`,
        start_date: past ? "2020-01-01" : "2099-01-01",
        end_date: past ? "2020-01-02" : "2099-01-02",
        is_public: !past,
        image_ids: [],
      }));
    } else if (path === "/events/organizer-labels") json = { labels: {}, show_labels: false };
    else if (path === "/users/me/bookings")
      json = { upcoming_count: 0, inquiry_count: 0, items: [] };
    else if (
      path.includes("inbox") ||
      path.includes("notifications") ||
      path.includes("invitations")
    )
      json = { items: [], unread_count: 0 };
    else if (path === "/studio-migrations/transfer-offer")
      json = { enabled: false, eligible: false, visible: false };
    else if (path === "/partner/reconciliation") json = { total: 0 };
    return route.fulfill({ json });
  });
  return state;
}

const studio = (id: string, name = `Studio ${id}`) => ({
  id,
  name,
  slug: `studio-${id}`,
  image_id: null,
  status: "claimed",
});

test("account entry creates Partner once and lands above the Oferta welcome screen", async ({
  page,
}) => {
  const state = await offerSession(page);
  state.partner = false;
  await page.goto("/account");
  await page.getByRole("button", { name: "Załóż konto partnera" }).click();
  await expect(page).toHaveURL(/\/account\/partner\/offer$/);
  const card = page.getByRole("button", { name: /^Utwórz studio/ });
  const welcome = page.getByText("Twoja oferta jest pusta", { exact: true });
  await expect(card).toBeVisible();
  await expect(welcome).toBeVisible();
  expect((await card.boundingBox())!.y).toBeLessThan((await welcome.boundingBox())!.y);
  expect(state.creates).toBe(1);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const navigation =
      width < 768
        ? page
            .locator("nav")
            .filter({ has: page.getByRole("link", { name: "Oferta", exact: true }) })
        : page.locator("aside");
    await expect(navigation.getByRole("link")).toHaveText(["Oferta", "Rezerwacje", "Menu"]);
  }
  await page.goto("/account/partner/menu");
  await expect(card).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Solo Instruktor/ })).toHaveCount(0);
  await page.goto("/account/partner");
  await expect(page).toHaveURL(/\/offer$/);
  expect(state.creates).toBe(1);
});

test("existing offers do not change the default; explicit bookings keep their query", async ({
  page,
}) => {
  const state = await offerSession(page);
  state.offers = true;
  await page.goto("/account/partner");
  await expect(page).toHaveURL(/\/offer$/);
  await expect(page.getByRole("button", { name: /^Utwórz studio/ })).toBeVisible();
  await page.goto("/account/partner/bookings?filter=upcoming");
  await expect(page).toHaveURL(/\/bookings\?filter=upcoming$/);
});

test("capability errors remain retryable and never expose setup choices", async ({ page }) => {
  const state = await offerSession(page);
  state.failCapabilities = true;
  await page.goto("/account/partner");
  await expect(page.getByRole("alert")).toContainText("Nie udało się wczytać konta partnera");
  state.failCapabilities = false;
  await page.getByRole("button", { name: "Spróbuj ponownie" }).click();
  await expect(page).toHaveURL(/\/offer$/);
  await expect(page.getByRole("button", { name: /^Utwórz studio/ })).toBeVisible();
});

for (const capability of ["managed", "teaching", "solo"] as const) {
  test(`Grafik landing remains available for ${capability}`, async ({ page }) => {
    const state = await offerSession(page);
    if (capability === "managed") state.studios = [studio("one")];
    if (capability === "teaching") state.teaching = true;
    if (capability === "solo") {
      state.solo = true;
      state.self = true;
      state.mode = "solo";
    }
    await page.goto("/account/partner");
    await expect(page).toHaveURL(/\/schedule$/);
    await page.goto("/account/partner/offer");
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const navigation =
        width < 768
          ? page
              .locator("nav")
              .filter({ has: page.getByRole("link", { name: "Oferta", exact: true }) })
          : page.locator("aside");
      await expect(navigation.getByRole("link")).toHaveText([
        "Grafik",
        "Oferta",
        "Rezerwacje",
        "Menu",
      ]);
    }
    if (capability === "teaching") {
      await expect(page.getByRole("button", { name: /^Solo Instruktor/ })).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Edytuj swój profil|Edytuj stronę studia/ }),
      ).toHaveCount(0);
    }
  });
}

test("multiple studios stay editable through individual detail failures and missing public destinations", async ({
  page,
}) => {
  const state = await offerSession(page);
  state.mode = "studio";
  state.studios = [
    studio("one"),
    { ...studio("two"), slug: null },
    { ...studio("pending"), migration_pending: true },
    studio("failed"),
  ];
  state.failedStudio = "failed";
  await page.goto("/account/partner/offer");
  await expect(page.getByRole("link", { name: /^Edytuj stronę studia:/ })).toHaveCount(4);
  await expect(page.getByRole("link", { name: /^Zobacz stronę publiczną:/ })).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: /Zobacz stronę publiczną: Studio one/ }),
  ).toHaveAttribute("href", "/studio/studio-one");
  state.failedStudio = "";
  await page.getByRole("button", { name: "Wczytaj ponownie: Studio failed" }).click();
  await expect(page.getByRole("link", { name: /^Zobacz stronę publiczną:/ })).toHaveCount(2);
  await page.getByRole("link", { name: "Edytuj stronę studia: Studio one" }).click();
  await expect(page).toHaveURL(/\/studio\/one\/edit\?from=offer$/);
  state.studios[0].name = "Nowa nazwa po zapisie";
  state.studios[0].slug = "nowy-slug";
  await page.getByRole("button", { name: "Wróć", exact: true }).first().click();
  await expect(
    page.getByRole("link", { name: /Zobacz stronę publiczną: Nowa nazwa/ }),
  ).toHaveAttribute("href", "/studio/nowy-slug");
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Edytuj stronę studia: Nowa nazwa po zapisie" }),
  ).toBeVisible();
});

test("solo identity belongs to the instructor; self profile alone does not complete setup", async ({
  page,
}) => {
  const state = await offerSession(page);
  state.self = true;
  await page.goto("/account/partner/offer");
  await expect(page.getByRole("button", { name: /^Solo Instruktor/ })).toBeVisible();
  state.mode = "solo";
  state.solo = true;
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Edytuj swój profil: Alicja Instruktorka" }),
  ).toHaveAttribute("href", "/account/partner/instructors/self/edit?from=offer");
  await expect(
    page.getByRole("link", { name: /Zobacz stronę publiczną: Alicja Instruktorka/ }),
  ).toHaveAttribute("href", "/instruktor/alicja");
  await expect(page.getByText("Twoja oferta jest pusta", { exact: true })).toBeVisible();
  state.publicInstructor = false;
  const unavailable = page.waitForResponse(
    (response) => response.url().endsWith("/instructor/alicja") && response.status() === 404,
  );
  await page.reload();
  await unavailable;
  await expect(page.getByRole("link", { name: /^Zobacz stronę publiczną:/ })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Edytuj swój profil: Alicja Instruktorka" }),
  ).toBeVisible();
});

test("offer deletion keeps its confirmation intact when cancelled or confirmed", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const state = await offerSession(page);
  state.offers = true;
  await page.goto("/account/partner/offer");
  const cookies = page.getByRole("button", { name: "Tylko niezbędne", exact: true });
  if (await cookies.isVisible()) await cookies.click();
  const menu = page.getByRole("button", { name: /^Więcej akcji: workshops aktywny/ });
  const popup = page.getByRole("alertdialog");
  for (const action of ["Anuluj", "Tak, usuń"]) {
    await menu.click();
    await page.getByRole("menuitem", { name: "Usuń", exact: true }).click();
    await expect(popup).toContainText("workshops aktywny");
    await expectIntactDismissal(popup, () => popup.getByRole("button", { name: action }).click());
    if (action === "Anuluj") {
      await expect(menu).toBeFocused();
      expect(state.writes.filter((path) => path === "/workshops/workshops-live")).toEqual([]);
    }
  }
  await expect(menu).toHaveCount(0);
  expect(state.writes.filter((path) => path === "/workshops/workshops-live")).toHaveLength(1);
});

for (const width of [320, 390, 1280]) {
  test(`independent offer actions, archive and profile layout at ${width}px`, async ({
    page,
  }, info) => {
    const state = await offerSession(page);
    state.offers = true;
    state.mode = "studio";
    state.studios = [
      studio("one", "Studio o bardzo długiej nazwie do sprawdzenia zawijania tekstu"),
    ];
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/account/partner/offer");
    const cookies = page.getByRole("button", { name: "Tylko niezbędne", exact: true });
    if (await cookies.isVisible()) await cookies.click();
    await expect(page.getByRole("link", { name: /^Edytuj stronę studia:/ })).toBeVisible();
    await page.getByRole("button", { name: /Archiwum/ }).click();
    for (const kind of ["workshops", "retreats", "courses"]) {
      for (const past of [false, true]) {
        const title = `${kind} ${past ? "archiwum" : "aktywny"}`;
        const id = `${kind}-${past ? "past" : "live"}`;
        const eye = page.getByRole("link", {
          name: new RegExp(`^Zobacz stronę publiczną: ${title}`),
        });
        const menu = page.getByRole("button", { name: new RegExp(`^Więcej akcji: ${title}`) });
        const body = page.locator(`a[href="/account/partner/${kind}/${id}/edit"]`).first();
        await expect(body).toBeVisible();
        await expect(eye).toHaveAttribute(
          "href",
          `/${kind === "courses" ? "kursy" : kind === "workshops" ? "wydarzenia" : "wyjazdy"}/${id}`,
        );
        await expect(eye).toHaveAttribute("target", "_blank");
        await body.focus();
        await page.keyboard.press("Tab");
        await expect(eye).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(menu).toBeFocused();
        for (const action of [eye, menu]) {
          const box = (await action.boundingBox())!;
          expect(box.width).toBe(32);
          expect(box.height).toBe(32);
          await expect(action.locator("svg")).toHaveCSS("width", "18px");
          await expect(action.locator("svg")).toHaveCSS("height", "18px");
          await expect(action.locator("svg")).toHaveAttribute("fill", "none");
          await expect(action.locator("svg")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
          expect(box.x).toBeGreaterThanOrEqual(
            (await body.boundingBox())!.x + (await body.boundingBox())!.width - 1,
          );
          expect(
            await action.evaluate((element) => parseFloat(getComputedStyle(element).borderRadius)),
          ).toBeGreaterThanOrEqual(14);
        }
        await menu.click();
        await expect(page).toHaveURL(/\/offer$/);
        await expect(page.getByRole("menuitem", { name: "Edytuj", exact: true })).toBeVisible();
        await expect(page.getByRole("menuitem", { name: "Duplikuj", exact: true })).toBeVisible();
        await expect(page.getByRole("menuitem", { name: "Usuń", exact: true })).toBeVisible();
        await expect(page.getByRole("menuitem", { name: "Ukryj", exact: true })).toHaveCount(
          past ? 0 : 1,
        );
        await expect(page.getByRole("menuitem", { name: "Zobacz stronę publiczną" })).toHaveCount(
          0,
        );
        await page.keyboard.press("Escape");
        await expect(menu).toBeFocused();
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath(`offer-${width}.png`), fullPage: true });
  });
}

test("configured accounts never flash initial choices while capabilities load", async ({
  page,
}) => {
  const state = await offerSession(page);
  state.mode = "studio";
  state.studios = [studio("one")];
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.context().route("http://localhost:8000/partner/capabilities", async (route) => {
    await ready;
    await route.fallback();
  });
  try {
    await page.goto("/account/partner/offer");
    await expect(page.getByText("Ładowanie profili…", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Utwórz studio|^Solo Instruktor/ })).toHaveCount(
      0,
    );
  } finally {
    release();
  }
  await expect(page.getByRole("link", { name: "Edytuj stronę studia: Studio one" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Utwórz studio|^Solo Instruktor/ })).toHaveCount(
    0,
  );
});
