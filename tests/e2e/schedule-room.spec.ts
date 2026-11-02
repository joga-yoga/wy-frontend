import { expect, type Page, test } from "@playwright/test";

import { isValidTime } from "../../src/lib/timeInput";

async function mock(page: Page, count: number, editRoom: string | null = "room-a") {
  const state = {
    failRooms: false,
    delayed: false,
    deleted: false,
    failCommit: false,
    recurring: false,
    startTime: "2026-11-20T10:00:00Z",
    previews: [] as Record<string, unknown>[],
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
    /https?:\/\/[^/]+\/(?:me|partner\/.*|instructors.*|studios.*|class-templates.*|class-schedules.*|class-sessions.*|notifications.*)(?:\?.*)?$/,
    async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const method = route.request().method();
      if (method === "POST" && path.endsWith("/preview"))
        state.previews.push(route.request().postDataJSON());
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
      } else if (path === "/instructors/assignable") json = [];
      else if (path.endsWith("/roster")) json = { items: [] };
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
          start_time: state.startTime,
          end_time: new Date(new Date(state.startTime).getTime() + 60 * 60 * 1000).toISOString(),
          status: "scheduled",
          room_id: editRoom,
          studio_id: "studio-a",
          studio_name: "Studio A",
          template_title: "Hatha",
          template_id: "template",
          is_recurring: state.recurring,
          role: "owner",
          capacity: 12,
          recurrence_days: state.recurring ? ["MO", "WE"] : [],
        };
      else if (path === "/class-schedules/preview")
        json = {
          total: 1,
          occurrences: [
            {
              calendar_date: "2026-11-20",
              start_time: "2026-11-20T10:00:00Z",
              end_time: new Date(
                new Date(state.startTime).getTime() + 60 * 60 * 1000,
              ).toISOString(),
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
    page.getByText("Wybrana sala nie jest dostępna w tym studiu. Wybierz salę ponownie.", {
      exact: true,
    }),
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

test("time input accepts exact minute precision and rejects partial or invalid text", () => {
  for (const value of ["00:00", "23:59", "09:07", "12:13"]) expect(isValidTime(value)).toBe(true);
  for (const value of ["", "1", "12:", "24:00", "12:60", "9:07", "12:00 PM", "09:00:12"])
    expect(isValidTime(value)).toBe(false);
});

test("desktop schedule time keeps typing and chooser aligned before creating", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const state = await mock(page, 0);
  await openCreate(page);
  const time = page.getByRole("textbox", { name: "Godzina", exact: true });
  const preview = page.getByRole("button", { name: "Podgląd →" });
  await expect(time).toHaveAttribute("type", "text");
  for (const value of ["", "1", "12:", "24:00", "12:60"]) {
    await time.fill(value);
    await time.press("Tab");
    await expect(time).toHaveValue(value);
    await expect(preview).toBeDisabled();
    await expect(page.getByText("Wpisz godzinę w formacie HH:mm.")).toBeVisible();
  }
  for (const value of ["00:00", "23:59", "09:07", "12:13"]) {
    await time.fill(value);
    await expect(preview).toBeEnabled();
  }
  const trigger = page.getByRole("button", { name: "Wybierz godzinę", exact: true });
  await trigger.focus();
  await trigger.press("Enter");
  const chooser = page.getByRole("dialog", { name: "Wybierz godzinę i minutę" });
  await expect(chooser.getByRole("radio", { name: "Godziny: 12", exact: true })).toBeChecked();
  await expect(chooser.getByRole("radio", { name: "Minuty: 13", exact: true })).toBeChecked();
  await chooser.getByRole("radio", { name: "Minuty: 07", exact: true }).click();
  await expect(time).toHaveValue("12:07");
  expect(state.previews).toHaveLength(0);
  await page.screenshot({ path: info.outputPath("time-desktop.png"), animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(chooser).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByText("Godzina", { exact: true }).click();
  await expect(chooser).toBeHidden();
  await expect(time).toBeFocused();
  await time.press("ControlOrMeta+A");
  await page.keyboard.insertText("12:07");
  await expect(time).toHaveValue("12:07");
  await preview.click();
  await page.getByRole("button", { name: "Utwórz grafik" }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.previews[0].start_time).toBe("12:07:00");
  expect(state.writes[0].start_time).toBe("12:07:00");
});

test.describe("touch time picker", () => {
  test.use({ hasTouch: true });

  for (const recurring of [false, true]) {
    test(`mobile 24-hour time preserves loaded edit and ${recurring ? "series" : "single"} payload`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 375, height: 812 });
      const state = await mock(page, 0);
      state.recurring = recurring;
      state.startTime = "2026-11-20T23:59:42+02:00";
      await page.goto("/account/partner/schedule/edit/occurrence");
      if (recurring) {
        await page.getByRole("button", { name: /Całą serię/ }).click();
        await page.getByRole("button", { name: "Dalej", exact: true }).click();
      }
      const time = page.getByRole("textbox", { name: "Godzina", exact: true });
      await expect(time).toHaveValue("23:59");
      const preview = page.getByRole("button", { name: "Zobacz podgląd zmian" });
      await time.fill("12:60");
      await expect(preview).toBeDisabled();
      await time.fill("23:59");
      const trigger = page.getByRole("button", { name: "Wybierz godzinę", exact: true });
      await trigger.focus();
      await trigger.press("Enter");
      const chooser = page.getByRole("dialog", { name: "Wybierz godzinę i minutę" });
      const hour = chooser.getByRole("radio", { name: "Godziny: 23", exact: true });
      await expect(hour).toBeFocused();
      await expect(hour).toBeChecked();
      await expect(chooser.getByRole("radio", { name: "Minuty: 59", exact: true })).toBeChecked();
      await hour.press("Home");
      await expect(chooser.getByRole("radio", { name: "Godziny: 00", exact: true })).toBeFocused();
      await page.keyboard.press("Space");
      await expect(time).toHaveValue("00:59");
      await chooser.getByRole("radio", { name: "Minuty: 13", exact: true }).tap();
      await expect(time).toHaveValue("00:13");
      const bounds = await chooser.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(812);
      await page.screenshot({ path: info.outputPath("time-mobile.png"), animations: "disabled" });
      await chooser.getByRole("button", { name: "Gotowe" }).click();
      await expect(trigger).toBeFocused();
      await preview.click();
      await page.getByRole("button", { name: "Zapisz zmiany" }).click();
      await expect.poll(() => state.writes.length).toBe(1);
      expect(state.previews[0].start_time).toBe("00:13:00");
      expect(state.writes[0]).toMatchObject({
        start_time: "00:13:00",
        scope: recurring ? "whole_series" : "single",
      });
    });
  }
});
