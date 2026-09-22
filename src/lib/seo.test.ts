import assert from "node:assert/strict";

import { studioMetaDescription, studioPageTitle, truncateDescription } from "./seo";

// ── truncateDescription ───────────────────────────────────────────────────────────────

assert.equal(truncateDescription("Krótki opis."), "Krótki opis.");
assert.equal(truncateDescription("<p>Opis   z <b>HTML</b></p>"), "Opis z HTML");

{
  const long = `${"Pierwsze zdanie jest dość długie i opisuje studio w centrum miasta. ".repeat(3)}`;
  const out = truncateDescription(long);
  assert.ok(out.length <= 155, `too long: ${out.length}`);
  assert.ok(out.endsWith("."), `should end on a sentence: ${out}`);
}

{
  const noSentence = "słowo ".repeat(60).trim();
  const out = truncateDescription(noSentence);
  assert.ok(out.length <= 155, `too long: ${out.length}`);
  assert.ok(out.endsWith("słowo…"), `should cut on a word boundary: ${out}`);
}

// ── studioPageTitle ───────────────────────────────────────────────────────────────────

assert.equal(
  studioPageTitle("Soul Sync", "Warszawa"),
  "Soul Sync – studio jogi, Warszawa | joga.yoga",
);
assert.equal(studioPageTitle("Soul Sync", null), "Soul Sync – studio jogi | joga.yoga");
// The name already says "joga" / "yoga" — only the city is added.
assert.equal(studioPageTitle("Joga Nova", "Kraków"), "Joga Nova – Kraków | joga.yoga");
// The name already says both.
assert.equal(
  studioPageTitle("Lido Movement Studio - Yoga, Pilates Łódź", "Łódź"),
  "Lido Movement Studio - Yoga, Pilates Łódź | joga.yoga",
);
assert.equal(
  studioPageTitle("Studio Ruchu Kraków", "Kraków"),
  "Studio Ruchu Kraków – studio jogi | joga.yoga",
);

// ── studioMetaDescription ─────────────────────────────────────────────────────────────

assert.equal(
  studioMetaDescription({
    description: "  Własny opis studia.  ",
    styles: ["Hatha"],
    city: "Kraków",
    address: "Długa 1",
  }),
  "Własny opis studia.",
);
assert.equal(
  studioMetaDescription({
    description: null,
    styles: ["Hatha", "Yin", "Vinyasa"],
    city: "Kraków",
    address: "Długa 1",
  }),
  "Hatha, Yin i Vinyasa · Kraków, Długa 1",
);
assert.equal(
  studioMetaDescription({ description: "", styles: [], city: "Kraków", address: null }),
  "Studio jogi · Kraków",
);
// An address that already names the city does not name it twice.
assert.equal(
  studioMetaDescription({
    description: null,
    styles: [],
    city: "Kraków",
    address: "Długa 1, 31-147 Kraków",
  }),
  "Studio jogi · Długa 1, 31-147 Kraków",
);

console.log("seo.test.ts: ok");
