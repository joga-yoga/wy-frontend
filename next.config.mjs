import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */

const nextConfig = {
  cacheComponents: true,
  reactStrictMode: false,
  allowedDevOrigins: ["172.20.10.4", "192.168.8.188"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatar.vercel.sh" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  async rewrites() {
    return [
      // Note: "/" has an actual page at (public)/page.tsx — no rewrite needed.
      // Rewrites for "/" caused RSC 404s during client-side navigation.
      // Section roots (explicit bare entries — :path* zero-segment matching unreliable for RSC)
      { source: "/wyjazdy", destination: "/retreats" },
      { source: "/wydarzenia", destination: "/workshops" },
      { source: "/zajecia", destination: "/classes" },
      { source: "/kursy", destination: "/courses" },
      // Short canonical slug URLs → internal route folders
      { source: "/wydarzenia/:slug", destination: "/workshops/:slug" },
      { source: "/wyjazdy/:slug", destination: "/retreats/:slug" },
      { source: "/zajecia/:slug", destination: "/classes/:slug" },
      { source: "/kursy/:slug", destination: "/courses/:slug" },
      // Polish-facing URLs → internal English route folders (kept for backward compat)
      { source: "/wydarzenia/:path*", destination: "/workshops/:path*" },
      { source: "/wyjazdy/:path*", destination: "/retreats/:path*" },
      { source: "/zajecia/:path*", destination: "/classes/:path*" },
      { source: "/kursy/:path*", destination: "/courses/:path*" },
      // Polish instructor URL → internal English route folder
      // `/instruktorzy` (the directory) is a separate first segment from `/instruktor`,
      // so it cannot be caught by the `/instruktor/:slug` rule below and needs its own.
      { source: "/instruktorzy", destination: "/instructors" },
      // The studio directory index. `/studia` is a separate first segment from `/studio`,
      // so it cannot be caught by the `/studio/...` rules below and needs its own entry.
      { source: "/studia", destination: "/studios" },
      // Claim and removal hang off the directory index, not off an individual studio,
      // because they must work for a listing that has no page and therefore no slug.
      { source: "/studia/:path*", destination: "/studios/:path*" },
      { source: "/instruktor/dodaj", destination: "/instructor/dodaj" },
      { source: "/instruktor/dodaj/:path*", destination: "/instructor/dodaj/:path*" },
      { source: "/instruktor/:slug", destination: "/instructor/:slug" },
      { source: "/instruktor/:slug/grafik", destination: "/instructor/:slug/schedule" },
      { source: "/instruktor/:slug/zajecia", destination: "/instructor/:slug/classes" },
      // Public studio schedule route rename (grafik → schedule)
      { source: "/studio/:slug/grafik", destination: "/studio/:slug/schedule" },
      { source: "/studio/:slug/zajecia", destination: "/studio/:slug/classes" },
      {
        source: "/studio/:slug/zajecia/:classSlug",
        destination: "/studio/:slug/classes/:classSlug",
      },
    ];
  },
  async redirects() {
    const wyjazdy = { type: "host", value: "wyjazdy.yoga" };
    const wydarzenia = { type: "host", value: "wydarzenia.yoga" };
    const appJoga = { type: "host", value: "app.joga.yoga" };

    return [
      { source: "/instructor/dodaj", destination: "/instruktor/dodaj", permanent: true },
      {
        source: "/instructor/dodaj/:path*",
        destination: "/instruktor/dodaj/:path*",
        permanent: true,
      },

      // ── Old domain → joga.yoga redirects (host-conditional, processed first) ──

      // wyjazdy.yoga
      { source: "/", has: [wyjazdy], destination: "https://joga.yoga/wyjazdy", statusCode: 301 },
      {
        source: "/contact",
        has: [wyjazdy],
        destination: "https://joga.yoga/contact",
        statusCode: 301,
      },
      {
        source: "/policy",
        has: [wyjazdy],
        destination: "https://joga.yoga/policy",
        statusCode: 301,
      },
      { source: "/terms", has: [wyjazdy], destination: "https://joga.yoga/terms", statusCode: 301 },
      {
        source: "/delete-account",
        has: [wyjazdy],
        destination: "https://joga.yoga/delete-account",
        statusCode: 301,
      },
      {
        source: "/retreats/:path*",
        has: [wyjazdy],
        destination: "https://joga.yoga/wyjazdy/:path*",
        statusCode: 301,
      },
      {
        source: "/partner/:organizerId",
        has: [wyjazdy],
        destination: "https://joga.yoga/partner/:organizerId",
        statusCode: 301,
      },
      {
        source: "/organizer/:organizerId",
        has: [wyjazdy],
        destination: "https://joga.yoga/partner/:organizerId",
        statusCode: 301,
      },
      {
        source: "/sitemap.xml",
        has: [wyjazdy],
        destination: "https://joga.yoga/sitemap.xml",
        statusCode: 301,
      },
      {
        source: "/:path*",
        has: [wyjazdy],
        destination: "https://joga.yoga/wyjazdy/:path*",
        statusCode: 301,
      },

      // wydarzenia.yoga
      { source: "/", has: [wydarzenia], destination: "https://joga.yoga/", statusCode: 301 },
      {
        source: "/contact",
        has: [wydarzenia],
        destination: "https://joga.yoga/contact",
        statusCode: 301,
      },
      {
        source: "/policy",
        has: [wydarzenia],
        destination: "https://joga.yoga/policy",
        statusCode: 301,
      },
      {
        source: "/terms",
        has: [wydarzenia],
        destination: "https://joga.yoga/terms",
        statusCode: 301,
      },
      {
        source: "/delete-account",
        has: [wydarzenia],
        destination: "https://joga.yoga/delete-account",
        statusCode: 301,
      },
      {
        source: "/workshops/:path*",
        has: [wydarzenia],
        destination: "https://joga.yoga/wydarzenia/:path*",
        statusCode: 301,
      },
      {
        source: "/partner/:organizerId",
        has: [wydarzenia],
        destination: "https://joga.yoga/partner/:organizerId",
        statusCode: 301,
      },
      {
        source: "/organizer/:organizerId",
        has: [wydarzenia],
        destination: "https://joga.yoga/partner/:organizerId",
        statusCode: 301,
      },
      {
        source: "/sitemap.xml",
        has: [wydarzenia],
        destination: "https://joga.yoga/sitemap.xml",
        statusCode: 301,
      },
      {
        source: "/:path*",
        has: [wydarzenia],
        destination: "https://joga.yoga/wydarzenia/:path*",
        statusCode: 301,
      },

      // app.joga.yoga (old profile subdomain).
      // Deliberately still points at /profile/:path*: that lands on joga.yoga as a
      // fresh request and is picked up by the /profile
      {
        source: "/:path*",
        has: [appJoga],
        destination: "https://joga.yoga/profile/:path*",
        permanent: true,
      },

      // ── joga.yoga internal redirects ──

      // Specific retreat redirects (renamed/replaced slugs)
      {
        source: "/wyjazdy/april-6-retreat-by-karina-krueger",
        destination: "/wyjazdy/nepal",
        permanent: true,
      },
      {
        source:
          "/wyjazdy/podroz-w-glab-siebie-retreat-z-wykladami-thay-thien-sona-joga-i-medytacja",
        destination: "/wyjazdy/karkonosze",
        permanent: true,
      },
      // Canonical partners page
      { source: "/wydarzenia/partners", destination: "/partners", permanent: true },
      { source: "/wyjazdy/partners", destination: "/partners", permanent: true },
      { source: "/workshops/partners", destination: "/partners", permanent: true },
      { source: "/retreats/partners", destination: "/partners", permanent: true },
      // /wydarzenia is redundant — / is canonical
      { source: "/wydarzenia", destination: "/", permanent: true },
      // Old English paths → Polish paths (bare + wildcard, explicit for RSC reliability)
      { source: "/workshops", destination: "/", permanent: true },
      { source: "/workshops/:path*", destination: "/wydarzenia/:path*", permanent: true },
      { source: "/retreats", destination: "/wyjazdy", permanent: true },
      { source: "/retreats/:path*", destination: "/wyjazdy/:path*", permanent: true },
      { source: "/classes", destination: "/zajecia", permanent: true },
      { source: "/classes/:path*", destination: "/zajecia/:path*", permanent: true },
      // Section-specific partner pages → shared /partner/:id
      {
        source: "/wydarzenia/partner/:organizerId",
        destination: "/partner/:organizerId",
        permanent: true,
      },
      {
        source: "/wyjazdy/partner/:organizerId",
        destination: "/partner/:organizerId",
        permanent: true,
      },
      // Legacy organizer slugs
      { source: "/organizer/:organizerId", destination: "/partner/:organizerId", permanent: true },
      {
        source: "/workshops/organizer/:organizerId",
        destination: "/partner/:organizerId",
        permanent: true,
      },
      {
        source: "/retreats/organizer/:organizerId",
        destination: "/partner/:organizerId",
        permanent: true,
      },
      {
        source: "/workshops/partner/:organizerId",
        destination: "/partner/:organizerId",
        permanent: true,
      },
      {
        source: "/retreats/partner/:organizerId",
        destination: "/partner/:organizerId",
        permanent: true,
      },
      { source: "/workshops/sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/retreats/sitemap.xml", destination: "/sitemap.xml", permanent: true },
    ];
  },
};

/**
 * Prototype workbench (`.plans/proto-workbench/`, T01).
 *
 * The dev-only prototype shell lives in `src/app/(proto)/` and its route files are named
 * `page.proto.tsx` / `layout.proto.tsx`. App Router discovery globs `page.{ext}` and
 * `layout.{ext}` off `pageExtensions`, so those files are routes ONLY while `"proto.tsx"`
 * is in this list — which is only during `next dev`. In every other phase they are inert
 * files nothing imports, so `/proto` does not exist in a production build and the variant
 * modules are never bundled.
 *
 * Keyed on `phase` rather than `NODE_ENV`: the phase argument is passed by Next itself
 * (`normalizeConfig` in `next/dist/server/config-shared.js`) and cannot be out of date or
 * set by a caller, whereas NODE_ENV depends on when the CLI happens to assign it.
 *
 * The four default extensions are written out in full on purpose: supplying `pageExtensions`
 * REPLACES the default list (`next/dist/server/config-shared.js`) rather than extending it,
 * so dropping one here would silently unroute part of the product.
 */
export default function config(phase) {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    ...nextConfig,
    pageExtensions: ["tsx", "ts", "jsx", "js", ...(isDevServer ? ["proto.tsx"] : [])],
  };
}
