import assert from "node:assert/strict";
import { test } from "node:test";

import { draftFormValues } from "../src/app/account/partner/studio/[studioId]/edit/studioDraftPrefill";
import { emptyStudioFormValues } from "../src/app/account/partner/studio/[studioId]/edit/studioFormModel";
import { clearAuthStorage } from "../src/lib/auth/logoutChain";
import { readSetup, removeSetup, untouchedDraftValues, writeSetup } from "../src/lib/studioSetup";

const entries = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  },
});

test("setup session isolates accounts and operations while retaining edited values", () => {
  const session = {
    operationKey: "same-retry",
    values: { ...emptyStudioFormValues, name: "Owner edit" },
    dirtyFields: ["name" as const],
  };
  writeSetup("draft-one", session, "owner-one");
  assert.equal(readSetup("draft-one", "owner-one")?.values?.name, "Owner edit");
  assert.equal(readSetup("draft-one", "owner-one")?.operationKey, "same-retry");
  assert.equal(readSetup("draft-one", "owner-two"), null);
  assert.equal(readSetup("draft-two", "owner-one"), null);
  removeSetup("draft-one", "owner-two");
  assert.ok(readSetup("draft-one", "owner-one"));
  removeSetup("draft-one", "owner-one");
  assert.equal(readSetup("draft-one", "owner-one"), null);
});

test("late enrichment protects edited and active fields, including linked location fields", () => {
  const incoming = {
    name: "Source",
    description: "Late description",
    address: "Source address",
    location_id: null,
    currency: "PLN",
  };
  assert.deepEqual(untouchedDraftValues(incoming, ["name", "location"], "description"), {
    currency: "PLN",
  });
  // A touched field remains protected even after its value was changed back to the initial value.
  assert.deepEqual(untouchedDraftValues({ name: "Source" }, new Set(["name"])), {});
});

test("partial snapshot never clears absent collections or resets payment settings", () => {
  const values = draftFormValues({ name: "Snapshot", description: "Source description" });
  assert.deepEqual(values, { name: "Snapshot", description: "Source description" });
  const visibility = draftFormValues({ is_listed: true });
  assert.deepEqual(visibility, { is_public: true, is_listed: true });
});

test("storage rejection leaves the mounted flow usable", () => {
  const storage = globalThis.sessionStorage;
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    get() {
      throw new Error("blocked");
    },
  });
  assert.doesNotThrow(() => writeSetup("key", { operationKey: "retry" }, "owner"));
  assert.doesNotThrow(() => removeSetup("key", "owner"));
  assert.equal(readSetup("key", "owner"), null);
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: storage });
});

test("logout and login as another account cannot adopt the prior account or legacy edits", () => {
  const tokenStore = new Map([["access_token", "account-a-token"]]);
  const priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const priorLocal = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      removeItem: (key: string) => tokenStore.delete(key),
    },
  });
  try {
    const sharedToken = "public-catalogue-draft";
    const first = {
      operationKey: "a-operation",
      values: { ...emptyStudioFormValues, name: "A private edit" },
    };
    writeSetup(sharedToken, first, "account-a");
    // Older unscoped storage is preserved, but has no trustworthy owner attribution.
    sessionStorage.setItem(`studio-setup:${sharedToken}`, JSON.stringify(first));
    clearAuthStorage();
    assert.equal(tokenStore.has("access_token"), false);
    assert.equal(readSetup(sharedToken, "account-b"), null);
    assert.equal(readSetup(sharedToken, ""), null);
    writeSetup(
      sharedToken,
      { operationKey: "b-operation", values: { ...emptyStudioFormValues, name: "B edit" } },
      "account-b",
    );
    assert.equal(readSetup(sharedToken, "account-a")?.values?.name, "A private edit");
    assert.equal(readSetup(sharedToken, "account-b")?.values?.name, "B edit");
    // The public catalogue snapshot is still usable independently of either account's edits.
    assert.deepEqual(draftFormValues({ name: "Public catalogue name" }), {
      name: "Public catalogue name",
    });
  } finally {
    if (priorWindow) Object.defineProperty(globalThis, "window", priorWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (priorLocal) Object.defineProperty(globalThis, "localStorage", priorLocal);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("storage namespace separators cannot alias another account's setup", () => {
  writeSetup("draft", { operationKey: "first" }, "account:other");
  writeSetup("other:draft", { operationKey: "second" }, "account");
  assert.equal(readSetup("draft", "account:other")?.operationKey, "first");
  assert.equal(readSetup("other:draft", "account")?.operationKey, "second");
});

test("source website links receive distinct editable keys and parsed metadata", () => {
  const result = draftFormValues({
    social_links: [{ url: "https://studio.example.com" }, { url: "https://instagram.com/studio" }],
  });
  assert.equal(result.social_links?.[0].platform, "custom");
  assert.equal(result.social_links?.[1].platform, "instagram");
  assert.equal(result.social_links?.[0].label, "studio.example.com");
  assert.ok(result.social_links?.[0].key);
  assert.notEqual(result.social_links?.[0].key, result.social_links?.[1].key);
});

test("source prices, canonical slug and nullable pass terms round-trip without synthetic IDs", async () => {
  const { buildStudioPayload } = await import(
    "../src/app/account/partner/studio/[studioId]/edit/studioFormModel"
  );
  const prefill = draftFormValues({
    name: "Source",
    slug: "exact-source-url",
    address: "Plac 2/16",
    city: "Warszawa",
    latitude: 52.2,
    longitude: 21.0,
    drop_in_price: 50,
    currency: null,
    passes: [
      { name: "Four entries", price: 150, currency: null, session_count: 4, duration_days: null },
    ],
  });
  const payload = buildStudioPayload({ ...emptyStudioFormValues, ...prefill });
  assert.equal(payload.slug, "exact-source-url");
  assert.equal(payload.location_id, null);
  assert.equal(prefill.location?.latitude, 52.2);
  assert.equal(payload.currency, null);
  assert.equal(payload.passes?.[0].id, null);
  assert.equal(payload.passes?.[0].currency, null);
  assert.equal(payload.passes?.[0].duration_days, null);
  assert.equal(payload.passes?.[0].session_count, 4);
});
