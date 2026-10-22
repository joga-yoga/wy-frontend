import { expect, type Page, test } from "@playwright/test";

async function mock(page: Page, count: number, editRoom: string | null = "room-a") {
  const state = {
    failRooms: false,
    delayed: false,
    deleted: false,
    failCommit: false,
    writes: [] as Record<string, unknown>[],
  };
  await page.addInitScript(() => {
    localStorage.setItem(
      "access_token",
      `e30.${btoa(JSON.stringify({ sub: "owner", email: "owner@example.com" }))}.fixture`,
    );
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.appendChild(style);
    });
  });
  await page.route(
    /https?:\/\/[^/]+\/(?:me|partner\/.*|studios.*|class-templates.*|class-schedules.*|class-sessions.*|notifications.*)(?:\?.*)?$/,
    async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const method = route.request().method();
      let json: unknown = {};
      let status = 200;
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
            { id: "studio-a", name: "Studio A" },
            { id: "studio-b", name: "Studio B" },
          ],
          teaching_studios: [],
          has_events: false,
          has_instructor_profile: false,
          landing_tab: "grafik",
        };
      else if (path.endsWith("/rooms")) {
        if (state.delayed) await new Promise((resolve) => setTimeout(resolve, 600));
        if (state.failRooms) {
          status = 503;
          json = { detail: "Unavailable" };
        } else
          json = path.includes("studio-b")
            ? [
                { id: "room-b", name: "Sala B" },
                { id: "room-c", name: "Sala C" },
              ]
            : count === 0
              ? []
              : [{ id: "room-a", name: "Sala A" }];
        if (state.deleted) json = [{ id: "room-c", name: "Sala C" }];
      } else if (path.endsWith("/roster")) json = { items: [] };
      else if (path === "/class-templates")
        json = [
          {
            id: "template",
            title: "Hatha",
            duration_minutes: 60,
            default_capacity: 12,
            created_at: "2026-10-22",
            updated_at: "2026-10-22",
          },
        ];
      else if (path === "/class-sessions/occurrence")
        json = {
          id: "occurrence",
          organizer_kind: "studio",
          calendar_date: "2026-11-20",
          start_time: "2026-11-20T10:00:00Z",
          end_time: "2026-11-20T11:00:00Z",
          status: "scheduled",
          room_id: editRoom,
          studio_id: "studio-a",
          studio_name: "Studio A",
          template_title: "Hatha",
          template_id: "template",
          is_recurring: false,
          role: "owner",
          capacity: 12,
          recurrence_days: [],
        };
      else if (path === "/class-schedules/preview")
        json = {
          total: 1,
          occurrences: [
            {
              calendar_date: "2026-11-20",
              start_time: "2026-11-20T10:00:00Z",
              end_time: "2026-11-20T11:00:00Z",
              room_id: route.request().postDataJSON().room_id,
            },
          ],
        };
      else if (path === "/class-sessions/edit/preview")
        json = {
          scope: "single",
          items: [],
          total_affected: 0,
          notification_summary: { total_recipients: 0, total_booked_seats: 0 },
        };
      else if (
        method === "POST" &&
        (path === "/class-schedules" || path === "/class-sessions/edit/commit")
      ) {
        state.writes.push(route.request().postDataJSON());
        if (state.failCommit) {
          state.deleted = true;
          status = 400;
          json = { detail: "Wybrana sala nie jest dostępna w tym studiu. Wybierz salę ponownie." };
        } else
          json =
            path === "/class-schedules"
              ? { total_created: 1, occurrences: [], schedule_id: "schedule" }
              : {
                  scope: "single",
                  updated: ["occurrence"],
                  created: [],
                  cancelled: [],
                  deleted: [],
                };
      } else if (path.startsWith("/notifications")) json = { items: [], unread_count: 0 };
      else if (path === "/studios") json = [];
      await route.fulfill({ status, json });
    },
  );
  return state;
}
async function openCreate(page: Page) {
  await page.goto("/account/partner/class-schedules/create?studio_id=studio-a&templateId=template");
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
  await page.getByRole("button", { name: "Raz", exact: true }).click();
}

test("roomless studio can create without a room", async ({ page }) => {
  const state = await mock(page, 0);
  await openCreate(page);
  await expect(page.getByRole("combobox", { name: /Sala/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Podgląd →" }).click();
  await page.getByRole("button", { name: "Utwórz grafik" }).click();
  await expect(page.getByRole("heading", { name: "Grafik utworzony" })).toBeVisible();
  expect(state.writes[0]).not.toHaveProperty("room_id");
});

test("mobile requires explicit room, retries lookup, resets studio and handles deleted selection", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const state = await mock(page, 1);
  state.failRooms = true;
  await openCreate(page);
  await expect(page.getByText("Nie udało się załadować sal.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Podgląd →" })).toBeDisabled();
  state.failRooms = false;
  state.delayed = true;
  await page.getByRole("button", { name: "Spróbuj ponownie", exact: true }).click();
  await expect(page.getByText("Ładowanie sal…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Podgląd →" })).toBeDisabled();
  const selector = page.getByRole("combobox", { name: /Sala/ });
  await expect(selector).toHaveText("Wybierz salę");
  await expect(page.getByText("Wybierz salę dla tych zajęć.")).toBeVisible();
  await page.screenshot({ path: info.outputPath("required-mobile.png"), fullPage: true });
  await selector.click();
  await page.getByRole("option", { name: "Sala A" }).click();
  await expect(page.getByRole("button", { name: "Podgląd →" })).toBeEnabled();
  await page.evaluate(() => history.pushState(null, "", "?studio_id=studio-b&templateId=template"));
  await expect(selector).toHaveText("Wybierz salę");
  await expect(page.getByRole("button", { name: "Podgląd →" })).toBeDisabled();
  await selector.click();
  await page.getByRole("option", { name: "Sala B" }).click();
  await page.getByRole("button", { name: "Podgląd →" }).click();
  state.failCommit = true;
  await page.getByRole("button", { name: "Utwórz grafik" }).click();
  await expect(
    page.getByText("Wybrana sala nie jest dostępna w tym studiu. Wybierz salę ponownie."),
  ).toBeVisible();
  await expect(selector).toHaveText("Wybierz salę");
  await expect(page.getByRole("button", { name: "Podgląd →" })).toBeDisabled();
  state.failCommit = false;
  await selector.click();
  await page.getByRole("option", { name: "Sala C" }).click();
  await page.getByRole("button", { name: "Podgląd →" }).click();
  await page.getByRole("button", { name: "Utwórz grafik" }).click();
  await expect(page.getByRole("heading", { name: "Grafik utworzony" })).toBeVisible();
  expect(state.writes.at(-1)).toMatchObject({
    studio_id: "studio-b",
    room_id: "room-c",
    capacity: 12,
  });
});

test("desktop edit retains valid room, clearing blocks save, legacy edit prompts for room", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const state = await mock(page, 1);
  await page.goto("/account/partner/schedule/edit/occurrence");
  const selector = page.getByRole("combobox", { name: /Sala/ });
  await expect(selector).toHaveText("Sala A");
  await expect(page.getByRole("button", { name: "Zobacz podgląd zmian" })).toBeEnabled();
  await page.getByRole("button", { name: "Wyczyść salę" }).click();
  await expect(page.getByRole("button", { name: "Zobacz podgląd zmian" })).toBeDisabled();
  await expect(page.getByText("Wybierz salę dla tych zajęć.")).toBeVisible();
  await page.screenshot({ path: info.outputPath("required-desktop.png"), fullPage: true });
  await selector.click();
  await page.getByRole("option", { name: "Sala A" }).click();
  await page.getByRole("button", { name: "Zobacz podgląd zmian" }).click();
  await page.getByRole("button", { name: "Zapisz zmiany" }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0]).toMatchObject({ scope: "single", room_id: "room-a" });
  await page.unrouteAll();
  await mock(page, 1, null);
  await page.goto("/account/partner/schedule/edit/occurrence?field=instructor");
  await expect(selector).toHaveText("Wybierz salę");
  await expect(page.getByRole("button", { name: "Zobacz podgląd zmian" })).toBeDisabled();
});
