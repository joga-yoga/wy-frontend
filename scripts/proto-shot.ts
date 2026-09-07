/**
 * Screenshot a prototype variant at 2x (brief §7, acceptance criterion 12).
 *
 *   yarn proto:shot <folder> [variant]        every variant, or just one
 *   yarn proto:shot <folder> --url <url> --out before.png
 *
 * Writes `<variant>.png` beside the source `.tsx`.
 *
 * Drives the DEV server, deliberately. `playwright.config.ts` boots a PRODUCTION build, where by
 * design `/proto` does not exist — running this as a Playwright test would 404 every time. That
 * is the single most likely way to lose an afternoon here, so it lives in scripts/, not tests/.
 *
 * Captures the framed element via `[data-proto-frame]`, the stable hook the single-variant route
 * exposes, so page padding never lands in the image.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium, type Browser } from "@playwright/test";

const PROTO_DIR = path.join(process.cwd(), "proto");
const DEFAULT_BASE = process.env.PROTO_BASE_URL ?? "http://localhost:3000";
const FRAME_SELECTOR = "[data-proto-frame]";
/** §5: the frame's default content width. */
const DEFAULT_FRAME_WIDTH = 396;

interface VariantMeta {
  file: string;
  label: string;
}

function usage(message: string): never {
  console.error(`${message}

  yarn proto:shot <folder> [variant]
  yarn proto:shot <folder> --url <url> [--out before.png] [--width 396]

  PROTO_BASE_URL overrides the dev server origin (default ${DEFAULT_BASE}).`);
  process.exit(1);
}

/**
 * Fail loudly rather than hang. The designer keeps a dev tab open (§1) — this reuses that server
 * and never starts a competing one, because two Next dev servers on one .next directory is a
 * worse problem than a clear error message.
 */
async function assertServerUp(base: string): Promise<void> {
  try {
    const res = await fetch(`${base}/proto`, { redirect: "manual" });
    if (res.status >= 400) {
      usage(
        `${base}/proto returned ${res.status}. The prototype routes exist only under \`yarn dev\` ` +
          `— a production build has no /proto by design.`,
      );
    }
  } catch {
    usage(`No dev server at ${base}. Start one with \`yarn dev\` and retry.`);
  }
}

async function readVariants(folder: string): Promise<VariantMeta[]> {
  const metaPath = path.join(PROTO_DIR, folder, "meta.json");
  let raw: string;
  try {
    raw = await readFile(metaPath, "utf8");
  } catch {
    usage(`No meta.json in proto/${folder}/`);
  }
  const meta = JSON.parse(raw) as { variants?: VariantMeta[] };
  if (!Array.isArray(meta.variants) || meta.variants.length === 0) {
    usage(`proto/${folder}/meta.json declares no variants`);
  }
  return meta.variants;
}

/** Two runs must produce identical bytes, or a review agent's critique is not reproducible. */
async function settle(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((r) => img.addEventListener("load", r, { once: true }))),
    ),
  );
  // One frame for any layout the font swap triggered.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}

async function shoot(
  browser: Browser,
  url: string,
  outPath: string,
  selector: string | null,
  viewportWidth = DEFAULT_FRAME_WIDTH,
): Promise<void> {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    // Mobile-first, like the frame. A `before.png` shot at a desktop viewport cannot be compared
    // with the 396px prototype it is supposed to sit beside — it was 2560x10798 before this.
    viewport: { width: viewportWidth, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await settle(page);

  const target = selector ? page.locator(selector).first() : null;
  if (target && (await target.count()) > 0) {
    await target.screenshot({ path: outPath });
  } else {
    await page.screenshot({ path: outPath, fullPage: true });
  }

  await context.close();
  console.log(`  ✓ ${path.relative(process.cwd(), outPath)}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.length === 0) usage("Missing <folder>.");

  const folder = argv[0];
  const urlFlag = argv.indexOf("--url");
  const outFlag = argv.indexOf("--out");
  const base = DEFAULT_BASE;

  const folders = await readdir(PROTO_DIR).catch(() => [] as string[]);
  if (!folders.includes(folder)) usage(`No such folder: proto/${folder}`);

  const browser = await chromium.launch();
  try {
    // `before.png` capture (§3, §7): any URL in the live app, written into a prototype folder so
    // the redesign and the screen it replaces sit side by side on disk.
    if (urlFlag !== -1) {
      const url = argv[urlFlag + 1];
      const out = outFlag !== -1 ? argv[outFlag + 1] : "before.png";
      const widthFlag = argv.indexOf("--width");
      const width = widthFlag !== -1 ? Number(argv[widthFlag + 1]) : DEFAULT_FRAME_WIDTH;
      if (!url) usage("--url needs a value.");
      if (!Number.isFinite(width) || width <= 0) usage("--width needs a positive number.");
      console.log(`proto/${folder} ← ${url} (${width}px)`);
      await shoot(browser, url, path.join(PROTO_DIR, folder, out), null, width);
      return;
    }

    await assertServerUp(base);

    const declared = await readVariants(folder);
    const only = argv[1] && !argv[1].startsWith("--") ? argv[1].replace(/\.tsx$/, "") : null;
    const chosen = only
      ? declared.filter((v) => v.file.replace(/\.tsx$/, "") === only)
      : declared;

    if (chosen.length === 0) usage(`Variant "${only}" is not declared in proto/${folder}/meta.json`);

    console.log(`proto/${folder} — ${chosen.length} variant(s) at 2x`);
    for (const v of chosen) {
      const slug = v.file.replace(/\.tsx$/, "");
      await shoot(
        browser,
        `${base}/proto/${folder}/${slug}`,
        path.join(PROTO_DIR, folder, `${slug}.png`),
        FRAME_SELECTOR,
      );
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
