import assert from "node:assert/strict";

import { getStyleCopy, YOGA_STYLE_COPY } from "./yogaStyleCopy";

// The ten styles with a national hub on the 2026-09 import (backend
// `services/style_pages.MIN_STUDIOS_PER_STYLE`). A hub without copy 404s by design, so a style
// crossing the gate needs an entry here before its page can exist.
const HUB_STYLES = [
  "hatha",
  "vinyasa",
  "yin",
  "joga-w-ciazy",
  "aerial",
  "iyengar",
  "joga-nidra",
  "ashtanga",
  "kundalini",
  "power-yoga",
];

for (const slug of HUB_STYLES) {
  assert.ok(getStyleCopy(slug), `no copy for hub style ${slug}`);
}

for (const [slug, copy] of Object.entries(YOGA_STYLE_COPY)) {
  assert.ok(copy.heading.trim(), `${slug}: empty heading`);
  assert.ok(copy.lead.length <= 155, `${slug}: lead is ${copy.lead.length} chars, over 155`);
  assert.ok(copy.body.length >= 2, `${slug}: body needs at least two paragraphs`);
  // A slug is a URL segment — the same shape the backend's `slugify` produces.
  assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${slug}: not a URL segment`);
}

assert.equal(getStyleCopy("nie-ma-takiego"), null);

console.log("yogaStyleCopy.test.ts: ok");
