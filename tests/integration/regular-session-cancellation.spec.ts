import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { type APIRequestContext, type Browser, expect, type Page, test } from "@playwright/test";

interface Account {
  token: string;
  email: string;
}

interface Slot {
  id: string;
  title: string;
  date: string;
}

interface Fixtures {
  solo: {
    slot: Slot;
    lead: string;
    owner: Account;
    venue: Account;
    member: Account;
    booking: string;
    pass_id: string;
    valid_until: string;
  };
  studio: {
    id: string;
    slug: string;
    manager: Account;
    owner: Account;
    member: Account;
    booking: string;
    nearby: Slot;
    distant: Slot;
    override: string;
  };
  substitution: {
    slot: Slot;
    following: Slot;
    member: Account;
    booking: string;
    lead: { slug: string; name: string };
    replacement: { slug: string; name: string; id: string };
  };
}

interface Mail {
  to: string[];
  subject: string;
  html: string;
  key: string;
  provider_id: string;
}

const fixturesPath = process.env.CANCELLATION_ACCEPTANCE_FIXTURES;
const fixtures: Fixtures | null = fixturesPath
  ? JSON.parse(readFileSync(fixturesPath, "utf8"))
  : null;
const apiOrigin = "http://localhost:18478";

function acceptanceCommand(action: "capture" | "calendar", input?: object): unknown {
  const runbook = resolve("../runbook/cancellation-mvp");
  return JSON.parse(
    execFileSync(
      "docker",
      [
        "compose",
        "-p",
        "joga-cancel-mvp",
        "--env-file",
        `${runbook}/backend.env`,
        "-f",
        "docker-compose.yml",
        "-f",
        "docker-compose.override.yml",
        "-f",
        `${runbook}/compose.override.yml`,
        "run",
        "--rm",
        "-T",
        "-v",
        `${runbook}:/acceptance:ro`,
        "-e",
        "PYTHONPATH=/app:/app/src",
        "-e",
        "PYTHONDONTWRITEBYTECODE=1",
        "test",
        "python",
        "/acceptance/acceptance.py",
        action,
      ],
      {
        cwd: resolve("../wy-backend"),
        encoding: "utf8",
        stdio: "pipe",
        input: JSON.stringify(input),
      },
    ),
  );
}

function captureMail() {
  return acceptanceCommand("capture") as Mail[];
}

async function pageFor(browser: Browser, account?: Account) {
  const context = await browser.newContext({
    baseURL: "http://localhost:30478",
    timezoneId: "Europe/Warsaw",
  });
  await context.addInitScript(
    ({ token }) => {
      localStorage.setItem(
        "wy.cookie_consent.v1",
        JSON.stringify({ analytics: false, marketing: false }),
      );
      if (token) localStorage.setItem("access_token", token);
    },
    { token: account?.token },
  );
  return context.newPage();
}

async function get(request: APIRequestContext, path: string, account?: Account) {
  const response = await request.get(`${apiOrigin}${path}`, {
    headers: account ? { Authorization: `Bearer ${account.token}` } : {},
  });
  expect(response.status(), path).toBe(200);
  return response.json();
}

async function cancel(page: Page, slot: Slot, series = false) {
  await page.goto(`/account/partner/schedule/cancel/${slot.id}`);
  await expect(page.getByText(slot.title, { exact: true })).toBeVisible();
  if (series) await page.getByText("Zakończ serię od tej daty", { exact: true }).click();
  await page.getByRole("button", { name: "Zobacz podgląd zmian" }).click();
  await page.getByRole("button", { name: "Odwołaj sesję" }).click();
  await expect(
    page.getByText(series ? "Seria zakończona" : "Sesja odwołana", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("W kolejce są powiadomienia dla 1 osoby.")).toBeVisible();
}

async function openPublicWeek(page: Page, path: string, date: string) {
  await page.goto(path);
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const nextMonday = new Date(`${today}T00:00:00Z`);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 8 - (nextMonday.getUTCDay() || 7));
  if (date >= nextMonday.toISOString().slice(0, 10)) {
    await page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-chevron-right") })
      .click();
  }
}

function bookingLink(message: Mail, booking: string) {
  const hrefs = [...message.html.matchAll(/href="([^"]+)"/g)].map((match) => new URL(match[1]));
  const wanted = hrefs.find((link) => link.pathname === `/account/bookings/${booking}`);
  expect(wanted, `Exact booking in ${message.subject}`).toBeDefined();
  expect(wanted!.origin).toBe("http://localhost:30478");
  return wanted!.href;
}

test.describe("regular-session cancellation release candidate", () => {
  test.describe.configure({ mode: "default", timeout: 120_000 });
  test.skip(!fixtures, "Set CANCELLATION_ACCEPTANCE_FIXTURES to isolated H-485 fixtures.");

  test("Solo cancels tomorrow and restores the member's paid pass entry", async ({
    browser,
    request,
  }) => {
    const { solo } = fixtures!;
    const owner = await pageFor(browser, solo.owner);
    await cancel(owner, solo.slot);

    const guest = await pageFor(browser);
    await openPublicWeek(guest, `/instruktor/${solo.lead}/grafik`, solo.slot.date);
    const cancelledCard = guest.getByRole("button").filter({ hasText: solo.slot.title });
    await expect(cancelledCard).toContainText("Odwołane");
    await expect(cancelledCard).toContainText("16:00");
    await cancelledCard.click();
    await expect(guest.getByRole("dialog").getByText("Te zajęcia zostały odwołane")).toBeVisible();

    const member = await pageFor(browser, solo.member);
    await member.goto("/account/bookings");
    await expect(member.getByText(solo.slot.title, { exact: true })).toBeVisible();
    const captured = captureMail();
    expect(captured.some((message) => message.to.includes(solo.venue.email))).toBe(false);
    const mail = captured.filter((message) => message.to.includes(solo.member.email));
    expect(mail.map((message) => message.subject).sort()).toEqual([
      `Odwołanie zajęć: ${solo.slot.title}`,
      "Rozliczenie po odwołaniu zajęć",
    ]);
    expect(new Set(mail.map((message) => message.key)).size).toBe(2);
    const schedule = mail.find((message) => message.subject.startsWith("Odwołanie"))!;
    const finance = mail.find((message) => message.subject.startsWith("Rozliczenie"))!;
    expect(schedule.to).toEqual([solo.member.email]);
    expect(finance.to).toEqual([solo.member.email]);
    expect(schedule.html).toContain("16:00");
    expect(finance.html).toContain("Przywrócono 1 wejście na karnet.");
    expect(bookingLink(finance, solo.booking)).toBe(bookingLink(schedule, solo.booking));
    await member.goto(bookingLink(schedule, solo.booking));
    await expect(member.getByText("Przywrócono 1 wejście na karnet.")).toBeVisible();
    await expect(member.getByText(/Pierwotna ważność karnetu/)).toBeVisible();
    const detail = await get(request, `/bookings/${solo.booking}`, solo.member);
    expect(detail.status).toBe("cancelled");
    expect(detail.cancellation_finance).toMatchObject({
      state: "pass_entry_restored",
      pass_expired: false,
    });
    expect(Date.parse(detail.cancellation_finance.pass_valid_until)).toBe(
      Date.parse(solo.valid_until),
    );
    const wallet = await get(request, `/users/me/passes/${solo.pass_id}`, solo.member);
    expect(wallet).toMatchObject({ entries_total: 4, entries_left: 4, is_paid: true });
    const venueCases = await get(request, "/partner/payment-attention", solo.venue);
    expect(venueCases.needs_review).toEqual([]);
  });

  test("studio ends a series, confirms schedule submission and reimburses the original surcharge", async ({
    browser,
    request,
  }) => {
    const { studio } = fixtures!;
    const manager = await pageFor(browser, studio.manager);
    const owner = await pageFor(browser, studio.owner);
    const guest = await pageFor(browser);
    const member = await pageFor(browser, studio.member);
    const details = (slot: Slot) => `/account/partner/studio/${studio.id}/front-desk/${slot.id}`;
    const publicSchedule = `/studio/${studio.slug}/grafik`;

    await cancel(manager, studio.nearby, true);
    await manager.goto(details(studio.nearby));
    await expect(manager.getByText("Nie było zapisanych uczestników.")).toBeVisible();
    await manager.goto(details(studio.distant));
    await expect(manager.getByText("Oczekuje na wysyłkę lub ponowienie: 1.")).toBeVisible();
    const mail = captureMail().filter((message) => message.to.includes(studio.member.email));
    expect(mail).toHaveLength(2);
    const schedule = mail.find((message) => message.subject.startsWith("Odwołanie"))!;
    const finance = mail.find((message) => message.subject.startsWith("Rozliczenie"))!;
    expect(schedule.provider_id).toMatch(/^h485-simulated-/);
    expect(finance.html).toContain("15,00 PLN");
    await expect(manager.getByText("Operator pocztowy przyjął 1 z 1 e-maili.")).toBeVisible();
    await manager.reload();
    await expect(manager.getByText("Operator pocztowy przyjął 1 z 1 e-maili.")).toBeVisible();
    const cancelled = await get(request, `/class-sessions/${studio.distant.id}`, studio.manager);
    expect(cancelled).toMatchObject({
      status: "cancelled",
      instructor_name: studio.override,
      notified_count: 1,
    });

    await openPublicWeek(guest, publicSchedule, studio.nearby.date);
    await expect(guest.getByRole("button").filter({ hasText: studio.nearby.title })).toContainText(
      "Odwołane",
    );
    const distantWeek = await get(
      request,
      `/public/studios/${studio.id}/schedule?week_start=${studio.distant.date}`,
    );
    expect(JSON.stringify(distantWeek)).not.toContain(studio.distant.id);
    await guest.goto(`${publicSchedule}?occurrence=${studio.distant.id}`);
    await expect(guest.getByRole("dialog").getByText("Te zajęcia zostały odwołane")).toBeVisible();
    await guest.reload();
    await expect(guest.getByRole("dialog").getByText("Te zajęcia zostały odwołane")).toBeVisible();

    await member.goto(bookingLink(schedule, studio.booking));
    await expect(member.getByText("Do zwrotu: 15,00 PLN")).toBeVisible();
    await member.close();
    await owner.goto(details(studio.distant));
    await owner.getByRole("link", { name: "Sprawdź rozliczenia" }).click();
    const reimbursement = (page: Page) =>
      page.locator("article").filter({ hasText: "Zwrot płatności pobranej na miejscu" });
    await expect(reimbursement(owner)).toHaveCount(1);
    const refreshed = await owner.context().newPage();
    await refreshed.goto("/account/partner/reconciliation#payment-review", {
      waitUntil: "domcontentloaded",
    });
    const item = reimbursement(refreshed);
    await expect(item).toHaveCount(1);
    await item.getByRole("button", { name: "Zapisz wykonany zwrot" }).click();
    await item
      .getByLabel("Potwierdzenie zwrotu")
      .fill("Izolowane potwierdzenie H-485, zwrot 15 PLN.");
    await item.getByRole("button", { name: "Zwrot wykonany" }).click();
    await expect(item).toHaveCount(0);
    const settledBooking = await pageFor(browser, studio.member);
    await settledBooking.goto(bookingLink(schedule, studio.booking), {
      waitUntil: "domcontentloaded",
    });
    await expect(settledBooking.getByText("Zwrócona kwota: 15,00 PLN")).toBeVisible();

    const settled = captureMail().filter((message) => message.to.includes(studio.member.email));
    expect(settled).toHaveLength(1);
    expect(settled[0].subject).toBe("Potwierdzenie zwrotu po odwołaniu zajęć");
    expect(settled[0].html).toContain("Potwierdzono zwrot 15,00 PLN.");
    expect(bookingLink(settled[0], studio.booking)).toBe(bookingLink(schedule, studio.booking));
    const finalStudioDetail = await manager.context().newPage();
    await finalStudioDetail.goto(details(studio.distant), { waitUntil: "domcontentloaded" });
    await expect(
      finalStudioDetail.getByText("Operator pocztowy przyjął 1 z 1 e-maili."),
    ).toBeVisible();
  });

  test("a change to the inherited lead preserves the booking, slot and adjacent date", async ({
    browser,
    request,
  }) => {
    const { studio, substitution: change } = fixtures!;
    const manager = await pageFor(browser, studio.manager);
    const before = await get(request, `/class-sessions/${change.slot.id}`, studio.manager);
    const following = await get(request, `/class-sessions/${change.following.id}`, studio.manager);
    expect(before.instructor_name).toBe(change.lead.name);

    await manager.goto(`/account/partner/schedule/edit/${change.slot.id}?field=instructor`);
    await manager.getByRole("button", { name: "Dalej", exact: true }).click();
    await manager.getByText(change.replacement.name, { exact: true }).click();
    await manager.getByRole("button", { name: "Zobacz podgląd zmian" }).click();
    await manager.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(manager.getByText("Zapisano zmiany", { exact: true })).toBeVisible();

    const after = await get(request, `/class-sessions/${change.slot.id}`, studio.manager);
    expect(after).toMatchObject({
      instructor_name: change.replacement.name,
      start_time: before.start_time,
      end_time: before.end_time,
      capacity: before.capacity,
      room_id: before.room_id,
    });
    expect(await get(request, `/class-sessions/${change.following.id}`, studio.manager)).toEqual({
      ...following,
      // The substituted exception leaves the set eligible for a later whole-series edit.
      series_from_date: change.following.date,
    });

    const guest = await pageFor(browser);
    for (const surface of [
      `/studio/${studio.slug}/grafik`,
      `/instruktor/${change.lead.slug}/grafik`,
      `/instruktor/${change.replacement.slug}/grafik`,
    ]) {
      await openPublicWeek(guest, surface, change.slot.date);
      const card = guest.getByRole("button").filter({ hasText: change.slot.title });
      await expect(card).toContainText("Zastępstwo");
      await expect(card).toContainText(change.replacement.name);
      await expect(
        card.locator(".line-through").filter({ hasText: change.lead.name }),
      ).toBeVisible();
      expect(
        acceptanceCommand("calendar", {
          id: studio.id,
          nearby: studio.nearby,
          distant: studio.distant,
        }),
      ).toEqual({
        nearby_through_local_day: true,
        distant_hidden_on_eve: true,
        series_ended: true,
      });
    }

    const mail = captureMail().filter((message) => message.to.includes(change.member.email));
    expect(mail).toHaveLength(1);
    expect(mail[0].subject).toContain("Zmiana prowadzenia");
    expect(mail[0].html).toContain(change.lead.name);
    expect(mail[0].html).toContain(change.replacement.name);
    const member = await pageFor(browser, change.member);
    await member.goto(bookingLink(mail[0], change.booking));
    await expect(member.getByText("Zastępstwo", { exact: true })).toBeVisible();
    await expect(member.getByText(change.replacement.name, { exact: true })).toBeVisible();
    const detail = await get(request, `/bookings/${change.booking}`, change.member);
    expect(detail.status).toBe("booked");
    expect(detail.session.viewer_booking.id).toBe(change.booking);
    expect(detail.cancellation_finance).toBeNull();
  });
});
