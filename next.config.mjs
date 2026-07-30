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
      { source: "/instruktor/:slug", destination: "/instructor/:slug" },
      { source: "/instruktor/:slug/grafik", destination: "/instructor/:slug/schedule" },
      { source: "/instruktor/:slug/zajecia", destination: "/instructor/:slug/classes" },
      // Public studio schedule route rename (grafik → schedule)
      { source: "/studio/:slug/grafik", destination: "/studio/:slug/schedule" },
      { source: "/studio/:slug/zajecia", destination: "/studio/:slug/classes" },
      { source: "/studio/:slug/zajecia/:classSlug", destination: "/studio/:slug/classes/:classSlug" },

      // ── Account area: Polish-facing URLs → internal English route folders ──
      // Only the first segment under /konto/partner is localised; deeper segments
      // stay English and pass through the :path* tail (same convention as
      // /instruktor/:slug/grafik above). Bare + wildcard entries are explicit
      // because zero-segment :path* matching is unreliable for RSC.
      { source: "/konto", destination: "/account" },
      { source: "/konto/rezerwacje", destination: "/account/bookings" },
      { source: "/konto/rezerwacje/:path*", destination: "/account/bookings/:path*" },

      // Auth leaves hang off /konto, not /konto/partner
      { source: "/konto/logowanie", destination: "/account/login" },
      { source: "/konto/rejestracja", destination: "/account/signup" },
      { source: "/konto/reset-hasla", destination: "/account/reset-password" },
      { source: "/konto/reset-hasla/:path*", destination: "/account/reset-password/:path*" },

      // Partner panel
      { source: "/konto/partner", destination: "/account/partner" },
      { source: "/konto/partner/grafik", destination: "/account/partner/schedule" },
      { source: "/konto/partner/grafik/:path*", destination: "/account/partner/schedule/:path*" },
      { source: "/konto/partner/rezerwacje", destination: "/account/partner/bookings" },
      { source: "/konto/partner/rezerwacje/:path*", destination: "/account/partner/bookings/:path*" },
      { source: "/konto/partner/oferta", destination: "/account/partner/offer" },
      { source: "/konto/partner/oferta/:path*", destination: "/account/partner/offer/:path*" },
      { source: "/konto/partner/menu", destination: "/account/partner/menu" },
      { source: "/konto/partner/menu/:path*", destination: "/account/partner/menu/:path*" },
      { source: "/konto/partner/konto", destination: "/account/partner/account" },
      { source: "/konto/partner/konto/:path*", destination: "/account/partner/account/:path*" },
      { source: "/konto/partner/zajecia", destination: "/account/partner/classes" },
      { source: "/konto/partner/zajecia/:path*", destination: "/account/partner/classes/:path*" },
      { source: "/konto/partner/grafiki-zajec", destination: "/account/partner/class-schedules" },
      { source: "/konto/partner/grafiki-zajec/:path*", destination: "/account/partner/class-schedules/:path*" },
      { source: "/konto/partner/szablony-zajec", destination: "/account/partner/class-templates" },
      { source: "/konto/partner/szablony-zajec/:path*", destination: "/account/partner/class-templates/:path*" },
      { source: "/konto/partner/kursy", destination: "/account/partner/courses" },
      { source: "/konto/partner/kursy/:path*", destination: "/account/partner/courses/:path*" },
      { source: "/konto/partner/wydarzenia", destination: "/account/partner/workshops" },
      { source: "/konto/partner/wydarzenia/:path*", destination: "/account/partner/workshops/:path*" },
      { source: "/konto/partner/wyjazdy", destination: "/account/partner/retreats" },
      { source: "/konto/partner/wyjazdy/:path*", destination: "/account/partner/retreats/:path*" },
      { source: "/konto/partner/instruktorzy", destination: "/account/partner/instructors" },
      { source: "/konto/partner/instruktorzy/:path*", destination: "/account/partner/instructors/:path*" },
      { source: "/konto/partner/studio", destination: "/account/partner/studio" },
      { source: "/konto/partner/studio/:path*", destination: "/account/partner/studio/:path*" },
      { source: "/konto/partner/organizacja", destination: "/account/partner/partner" },
      { source: "/konto/partner/organizacja/:path*", destination: "/account/partner/partner/:path*" },
      { source: "/konto/partner/zostan-partnerem", destination: "/account/partner/become-partner" },
      { source: "/konto/partner/klienci", destination: "/account/partner/clients" },
      { source: "/konto/partner/klienci/:path*", destination: "/account/partner/clients/:path*" },
      { source: "/konto/partner/rozliczenia", destination: "/account/partner/reconciliation" },
    ];
  },
  async redirects() {
    const wyjazdy = { type: "host", value: "wyjazdy.yoga" };
    const wydarzenia = { type: "host", value: "wydarzenia.yoga" };
    const appJoga = { type: "host", value: "app.joga.yoga" };

    return [
      // ── Retired /profile panel → /konto account area (bookmark safety net) ──
      // The panel moved to /account/partner, served as /konto/partner. Auth leaves
      // hang off /konto, so they need explicit entries ahead of the catch-all.
      // Bare + wildcard are separate because zero-segment :path* is unreliable here.
      { source: "/profile/login", destination: "/konto/logowanie", permanent: false },
      { source: "/profile/signup", destination: "/konto/rejestracja", permanent: false },
      { source: "/profile/reset-password", destination: "/konto/reset-hasla", permanent: false },
      { source: "/profile/reset-password/:path*", destination: "/konto/reset-hasla/:path*", permanent: false },
      { source: "/profile/auth/:path*", destination: "/konto/auth/:path*", permanent: false },
      // Panel leaves that were already Polish keep working
      { source: "/profile/grafik", destination: "/konto/partner/grafik", permanent: false },
      { source: "/profile/grafik/:path*", destination: "/konto/partner/grafik/:path*", permanent: false },
      { source: "/profile/oferta", destination: "/konto/partner/oferta", permanent: false },
      { source: "/profile/oferta/:path*", destination: "/konto/partner/oferta/:path*", permanent: false },
      // English panel leaves → their new Polish equivalents
      { source: "/profile/schedule", destination: "/konto/partner/grafik", permanent: false },
      { source: "/profile/schedule/:path*", destination: "/konto/partner/grafik/:path*", permanent: false },
      { source: "/profile/offer", destination: "/konto/partner/oferta", permanent: false },
      { source: "/profile/offer/:path*", destination: "/konto/partner/oferta/:path*", permanent: false },
      { source: "/profile/konto", destination: "/konto/partner/konto", permanent: false },
      { source: "/profile/account", destination: "/konto/partner/konto", permanent: false },
      { source: "/profile/account/:path*", destination: "/konto/partner/konto/:path*", permanent: false },
      { source: "/profile/classes", destination: "/konto/partner/zajecia", permanent: false },
      { source: "/profile/classes/:path*", destination: "/konto/partner/zajecia/:path*", permanent: false },
      { source: "/profile/class-schedules", destination: "/konto/partner/grafiki-zajec", permanent: false },
      { source: "/profile/class-schedules/:path*", destination: "/konto/partner/grafiki-zajec/:path*", permanent: false },
      { source: "/profile/class-templates", destination: "/konto/partner/szablony-zajec", permanent: false },
      { source: "/profile/class-templates/:path*", destination: "/konto/partner/szablony-zajec/:path*", permanent: false },
      { source: "/profile/courses", destination: "/konto/partner/kursy", permanent: false },
      { source: "/profile/courses/:path*", destination: "/konto/partner/kursy/:path*", permanent: false },
      { source: "/profile/workshops", destination: "/konto/partner/wydarzenia", permanent: false },
      { source: "/profile/workshops/:path*", destination: "/konto/partner/wydarzenia/:path*", permanent: false },
      { source: "/profile/retreats", destination: "/konto/partner/wyjazdy", permanent: false },
      { source: "/profile/retreats/:path*", destination: "/konto/partner/wyjazdy/:path*", permanent: false },
      { source: "/profile/instructors", destination: "/konto/partner/instruktorzy", permanent: false },
      { source: "/profile/instructors/:path*", destination: "/konto/partner/instruktorzy/:path*", permanent: false },
      { source: "/profile/studio", destination: "/konto/partner/studio", permanent: false },
      { source: "/profile/studio/:path*", destination: "/konto/partner/studio/:path*", permanent: false },
      // Old messages/orders split collapsed into the unified Rezerwacje inbox (T12).
      { source: "/profile/messages", destination: "/konto/partner/rezerwacje", permanent: false },
      { source: "/profile/messages/:path*", destination: "/konto/partner/rezerwacje/:path*", permanent: false },
      { source: "/profile/orders", destination: "/konto/partner/rezerwacje", permanent: false },
      { source: "/profile/orders/:path*", destination: "/konto/partner/rezerwacje/:path*", permanent: false },
      { source: "/profile/partner", destination: "/konto/partner/organizacja", permanent: false },
      { source: "/profile/partner/:path*", destination: "/konto/partner/organizacja/:path*", permanent: false },
      { source: "/profile/become-partner", destination: "/konto/partner/zostan-partnerem", permanent: false },
      // Catch-all last: anything else under the old panel lands on the panel root
      { source: "/profile", destination: "/konto/partner", permanent: false },
      { source: "/profile/:path*", destination: "/konto/partner/:path*", permanent: false },

      // ── Old domain → joga.yoga redirects (host-conditional, processed first) ──

      // wyjazdy.yoga
      { source: "/", has: [wyjazdy], destination: "https://joga.yoga/wyjazdy", statusCode: 301 },
      { source: "/contact", has: [wyjazdy], destination: "https://joga.yoga/contact", statusCode: 301 },
      { source: "/policy", has: [wyjazdy], destination: "https://joga.yoga/policy", statusCode: 301 },
      { source: "/terms", has: [wyjazdy], destination: "https://joga.yoga/terms", statusCode: 301 },
      { source: "/delete-account", has: [wyjazdy], destination: "https://joga.yoga/delete-account", statusCode: 301 },
      { source: "/retreats/:path*", has: [wyjazdy], destination: "https://joga.yoga/wyjazdy/:path*", statusCode: 301 },
      { source: "/partner/:organizerId", has: [wyjazdy], destination: "https://joga.yoga/partner/:organizerId", statusCode: 301 },
      { source: "/organizer/:organizerId", has: [wyjazdy], destination: "https://joga.yoga/partner/:organizerId", statusCode: 301 },
      { source: "/sitemap.xml", has: [wyjazdy], destination: "https://joga.yoga/sitemap.xml", statusCode: 301 },
      { source: "/:path*", has: [wyjazdy], destination: "https://joga.yoga/wyjazdy/:path*", statusCode: 301 },

      // wydarzenia.yoga
      { source: "/", has: [wydarzenia], destination: "https://joga.yoga/", statusCode: 301 },
      { source: "/contact", has: [wydarzenia], destination: "https://joga.yoga/contact", statusCode: 301 },
      { source: "/policy", has: [wydarzenia], destination: "https://joga.yoga/policy", statusCode: 301 },
      { source: "/terms", has: [wydarzenia], destination: "https://joga.yoga/terms", statusCode: 301 },
      { source: "/delete-account", has: [wydarzenia], destination: "https://joga.yoga/delete-account", statusCode: 301 },
      { source: "/workshops/:path*", has: [wydarzenia], destination: "https://joga.yoga/wydarzenia/:path*", statusCode: 301 },
      { source: "/partner/:organizerId", has: [wydarzenia], destination: "https://joga.yoga/partner/:organizerId", statusCode: 301 },
      { source: "/organizer/:organizerId", has: [wydarzenia], destination: "https://joga.yoga/partner/:organizerId", statusCode: 301 },
      { source: "/sitemap.xml", has: [wydarzenia], destination: "https://joga.yoga/sitemap.xml", statusCode: 301 },
      { source: "/:path*", has: [wydarzenia], destination: "https://joga.yoga/wydarzenia/:path*", statusCode: 301 },

      // app.joga.yoga (old profile subdomain).
      // Deliberately still points at /profile/:path*: that lands on joga.yoga as a
      // fresh request and is picked up by the /profile → /konto table above, which
      // knows that auth leaves go to /konto/... and panel leaves to /konto/partner/...
      // Retargeting this straight at /konto/partner would break app.joga.yoga/login.
      // Costs one extra hop on a retired subdomain.
      { source: "/:path*", has: [appJoga], destination: "https://joga.yoga/profile/:path*", permanent: true },

      // ── joga.yoga internal redirects ──

      // Specific retreat redirects (renamed/replaced slugs)
      { source: "/wyjazdy/april-6-retreat-by-karina-krueger", destination: "/wyjazdy/nepal", permanent: true },
      { source: "/wyjazdy/podroz-w-glab-siebie-retreat-z-wykladami-thay-thien-sona-joga-i-medytacja", destination: "/wyjazdy/karkonosze", permanent: true },
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
      { source: "/wydarzenia/partner/:organizerId", destination: "/partner/:organizerId", permanent: true },
      { source: "/wyjazdy/partner/:organizerId", destination: "/partner/:organizerId", permanent: true },
      // Legacy organizer slugs
      { source: "/organizer/:organizerId", destination: "/partner/:organizerId", permanent: true },
      { source: "/workshops/organizer/:organizerId", destination: "/partner/:organizerId", permanent: true },
      { source: "/retreats/organizer/:organizerId", destination: "/partner/:organizerId", permanent: true },
      { source: "/workshops/partner/:organizerId", destination: "/partner/:organizerId", permanent: true },
      { source: "/retreats/partner/:organizerId", destination: "/partner/:organizerId", permanent: true },
      { source: "/workshops/sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/retreats/sitemap.xml", destination: "/sitemap.xml", permanent: true },
    ];
  },
};

export default nextConfig;
