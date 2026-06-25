import { createServer } from "node:http";

const instructorFixture = {
  instructor: {
    id: "hero-fixture",
    name: "Nadolny Przemek",
    description:
      "Uważna praktyka jogi dla ciała, oddechu i spokoju umysłu. Praktyka prowadzona spokojnie, z uważnością na rytm oddechu i indywidualne tempo uczestników.",
    short_bio:
      "Uważna praktyka jogi dla ciała, oddechu i spokoju umysłu. Refactor the existing instructor page so that the mobile version matches the attached data assumptions.",
    slug: "hero-fixture",
    image_id: null,
    studio_name: "Bodhi Yoga Shala",
    languages: ["pl"],
    cities: [{ place_id: "lodz", name: "Łódź", country: "Polska" }],
    photo_ids: ["w.yoga2_qtnigw_p2gegq", "w.yoga1_mprdyz_hasbo9"],
    certificates: [{ name: "RYT500", image_id: null }],
    yoga_styles: [
      {
        id: "style-hatha",
        yoga_style_id: "hatha",
        custom_name: null,
        custom_icon_id: null,
        description: null,
        yoga_style: { id: "hatha", name: "Hatha", slug: "hatha", icon_id: null },
      },
      {
        id: "style-ashtanga",
        yoga_style_id: "ashtanga",
        custom_name: null,
        custom_icon_id: null,
        description: null,
        yoga_style: { id: "ashtanga", name: "Asztanga", slug: "asztanga", icon_id: null },
      },
      {
        id: "style-hot",
        yoga_style_id: null,
        custom_name: "Hot",
        custom_icon_id: null,
        description: null,
        yoga_style: null,
      },
      {
        id: "style-yin",
        yoga_style_id: "yin",
        custom_name: null,
        custom_icon_id: null,
        description: null,
        yoga_style: { id: "yin", name: "Yin", slug: "yin", icon_id: null },
      },
    ],
    created_at: "2026-06-15T00:00:00.000Z",
    updated_at: "2026-06-15T00:00:00.000Z",
  },
  upcoming_retreats: [],
  past_retreats: [],
  upcoming_workshops: [],
  past_workshops: [],
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:4010");

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

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ detail: "Not found" }));
});

server.listen(4010, "127.0.0.1");
