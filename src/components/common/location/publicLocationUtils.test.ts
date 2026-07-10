import assert from "node:assert/strict";

import { buildGoogleMapsHref } from "./publicLocationUtils";

const placeUrl = new URL(
  buildGoogleMapsHref({
    address_line1: "Volodymyrska St, 24a, Kyiv, Ukraine, 01030",
    google_place_id: "ChIJT1iUylvO1EARHrf3f5LGsQg",
    latitude: 50.4501,
    longitude: 30.5234,
  }),
);
assert.equal(placeUrl.searchParams.get("api"), "1");
assert.equal(placeUrl.searchParams.get("query"), "Volodymyrska St, 24a, Kyiv, Ukraine, 01030");
assert.equal(placeUrl.searchParams.get("query_place_id"), "ChIJT1iUylvO1EARHrf3f5LGsQg");

const coordinatesUrl = new URL(buildGoogleMapsHref({ latitude: 50.4501, longitude: 30.5234 }));
assert.equal(coordinatesUrl.searchParams.get("query"), "50.4501,30.5234");
assert.equal(coordinatesUrl.searchParams.has("query_place_id"), false);

const addressUrl = new URL(buildGoogleMapsHref({ address: "Łąkowa 3/5A, Łódź" }));
assert.equal(addressUrl.searchParams.get("query"), "Łąkowa 3/5A, Łódź");

assert.equal(buildGoogleMapsHref({}), "https://www.google.com/maps");
