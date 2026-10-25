import type { IncomingMessage, ServerResponse } from "node:http";

import { instructorFixture } from "../../src/fixtures/instructor";
import type { CertificateItem, InstructorProfile } from "../../src/types/instructor";

export const certificateOwnerToken = `e30.${Buffer.from(
  JSON.stringify({ sub: "certificate-owner", email: "owner@example.com" }),
).toString("base64url")}.fixture`;

type Fixture = { profile: InstructorProfile; writes: number; denyRead: boolean };
const fixtures = new Map<string, Fixture>();

async function body(req: IncomingMessage) {
  let text = "";
  for await (const chunk of req) text += chunk;
  return JSON.parse(text || "{}");
}

/** Stateful synthetic profiles let the real production Next cache be exercised without a DB. */
export async function handleCertificateFixture(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:4010");
  const reply = (status: number, value: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(value));
    return true;
  };
  if (url.pathname === "/__certificates" && req.method === "POST") {
    const input = (await body(req)) as {
      id: string;
      certificates: CertificateItem[];
      is_published?: boolean;
    };
    const profile: InstructorProfile = {
      ...instructorFixture.instructor,
      id: input.id,
      name: "Certificate Teacher",
      slug: input.id,
      description: null,
      short_bio: null,
      photo_ids: [],
      cities: [],
      yoga_styles: [],
      certificates: input.certificates,
      partner_id: "certificate-partner",
      email: null,
      created_by_partner_id: null,
      claimed_at: "2026-01-01T00:00:00Z",
      published_at: "2026-01-01T00:00:00Z",
      claim_status: "claimed",
      is_published: input.is_published ?? true,
    };
    fixtures.set(input.id, { profile, writes: 0, denyRead: false });
    return reply(200, profile);
  }
  if (url.pathname.startsWith("/__certificates/")) {
    const fixture = fixtures.get(url.pathname.split("/").at(-1)!);
    if (!fixture) return reply(404, {});
    if (req.method === "POST") fixture.denyRead = Boolean((await body(req)).denyRead);
    return reply(200, fixture);
  }
  const match = /^\/instructors\/(certificate-[^/]+)(\/publish)?$/.exec(url.pathname);
  if (match) {
    const fixture = fixtures.get(match[1]);
    if (!fixture) return reply(404, {});
    if (req.headers.authorization !== `Bearer ${certificateOwnerToken}`)
      return reply(401, { detail: "Unauthorized" });
    if (req.method === "GET" && fixture.denyRead) return reply(403, { detail: "Not authorized" });
    if (req.method === "PUT") {
      const input = await body(req);
      fixture.profile = { ...fixture.profile, ...input };
      if (input.name !== "Certificate Teacher") fixture.profile.slug = `${match[1]}-renamed`;
      fixture.writes++;
    }
    if (match[2] && req.method === "POST") fixture.profile.is_published = true;
    return reply(200, fixture.profile);
  }
  if (url.pathname.startsWith("/instructor/certificate-")) {
    const slug = url.pathname.split("/").at(-1);
    const fixture = [...fixtures.values()].find((item) => item.profile.slug === slug);
    if (!fixture) return reply(404, { detail: "Instructor not found" });
    return reply(200, {
      ...instructorFixture,
      instructor: {
        ...fixture.profile,
        certificates: fixture.profile.is_published ? fixture.profile.certificates : null,
      },
    });
  }
  return false;
}
