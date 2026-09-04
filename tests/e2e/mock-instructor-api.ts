import { createServer, type ServerResponse } from "node:http";

// The instructor persona now lives in src/fixtures/ so this server and the prototype workbench
// serve identical data (.plans/proto-workbench/ T04). Relative import, not the "@/" alias, so
// this file resolves the same way under tsx as it does under the Next bundler.
import { instructorFixture } from "../../src/fixtures/instructor";


const navigationFixture = {
  ...instructorFixture,
  instructor: {
    ...instructorFixture.instructor,
    id: "navigation-fixture",
    slug: "navigation-fixture",
  },
  upcoming_workshops: [
    {
      id: "destination-event",
      slug: "destination-event",
      title: "Navigation destination",
      description: "Fixture used to verify detail-link origin tracking.",
      start_date: "2026-09-12T10:00:00.000Z",
      end_date: "2026-09-12T12:00:00.000Z",
      price: 120,
      currency: "PLN",
      image_ids: [],
    },
  ],
};

const generatedDraftFixture = {
  draft_id: "preview-fixture",
  public_token: "preview-fixture",
  public_url: "/instruktor/dodaj/preview/preview-fixture",
  status: "completed",
  profile: {
    instructor: {
      ...instructorFixture.instructor,
      id: "preview-fixture",
      name: "Anna Kowalska",
      description: null,
      short_bio: null,
      image_id: null,
      studio_name: null,
      languages: null,
      cities: null,
      photo_ids: null,
      certificates: null,
      yoga_styles: [],
    },
    upcoming_retreats: [],
    past_retreats: [],
    upcoming_workshops: [],
    past_workshops: [],
    upcoming_courses: [],
    past_courses: [],
  },
  sources: [],
  confidence: {},
  image_provenance: {},
  error_message: null,
  expires_at: "2026-08-01T00:00:00.000Z",
};

const studioExamples = [
  {
    id: "studio-1",
    name: "Studio Światło",
    slug: "studio-swiatlo",
    image_id: null,
    image_ids: [],
    address: "Długa 1",
    city: "Warszawa",
    yoga_styles: ["Hatha"],
  },
  {
    id: "studio-2",
    name: "Cicha Przystań",
    slug: "cicha-przystan",
    image_id: null,
    image_ids: [],
    address: "Krótka 2",
    city: "Kraków",
    yoga_styles: ["Yin"],
  },
  {
    id: "studio-3",
    name: "Dom Jogi",
    slug: "dom-jogi",
    image_id: null,
    image_ids: [],
    address: "Leśna 3",
    city: "Gdańsk",
    yoga_styles: ["Vinyasa"],
  },
];

const studioDraftFixture = {
  draft_id: "studio-preview-fixture",
  public_token: "studio-preview-fixture",
  public_url: "/studio/dodaj/preview/studio-preview-fixture",
  draft_kind: "existing",
  status: "generated",
  profile: {
    id: "studio-1",
    name: "Studio Światło",
    slug: "studio-swiatlo",
    description: "Spokojne studio jogi w centrum Warszawy.",
    address: "Długa 1",
    image_id: null,
    image_ids: [],
    drop_in_price: null,
    currency: "PLN",
    accepts_sport_cards: null,
    is_listed: false,
    status: "draft",
    rooms: [],
    passes: [],
    sport_card_acceptances: [],
    amenities: [],
    yoga_styles: [],
    instructors: [],
    location: { title: "Warszawa", address_line1: "Długa 1", city: "Warszawa" },
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  },
  sources: [],
  confidence: {},
  image_provenance: {},
  error_message: null,
  expires_at: "2026-08-18T00:00:00.000Z",
};

function json(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:4010");

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/instructor/hero-fixture") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(instructorFixture));
    return;
  }

  if (url.pathname === "/instructor/navigation-fixture") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(navigationFixture));
    return;
  }

  if (url.pathname === "/instructor-profile-drafts/preview-fixture") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(generatedDraftFixture));
    return;
  }

  if (url.pathname === "/instructors/public") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify([]));
    return;
  }

  if (url.pathname === "/public/studios") {
    json(res, 200, studioExamples);
    return;
  }

  if (url.pathname === "/public/studios/search") {
    json(res, 200, [
      { ...studioExamples[0], is_claimed: false },
      { ...studioExamples[2], is_claimed: true },
    ]);
    return;
  }

  if (url.pathname === "/studio-profile-drafts/generate" && req.method === "POST") {
    json(res, 200, studioDraftFixture);
    return;
  }

  if (url.pathname === "/studio-profile-drafts/studio-preview-fixture") {
    json(res, 200, studioDraftFixture);
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ detail: "Not found" }));
});

server.listen(4010, "127.0.0.1");
