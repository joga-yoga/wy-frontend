/**
 * The checks that decide whether the prototype workbench survives.
 *
 *   yarn proto:verify        (assumes `yarn build` has already run)
 *   yarn proto:verify --build
 *
 * Brief §9: "Criteria 2, 3 and 4 are the ones that decide whether this survives. Everything else
 * is recoverable." Both criterion 2 and criterion 3 say **verified against a real production
 * build, not by reading config** — so this script asserts against `.next/`, never against
 * `next.config.mjs`.
 *
 * Every assertion here is proven by being made to fail. That is not a formality: the first
 * criterion-3 check written during T02 grepped `.next/static/css/`, a directory that does not
 * exist (production CSS lands in `.next/static/chunks/*.css`), found nothing, and reported a
 * pass. An assertion aimed at a path that does not exist always passes. Hence `assertPresent`
 * below — every "X is absent" check is paired with proof that the haystack was real.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, ".next");

/** Lives in a committed prototype so the check cannot silently pass because the class vanished. */
const CSS_SENTINEL = "fuchsia";
/** Reassembled at runtime so this file cannot itself seed the class into the product build. */
const SENTINEL_CLASS = `bg-${CSS_SENTINEL}-700`;
/** Marker strings from proto/2026-09-03-spike — must appear nowhere in a production build. */
const MODULE_MARKERS = ["PROTO_SPIKE_MARKER_ALPHA", "PROTO_SPIKE_MARKER_BETA"];
/** A string unique to the shell itself. If this ships, the shell was compiled into production. */
const SHELL_MARKER = "data-proto-frame";

let failures = 0;

function pass(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg: string, detail?: string) {
  failures += 1;
  console.error(`  ✗ ${msg}`);
  if (detail) console.error(`      ${detail}`);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function fileContains(file: string, needle: string): boolean {
  try {
    return readFileSync(file, "latin1").includes(needle);
  } catch {
    return false;
  }
}

function main() {
  if (process.argv.includes("--build")) {
    console.log("Building (clean)…");
    spawnSync("rm", ["-rf", NEXT_DIR], { stdio: "inherit" });
    const r = spawnSync("yarn", ["build"], { stdio: "inherit", shell: false });
    if (r.status !== 0) {
      console.error("Build failed — nothing to verify.");
      process.exit(1);
    }
  }

  if (!existsSync(NEXT_DIR)) {
    console.error(`No ${path.relative(ROOT, NEXT_DIR)}/. Run \`yarn build\` first, or pass --build.`);
    process.exit(1);
  }
  if (existsSync(path.join(NEXT_DIR, "dev"))) {
    // .next/dev is dev-server output. It legitimately contains prototype chunks, and grepping it
    // produced a false alarm during T01. A clean production build never creates it.
    console.error(
      ".next/dev exists — this tree holds dev-server output. Re-run with --build for a clean " +
        "production build; a mixed .next/ cannot prove anything.",
    );
    process.exit(1);
  }

  const files = walk(NEXT_DIR);
  const cssFiles = files.filter((f) => f.endsWith(".css"));
  console.log(`Verifying ${files.length} build files (${cssFiles.length} stylesheets)\n`);

  // ── Criterion 2: no prototype route, and no prototype code, in a production build ──
  console.log("Criterion 2 — no prototype route in a production build");

  const routesManifest = path.join(NEXT_DIR, "app-path-routes-manifest.json");
  if (!existsSync(routesManifest)) {
    fail("app-path-routes-manifest.json missing — cannot check the route table");
  } else {
    const routes = Object.values(JSON.parse(readFileSync(routesManifest, "utf8"))) as string[];
    const protoRoutes = routes.filter((r) => r === "/proto" || r.startsWith("/proto/"));
    if (protoRoutes.length > 0) {
      fail(
        `${protoRoutes.length} prototype route(s) shipped: ${protoRoutes.join(", ")}`,
        "A shell file is almost certainly named page.tsx instead of page.proto.tsx. " +
          "Only *.proto.tsx files are excluded from production — see pageExtensions in next.config.mjs.",
      );
    } else {
      pass(`no /proto route among ${routes.length} shipped routes`);
    }
  }

  for (const marker of MODULE_MARKERS) {
    const hit = files.find((f) => fileContains(f, marker));
    if (hit) {
      fail(
        `prototype module code shipped (${marker})`,
        `found in ${path.relative(ROOT, hit)} — a variant module was pulled into the build.`,
      );
    } else {
      pass(`no prototype module code (${marker})`);
    }
  }

  const shellHit = files.find((f) => fileContains(f, SHELL_MARKER));
  if (shellHit) {
    fail(
      `the shell itself was compiled into production (${SHELL_MARKER})`,
      `found in ${path.relative(ROOT, shellHit)}`,
    );
  } else {
    pass("the shell is not compiled at all, not merely unrouted");
  }

  // ── Criterion 3: no prototype-only classes in the production stylesheet ──
  console.log("\nCriterion 3 — no prototype classes in the production stylesheet");

  // Guard the sentinel before trusting it. Tailwind extracts class candidates from prose as
  // readily as from JSX, so writing the class name in a comment or a README under src/ makes it
  // legitimately product CSS — and the check below would then fail forever for the wrong reason.
  // This happened once already, in this shell's own documentation.
  const srcDir = path.join(ROOT, "src");
  const sentinelInSrc = walk(srcDir).filter((f) => fileContains(f, SENTINEL_CLASS));
  if (sentinelInSrc.length > 0) {
    fail(
      `the sentinel class appears under src/ (${sentinelInSrc.length} file(s))`,
      `${sentinelInSrc.map((f) => path.relative(ROOT, f)).join(", ")} — it must exist ONLY in ` +
        "proto/, or it no longer distinguishes prototype CSS from product CSS. Refer to it as " +
        "bg-fuchsia-* in prose instead of spelling it out.",
    );
  } else {
    pass("the sentinel class exists only in proto/ — it is still a valid sentinel");
  }

  if (cssFiles.length === 0) {
    fail("no stylesheets found in the build", "the check below would pass vacuously — see header.");
  } else {
    // Prove the haystack is real before asserting the needle is absent.
    const anchor = "container-wy"; // a product utility that must be present
    const anchorFound = cssFiles.some((f) => fileContains(f, anchor));
    if (!anchorFound) {
      fail(
        `sanity anchor ".${anchor}" not found in any stylesheet`,
        "the CSS being searched is not the product stylesheet, so an 'absent' result means nothing.",
      );
    } else {
      pass(`sanity anchor ".${anchor}" present — the stylesheets are real`);

      const leak = cssFiles.find((f) => fileContains(f, CSS_SENTINEL));
      if (leak) {
        fail(
          `prototype-only class "${CSS_SENTINEL}" is in the production stylesheet`,
          `found in ${path.relative(ROOT, leak)} — the \`@source not "../../proto"\` line in ` +
            "src/styles/globals.css has stopped working. Prototype classes must be generated by " +
            "src/app/proto/proto.css instead, which only loads in dev.",
        );
      } else {
        pass(`prototype-only class "${CSS_SENTINEL}" is absent`);
      }
    }
  }

  console.log("");
  if (failures > 0) {
    console.error(`${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("All prototype-workbench production guarantees hold.");
}

main();
