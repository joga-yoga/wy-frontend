import assert from "node:assert/strict";
import test from "node:test";

import { parseNavigationOrigin } from "../src/lib/navigation-origin";

test("accepts an origin only when its target exactly matches the current page", () => {
  const stored = JSON.stringify({
    target: "/wydarzenia/event-b",
    origin: "/instruktor/anna",
  });

  assert.deepEqual(parseNavigationOrigin(stored, "/wydarzenia/event-b"), {
    target: "/wydarzenia/event-b",
    origin: "/instruktor/anna",
  });
  assert.equal(parseNavigationOrigin(stored, "/wydarzenia/event-a"), null);
});

test("rejects malformed, external, and incomplete stored records", () => {
  assert.equal(parseNavigationOrigin("not-json", "/wydarzenia/event"), null);
  assert.equal(
    parseNavigationOrigin(
      JSON.stringify({ target: "/wydarzenia/event", origin: "https://example.com" }),
      "/wydarzenia/event",
    ),
    null,
  );
  assert.equal(
    parseNavigationOrigin(JSON.stringify({ target: "/wydarzenia/event" }), "/wydarzenia/event"),
    null,
  );
});
