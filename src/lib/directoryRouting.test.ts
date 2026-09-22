import assert from "node:assert/strict";

import { decideRoute, type DirectoryLists } from "./directoryRouting";

const lists: DirectoryLists = {
  cities: async () => new Set(["krakow", "bielsko-biala"]),
  stylePages: async () => new Set(["/hatha", "krakow/hatha"]),
};
const unavailable: DirectoryLists = { cities: async () => null, stylePages: async () => null };

async function expect(path: string, expected: object, using = lists) {
  assert.deepEqual(await decideRoute(path, using), expected, path);
}

async function run() {
  const next = { kind: "next" };
  const notFound = { kind: "notFound" };

  // The city root is the future hub — a temporary redirect, only for a real city.
  await expect("/krakow", { kind: "redirect", to: "/krakow/studia" });
  await expect("/bielsko-biala/", { kind: "redirect", to: "/bielsko-biala/studia" });
  await expect("/nieistniejace-miasto", notFound);

  // The city directory and its style pages map onto the English folders.
  await expect("/krakow/studia", { kind: "rewrite", to: "/krakow/studios" });
  await expect("/krakow/studia/hatha", { kind: "rewrite", to: "/krakow/studios/hatha" });
  await expect("/krakow/studia/jivamukti", notFound);
  await expect("/nieistniejace/studia", notFound);
  await expect("/krakow/studia/hatha/extra", notFound);

  // Nothing else lives under a city: the English folder and the old flat style URL are 404s.
  await expect("/krakow/studios", notFound);
  await expect("/krakow/hatha", notFound);

  // National pages.
  await expect("/studia", next);
  await expect("/studia/hatha", next);
  await expect("/studios/hatha", next);
  await expect("/studia/jivamukti", notFound);
  await expect("/studia/przejmij", next);
  await expect("/studia/przejmij/abc123", next);

  // Real routes are never touched — including a workshop that happens to be slugged "studia".
  await expect("/", next);
  await expect("/wydarzenia/studia", next);
  await expect("/studio/soulsync", next);
  await expect("/instruktor/dodaj", next);
  await expect("/sitemap.xml", next);

  // An API outage lets pages through rather than 404ing every city.
  await expect("/krakow", { kind: "redirect", to: "/krakow/studia" }, unavailable);
  await expect("/krakow/studia", { kind: "rewrite", to: "/krakow/studios" }, unavailable);

  console.log("directoryRouting.test.ts: ok");
}

void run();
