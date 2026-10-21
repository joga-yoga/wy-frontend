import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";

import { expect, test } from "@playwright/test";

const apiUrl = process.env.CONTACT_TEST_API_URL ?? "http://localhost:8000";
const databaseUrl = process.env.CONTACT_TEST_DATABASE_URL;
const marker = `contact-acceptance-${randomUUID()}`;
const success = "Dziękujemy! Wiadomość została wysłana.";
const failure = "Nie udało się wysłać wiadomości. Spróbuj ponownie później.";

declare global {
  interface Window {
    contactSubmitMs?: number;
  }
}

function queued(tag: string): { message: string; email: string; contact_info: string }[] {
  return JSON.parse(
    execFileSync(
      process.env.CONTACT_TEST_PYTHON ?? "python",
      [
        "-c",
        `
import json, os, sys
from sqlalchemy import create_engine, text
with create_engine(os.environ["CONTACT_TEST_DATABASE_URL"]).connect() as db:
    rows = db.execute(text("SELECT payload FROM notifications WHERE type = 'contact_request_admin' AND payload->>'message' LIKE :marker"), {"marker": "%" + sys.argv[1] + "%"})
    print(json.dumps([row[0] for row in rows]))
`,
        tag,
      ],
      { encoding: "utf8" },
    ),
  );
}

// Full Chromium includes the native Autofill CDP domain omitted by headless-shell.
test.use({ channel: "chromium", viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ page, context, baseURL }) => {
  test.skip(
    process.env.CONTACT_SPAM_ACCEPTANCE !== "1",
    "Requires a disposable migrated DB, console delivery and no worker.",
  );
  expect(new URL(databaseUrl!).pathname).toMatch(/_contact_spam_test$/);
  for (const url of [apiUrl, baseURL!]) {
    expect(["localhost", "127.0.0.1"]).toContain(new URL(url).hostname);
  }
  // This test cannot contact external APIs, analytics, email services or CAPTCHA CDNs.
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return [new URL(apiUrl).origin, new URL(baseURL!).origin].includes(url.origin)
      ? route.continue()
      : route.abort();
  });
  const cdp = await context.newCDPSession(page);
  // Explicit profile: 4x main-renderer CPU slowdown, mobile viewport, touch.
  // Chromium does not promise this slowdown applies to Web Workers.
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 50,
    downloadThroughput: 1_000_000,
    uploadThroughput: 500_000,
  });
  await page.addInitScript(() => {
    let observer: MutationObserver | undefined;
    document.addEventListener("pointerdown", (event) => {
      const button = (event.target as Element).closest('button[type="submit"]');
      const form = button?.closest("form");
      if (!form?.querySelector('[name="message"]')) return;
      observer?.disconnect();
      window.contactSubmitMs = undefined;
      const started = performance.now();
      observer = new MutationObserver(() => {
        if (form.querySelector('[role="status"]')?.textContent ===
            "Dziękujemy! Wiadomość została wysłana." &&
            form.querySelector<HTMLInputElement>('[name="email"]')?.value === "") {
          window.contactSubmitMs = performance.now() - started;
          observer?.disconnect();
        }
      });
      observer.observe(form, { subtree: true, childList: true, characterData: true });
    }, true);
  });
});

test("anonymous contact: real ALTCHA, durable queueing, retry recovery and takeover", async ({
  page,
  context,
  baseURL,
}, testInfo) => {
  const timings: { scenario: string; submitMs: number; automationMs: number; typingMs: number }[] = [];
  let lastProof = "";
  let lastIdentity = "";
  let lastPayload: Record<string, string> = {};
  page.on("request", (request) => {
    if (request.url() === `${apiUrl}/utils/contact` && request.method() === "POST") {
      lastPayload = request.postDataJSON() as Record<string, string>;
      lastProof = lastPayload.altcha;
      lastIdentity = lastPayload.submission_id;
    }
  });

  for (const [scenario, path] of [
    ["general", "/contact"],
    ["takeover", "/contact?eventId=event-acceptance"],
  ]) {
    const tag = `${marker}-${scenario}`;
    await page.goto(path);
    const cookieButton = page.getByRole("button", { name: "Tylko niezbędne" });
    if (await cookieButton.isVisible()) await cookieButton.click();
    const email = page.getByPlaceholder("Adres e-mail*");
    const phone = page.getByPlaceholder("Telefon (opcjonalnie)");
    const message = page.getByPlaceholder("Opisz swoją sprawę*");
    const submit = page.getByRole("button", { name: "Wyślij wiadomość" });
    await expect(email).toHaveAttribute("autocomplete", "email");
    await expect(phone).toHaveAttribute("autocomplete", "tel");
    await expect(page.locator('[name="website"]')).toHaveAttribute("autocomplete", "off");
    await expect(page.locator('[name="website"]')).toHaveAttribute("tabindex", "-1");
    await expect(page.locator('[name="website"]')).toBeHidden();
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await email.fill("visitor@example.com");
    await page.keyboard.press("Tab");
    await expect(phone).toBeFocused();
    await phone.fill("+48123456789");
    await page.keyboard.press("Tab");
    await expect(message).toBeFocused();
    const typingStart = performance.now();
    await message.pressSequentially(tag, { delay: 10 });
    const typingMs = performance.now() - typingStart;

    // Inject only transport/status failures here; eventual submission uses the actual
    // widget, challenge endpoint, verifier, queue helper, transaction and database.
    for (const status of [0, 400, 429, 503]) {
      await page.route(
        `${apiUrl}/utils/contact`,
        (route) =>
          status === 0
            ? route.abort("failed")
            : route.fulfill({
                status,
                headers: {
                  "Access-Control-Allow-Origin": new URL(baseURL!).origin,
                },
                json: { detail: "Acceptance failure" },
              }),
        { times: 1 },
      );
      await submit.click();
      await expect(page.getByRole("status")).toHaveText(failure);
      await expect(email).toHaveValue("visitor@example.com");
      await expect(phone).toHaveValue("+48123456789");
      await expect(message).toHaveValue(tag);
      await expect(submit).toBeEnabled();
      expect(queued(tag)).toHaveLength(0);
    }
    // Wait for the proof prepared during entry/retry; measure the actual submit path.
    const start = performance.now();
    await submit.click();
    await expect(page.getByRole("status")).toHaveText(success);
    const automationMs = performance.now() - start;
    const submitMs = (await page.evaluate(() => window.contactSubmitMs))!;
    timings.push({ scenario, submitMs, automationMs, typingMs });
    expect(queued(tag)).toEqual([
      expect.objectContaining({
        email: "visitor@example.com",
        contact_info: "+48123456789",
        message: expect.stringContaining(tag),
      }),
    ]);
    if (scenario === "takeover") expect(queued(tag)[0].message).toContain("ID: event-acceptance");
    await expect(email).toHaveValue("");
    await expect(message).toHaveValue("");
    expect(lastProof.length).toBeGreaterThan(0);
    expect(
      submitMs,
      "Additional submit waiting should stay below one second in this profile",
    ).toBeLessThan(1000);
  }

  // A lost committed response must retain identity even when the browser refreshes
  // its expired proof. Server-side expiry itself is exercised in the API tests.
  await page.goto("/contact");
  const tag = `${marker}-lost-response`;
  await page.getByPlaceholder("Adres e-mail*").fill("visitor@example.com");
  await page.getByPlaceholder("Telefon (opcjonalnie)").fill("+48123456789");
  await page.getByPlaceholder("Opisz swoją sprawę*").fill(tag);
  await page.route(
    `${apiUrl}/utils/contact`,
    async (route) => {
      const responses = await Promise.all([route.fetch(), route.fetch()]);
      expect(responses.map((response) => response.status())).toEqual([202, 202]);
      expect(queued(tag)).toHaveLength(1);
      await expect(page.getByPlaceholder("Opisz swoją sprawę*")).toHaveValue(tag);
      await expect(page.getByRole("status")).toHaveCount(0);
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
  await expect(page.getByRole("status")).toHaveText(failure);
  const originalProof = lastProof;
  const originalIdentity = lastIdentity;
  await page.evaluate(() => {
    const realNow = Date.now;
    Date.now = () => realNow() + 601_000; // expires only the browser's cached proof
  });
  await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
  await expect(page.getByRole("status")).toHaveText(success);
  expect(lastProof).not.toBe(originalProof);
  expect(lastIdentity).toBe(originalIdentity);
  expect(queued(tag)).toHaveLength(1);
  const concurrent = await Promise.all(
    [0, 1].map(() => context.request.post(`${apiUrl}/utils/contact`, { data: lastPayload })),
  );
  expect(concurrent.map((response) => response.status())).toEqual([202, 202]);
  expect(
    (
      await context.request.post(`${apiUrl}/utils/contact`, {
        data: { ...lastPayload, message: "changed content" },
      })
    ).status(),
  ).toBe(409);
  expect(queued(tag)).toHaveLength(1);
  await page.reload(); // restore the real browser clock before the next form

  // Honeypot intentionally returns success without queueing.
  const honeypotTag = `${marker}-honeypot`;
  await page.getByPlaceholder("Adres e-mail*").fill("visitor@example.com");
  await page.getByPlaceholder("Opisz swoją sprawę*").fill(honeypotTag);
  await page.locator('[name="website"]').evaluate((node) => {
    (node as HTMLInputElement).value = "bot";
  });
  await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
  await expect(page.getByRole("status")).toHaveText(success);
  expect(queued(honeypotTag)).toHaveLength(0);
  await testInfo.attach("contact-timing.json", {
    body: JSON.stringify(timings, null, 2),
    contentType: "application/json",
  });
});

for (const stall of ["load", "worker"] as const) {
  test(`stalled ALTCHA ${stall} times out, preserves fields and recovers`, async ({ page }) => {
    await page.addInitScript((stage) => {
      const flags = window as unknown as Window & {
        contactStall: boolean;
        contactTerminatedWorkers: number;
      };
      flags.contactStall = true;
      flags.contactTerminatedWorkers = 0;
      if (stage === "worker") {
        const original = Worker.prototype.postMessage;
        Worker.prototype.postMessage = function (
          ...args: [message: unknown, options?: Transferable[] | StructuredSerializeOptions]
        ) {
          if (!flags.contactStall) Reflect.apply(original, this, args);
        };
        const terminate = Worker.prototype.terminate;
        Worker.prototype.terminate = function () {
          flags.contactTerminatedWorkers += 1;
          Reflect.apply(terminate, this, []);
        };
      } else {
        const original = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (
          ...args: Parameters<EventTarget["addEventListener"]>
        ) {
          if (
            flags.contactStall &&
            this instanceof HTMLElement &&
            this.tagName === "ALTCHA-WIDGET" &&
            args[0] === "load"
          )
            return;
          Reflect.apply(original, this, args);
        };
      }
    }, stall);
    const tag = `${marker}-stall-${stall}`;
    await page.goto("/contact");
    const cookieButton = page.getByRole("button", { name: "Tylko niezbędne" });
    if (await cookieButton.isVisible()) await cookieButton.click();
    const email = page.getByPlaceholder("Adres e-mail*");
    const phone = page.getByPlaceholder("Telefon (opcjonalnie)");
    const message = page.getByPlaceholder("Opisz swoją sprawę*");
    const submit = page.getByRole("button", { name: "Wyślij wiadomość" });
    await email.fill("visitor@example.com");
    await phone.fill("+48123456789");
    await message.fill(tag);
    const start = performance.now();
    await submit.click();
    await expect(page.getByRole("status")).toHaveText(failure, { timeout: 12_000 });
    expect(performance.now() - start).toBeLessThan(12_000);
    await expect(submit).toBeEnabled();
    await expect(email).toHaveValue("visitor@example.com");
    await expect(phone).toHaveValue("+48123456789");
    await expect(message).toHaveValue(tag);
    await expect(page.locator("altcha-widget")).toHaveCount(0);
    expect(queued(tag)).toHaveLength(0);
    if (stall === "worker") {
      expect(
        await page.evaluate(
          () =>
            (window as unknown as Window & { contactTerminatedWorkers: number })
              .contactTerminatedWorkers,
        ),
      ).toBeGreaterThan(0);
    }
    await page.evaluate(() => {
      (window as unknown as Window & { contactStall: boolean }).contactStall = false;
    });
    await submit.click();
    await expect(page.getByRole("status")).toHaveText(success);
    expect(queued(tag)).toHaveLength(1);
  });
}

test("cold verification includes initialization and durable queueing", async ({
  page, browser,
}, testInfo) => {
  const tag = `${marker}-cold`;
  let challenges = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/utils/contact/challenge") challenges += 1;
  });
  await page.goto("/contact");
  const cookieButton = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookieButton.isVisible()) await cookieButton.click();
  await page.waitForFunction(() => {
    const input = document.querySelector('input[name="email"]');
    return input && Object.keys(input).some((key) => key.startsWith("__reactProps"));
  });
  // Native value setters exercise React changes without focusing/preparing the form.
  await page.evaluate((text) => {
    for (const [name, value] of [
      ["email", "visitor@example.com"],
      ["phone", "+48123456789"],
      ["message", text],
    ]) {
      const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[name="${name}"]`,
      )!;
      const prototype =
        element instanceof HTMLInputElement
          ? HTMLInputElement.prototype
          : HTMLTextAreaElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, tag);
  const submit = page.getByRole("button", { name: "Wyślij wiadomość" });
  await expect(submit).toBeEnabled();
  expect(challenges).toBe(0);
  const start = performance.now();
  await submit.click();
  await expect(page.getByRole("status")).toHaveText(success);
  const automationMs = performance.now() - start;
  const coldSubmitMs = (await page.evaluate(() => window.contactSubmitMs))!;
  expect(queued(tag)).toHaveLength(1);
  await testInfo.attach("contact-cold-timing.json", {
    body: JSON.stringify({
      coldSubmitMs,
      automationMs,
      browser: browser.version(),
      profile: "390x844/touch, renderer CPU 4x, 50ms latency; worker CPU not explicitly throttled",
    }),
    contentType: "application/json",
  });
  expect(coldSubmitMs).toBeLessThan(1000);
});

test("typing stays responsive while the real proof worker runs", async ({ page }, testInfo) => {
  test.skip(process.env.CONTACT_SPAM_TIMING_PROFILE !== "1",
    "Run with the isolated timing launcher that issues worst-case proof numbers.");
  await page.addInitScript(() => {
    const metrics = {
      active: 0,
      typing: false,
      inputsDuringWork: 0,
      inputDelayMs: [] as number[],
      inputToFrameMs: [] as number[],
      frameGapsMs: [] as number[],
      solveMs: [] as number[],
    };
    Object.assign(window, { contactMetrics: metrics });
    const postMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (
      ...args: [message: unknown, options?: Transferable[] | StructuredSerializeOptions]
    ) {
      if ((args[0] as { type?: string })?.type === "work") {
        metrics.active += 1;
        const start = performance.now();
        this.addEventListener("message", () => {
          metrics.active -= 1;
          metrics.solveMs.push(performance.now() - start);
        }, { once: true });
      }
      Reflect.apply(postMessage, this, args);
    };
    document.addEventListener("focusin", (event) => {
      if ((event.target as Element).matches('[name="message"]')) metrics.typing = true;
    });
    document.addEventListener("input", (event) => {
      if (!metrics.typing || !event.isTrusted) return;
      if (metrics.active) metrics.inputsDuringWork += 1;
      metrics.inputDelayMs.push(performance.now() - event.timeStamp);
      requestAnimationFrame(() => metrics.inputToFrameMs.push(performance.now() - event.timeStamp));
    });
    let lastFrame = performance.now();
    const frame = (now: number) => {
      if (metrics.typing) metrics.frameGapsMs.push(now - lastFrame);
      lastFrame = now;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await page.goto("/contact");
  const cookieButton = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookieButton.isVisible()) await cookieButton.click();
  const message = page.getByPlaceholder("Opisz swoją sprawę*");
  const text = "Piszę wiadomość podczas sprawdzania formularza. ".repeat(4);
  await page.waitForFunction(() => {
    const input = document.querySelector('textarea[name="message"]');
    return input && Object.keys(input).some((key) => key.startsWith("__reactProps"));
  });
  await message.pressSequentially(text, { delay: 10 });
  await expect(message).toHaveValue(text);
  const metrics = await page.evaluate(() =>
    (window as unknown as { contactMetrics: {
      active: number; typing: boolean; inputsDuringWork: number;
      inputDelayMs: number[]; inputToFrameMs: number[];
      frameGapsMs: number[]; solveMs: number[];
    } }).contactMetrics,
  );
  expect(metrics.solveMs.length).toBeGreaterThan(0);
  expect(metrics.inputsDuringWork).toBeGreaterThan(0);
  expect(metrics.inputDelayMs.length).toBeGreaterThan(0);
  expect(Math.max(...metrics.inputDelayMs)).toBeLessThan(100);
  expect(Math.max(...metrics.inputToFrameMs)).toBeLessThan(150);
  await testInfo.attach("contact-typing.json", {
    body: JSON.stringify(metrics, null, 2), contentType: "application/json",
  });
});

test("real database failure, native autofill, expired proof and rate-limit recovery", async ({
  page, context,
}, testInfo) => {
  test.skip(process.env.CONTACT_SPAM_FAULT_PROFILE !== "1",
    "Run separately with a fresh isolated API: challenge TTL 3s, accepted limit 1 per 20s.");
  const tag = `${marker}-database-failure`;
  await page.goto("/contact");
  const cookieButton = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookieButton.isVisible()) await cookieButton.click();
  const email = page.getByPlaceholder("Adres e-mail*");
  const phone = page.getByPlaceholder("Telefon (opcjonalnie)");
  const message = page.getByPlaceholder("Opisz swoją sprawę*");
  const submit = page.getByRole("button", { name: "Wyślij wiadomość" });
  const cdp = await context.newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("Autofill.enable");
  const { root } = await cdp.send("DOM.getDocument");
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId, selector: 'input[name="email"]',
  });
  const { node } = await cdp.send("DOM.describeNode", { nodeId });
  await email.focus();
  // Chromium's native address autofill engine, not DOM value assignment.
  await cdp.send("Autofill.trigger", {
    fieldId: node.backendNodeId,
    address: { fields: [
      { name: "NAME_FULL", value: "Test Visitor" },
      { name: "EMAIL_ADDRESS", value: "visitor@example.com" },
      { name: "PHONE_HOME_WHOLE_NUMBER", value: "+48123456789" },
      { name: "ADDRESS_HOME_COUNTRY", value: "PL" },
    ] },
  });
  await expect(email).toHaveValue("visitor@example.com");
  expect((await phone.inputValue()).replace(/\D/g, "")).toContain("123456789");
  const phoneValue = await phone.inputValue();
  await expect(page.locator('[name="website"]')).toHaveValue("");
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  const { nodeId: honeypotId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId, selector: 'input[name="website"]',
  });
  const { node: honeypot } = await cdp.send("DOM.describeNode", { nodeId: honeypotId });
  expect(nodes.some((item) => !item.ignored &&
    item.backendDOMNodeId === honeypot.backendNodeId)).toBe(false);
  expect(nodes.some((item) => !item.ignored && item.role?.value === "checkbox")).toBe(false);
  await message.fill(tag);

  // A real PostgreSQL INSERT is blocked, then its connection is terminated.
  // No API/verifier/queue function is mocked, and the lock is always released.
  const fault = spawn(process.env.CONTACT_TEST_PYTHON ?? "python", ["-u", "-c", `
import os, time
from sqlalchemy import create_engine, text
engine = create_engine(os.environ['CONTACT_TEST_DATABASE_URL'])
assert engine.url.database.endswith('_contact_spam_test')
with engine.connect() as lock:
    transaction = lock.begin()
    try:
        blocker = lock.execute(text('SELECT pg_backend_pid()')).scalar_one()
        lock.execute(text('LOCK TABLE notifications IN SHARE MODE'))
        print('ready', flush=True)
        with engine.connect().execution_options(isolation_level='AUTOCOMMIT') as observer:
            deadline = time.monotonic() + 12
            while time.monotonic() < deadline:
                rows = observer.execute(text("SELECT pid FROM pg_stat_activity WHERE datname = current_database() AND query ILIKE '%INSERT INTO notifications%' AND :blocker = ANY(pg_blocking_pids(pid))"), {'blocker': blocker}).all()
                if rows:
                    assert len(rows) == 1
                    observer.execute(text('SELECT pg_terminate_backend(:pid)'), {'pid': rows[0][0]})
                    print('terminated', flush=True)
                    break
                time.sleep(0.02)
            else:
                raise RuntimeError('No isolated INSERT was blocked')
    finally:
        transaction.rollback()
`]);
  let faultOutput = "";
  let faultError = "";
  fault.stdout.on("data", (data: Buffer) => { faultOutput += data.toString(); });
  fault.stderr.on("data", (data: Buffer) => { faultError += data.toString(); });
  const faultExit = once(fault, "exit");
  await expect.poll(() => faultOutput, { timeout: 10_000 }).toContain("ready");
  const dbFailure = page.waitForResponse((response) =>
    response.url() === `${apiUrl}/utils/contact` && response.status() === 503);
  await submit.click();
  await dbFailure;
  await expect(page.getByRole("status")).toHaveText(failure);
  const [exitCode] = await faultExit;
  expect(exitCode, faultError).toBe(0);
  expect(faultOutput).toContain("terminated");
  await expect(email).toHaveValue("visitor@example.com");
  await expect(phone).toHaveValue(phoneValue);
  await expect(message).toHaveValue(tag);
  await expect(submit).toBeEnabled();
  expect(queued(tag)).toHaveLength(0);
  let committedPayload: Record<string, string> = {};
  page.on("request", (request) => {
    if (request.url() === `${apiUrl}/utils/contact` && request.method() === "POST") {
      committedPayload = request.postDataJSON() as Record<string, string>;
    }
  });
  await page.route(`${apiUrl}/utils/contact`, async (route) => {
    expect((await route.fetch()).status()).toBe(202);
    expect(queued(tag)).toHaveLength(1);
    await route.abort("failed");
  }, { times: 1 });
  await submit.click();
  await expect(page.getByRole("status")).toHaveText(failure);
  const originalPayload = committedPayload;
  await expect(email).toHaveValue("visitor@example.com");
  await expect(phone).toHaveValue(phoneValue);
  await expect(message).toHaveValue(tag);
  await expect(submit).toBeEnabled();
  expect(queued(tag)).toHaveLength(1);
  await page.waitForTimeout(3_100); // actual server-clock expiry after a lost response
  await submit.click();
  await expect(page.getByRole("status")).toHaveText(success);
  expect(committedPayload.submission_id).toBe(originalPayload.submission_id);
  expect(committedPayload.altcha).not.toBe(originalPayload.altcha);
  expect(queued(tag)).toHaveLength(1);
  expect(queued(tag)[0].contact_info).toBe(phoneValue);

  // A new message exceeds the real accepted-message limiter; all fields survive.
  const limitedTag = `${marker}-real-limit`;
  await email.fill("visitor@example.com");
  await phone.fill(phoneValue);
  await message.fill(limitedTag);
  const limitedResponse = page.waitForResponse((response) =>
    response.url() === `${apiUrl}/utils/contact` && response.status() === 429,
    { timeout: 10_000 });
  await submit.click();
  const limited = await limitedResponse;
  await expect(page.getByRole("status")).toHaveText(failure);
  await expect(email).toHaveValue("visitor@example.com");
  await expect(phone).toHaveValue(phoneValue);
  await expect(message).toHaveValue(limitedTag);
  await expect(submit).toBeEnabled();
  expect(queued(limitedTag)).toHaveLength(0);
  await page.waitForTimeout(Number(limited.headers()["retry-after"]) * 1000 + 100);
  // The original committed proof is now genuinely expired on the backend clock.
  expect((await context.request.post(`${apiUrl}/utils/contact`, {
    data: originalPayload,
  })).status()).toBe(202);
  expect((await context.request.post(`${apiUrl}/utils/contact`, {
    data: { ...originalPayload, message: "changed expired replay" },
  })).status()).toBe(409);
  expect(queued(tag)).toHaveLength(1);

  // Delay a new request until its real signed proof expires in transit.
  await page.route(`${apiUrl}/utils/contact`, async (route) => {
    await page.waitForTimeout(3_100);
    await route.continue();
  }, { times: 1 });
  const expiredResponse = page.waitForResponse((response) =>
    response.url() === `${apiUrl}/utils/contact` && response.status() === 400);
  await submit.click();
  expect((await expiredResponse).status()).toBe(400);
  await expect(page.getByRole("status")).toHaveText(failure);
  await expect(email).toHaveValue("visitor@example.com");
  await expect(phone).toHaveValue(phoneValue);
  await expect(message).toHaveValue(limitedTag);
  await expect(submit).toBeEnabled();
  expect(queued(limitedTag)).toHaveLength(0);
  const expiredIdentity = committedPayload.submission_id;
  await submit.click();
  await expect(page.getByRole("status")).toHaveText(success);
  expect(committedPayload.submission_id).toBe(expiredIdentity);
  expect(queued(limitedTag)).toHaveLength(1);
  await testInfo.attach("contact-real-faults.json", {
    body: JSON.stringify({ nativeAutofill: true, databaseFailureStatus: 503,
      rateLimitStatus: 429, expiredNewMessageStatus: 400,
      expiredCommittedRetryStatus: 202, changedExpiredReplayStatus: 409 }),
    contentType: "application/json",
  });
});
