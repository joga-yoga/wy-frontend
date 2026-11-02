import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { sportCardImage } from "../src/lib/sportCardImages";

const slugs = [
  "multisport-plus", "multisport-classic", "multisport-light", "multisport-student",
  "multisport-senior", "medicover-sport", "fitprofit", "fitsport", "mybenefit",
  "ok-system", "pzu-sport", "edenred-sport",
];

async function main() {
for (const slug of slugs) {
  const url = sportCardImage(slug, null);
  assert.ok(url?.startsWith("/images/cards/"), `${slug} has a local image`);
  if (!url) throw new Error(`Missing image for ${slug}`);
  const file = path.join(process.cwd(), "public", url);
  await access(file);
  const metadata = await sharp(file).metadata();
  assert.equal(metadata.format, "webp", slug);
  assert.equal(metadata.width, 892, slug);
  assert.equal(metadata.height, 564, slug);
}
assert.equal(sportCardImage(null, "custom-upload"), "custom-upload");
assert.equal(sportCardImage("unknown", "other-upload"), "other-upload");
assert.equal(sportCardImage(null, null), null);
assert.equal(sportCardImage("fitprofit", "old-cloudinary-id"), "/images/cards/fitprofit.webp");
console.log(`Verified ${slugs.length} catalogue images and custom-photo fallbacks`);

}

void main();
