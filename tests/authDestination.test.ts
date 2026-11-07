import assert from "node:assert/strict";
import test from "node:test";

import {
  authContinuation,
  resolveAuthDestination,
  safeAuthNext,
} from "../src/lib/auth/destination";

const customer = { id: "user", email: "owner@example.com", partner: null };
const partner = { ...customer, partner: { id: "partner", user_id: "user", phone_verified: false } };
const noLookup = async (): Promise<boolean> => {
  throw new Error("Unexpected invitation lookup");
};

test("direct business and customer destinations survive regardless of device mode", async () => {
  for (const next of [
    "/account/partner/studio/create?draft=token&setup=session",
    "/book/pass/pass-1",
    "/instruktor/dodaj/claim/token",
    "/account/partner",
  ]) {
    assert.equal(
      await resolveAuthDestination({ next, user: customer, mode: "b2b" }, noLookup),
      next,
    );
  }
});

test("defaults require actual Partner; recovery opens the existing partner cabinet", async () => {
  for (const user of [customer, null]) {
    assert.equal(await resolveAuthDestination({ user, mode: "b2b" }, noLookup), "/account");
    assert.equal(
      await resolveAuthDestination({ user, mode: "b2b", recovery: true }, noLookup),
      "/account",
    );
  }
  assert.equal(
    await resolveAuthDestination({ user: partner, mode: "b2b" }, noLookup),
    "/account/partner",
  );
  assert.equal(await resolveAuthDestination({ user: partner, mode: "b2c" }, noLookup), "/account");
  assert.equal(
    await resolveAuthDestination({ user: partner, mode: "b2c", recovery: true }, noLookup),
    "/account/partner",
  );
});

test("legacy original absence is preserved in URL transport, explicit next wins", async () => {
  const next = authContinuation(new URLSearchParams({ email: "OWNER@example.com" }));
  assert.equal(next, "/account/login?email=OWNER%40example.com");
  assert.equal(
    await resolveAuthDestination({ next, user: customer, mode: null }, async () => true),
    "/account/partner",
  );
  for (const lookup of [
    async () => false,
    async () => {
      throw new Error("offline");
    },
  ]) {
    assert.equal(
      await resolveAuthDestination({ next, user: customer, mode: "b2b" }, lookup),
      "/account",
    );
  }
  assert.equal(
    await resolveAuthDestination(
      { next, user: { ...customer, email: "other@example.com" }, mode: null },
      noLookup,
    ),
    "/account",
  );
  assert.equal(
    await resolveAuthDestination({ next, user: null, mode: null }, noLookup),
    "/account",
  );
  assert.equal(
    authContinuation(new URLSearchParams({ email: customer.email, next: "/account" })),
    "/account",
  );
  assert.equal(
    authContinuation(new URLSearchParams({ email: customer.email, next: "" })),
    undefined,
  );
  assert.equal(authContinuation(new URLSearchParams()), undefined);
});

test("invalid destinations cannot escape the site or loop into login", async () => {
  for (const next of ["https://evil.test", "//evil.test", "/\\evil.test", "/\nevil.test"])
    assert.equal(safeAuthNext(next), undefined);
  assert.equal(
    await resolveAuthDestination({ next: "/account/login", user: customer, mode: null }, noLookup),
    "/account",
  );
});
