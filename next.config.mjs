/** @type {import('next').NextConfig} */

const nextConfig = {
  cacheComponents: true,
  reactStrictMode: false,
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
      // Short canonical slug URLs → internal route folders
      { source: "/wydarzenia/:slug", destination: "/workshops/:slug" },
      { source: "/wyjazdy/:slug", destination: "/retreats/:slug" },
      { source: "/zajecia/:slug", destination: "/classes/:slug" },
      // Polish-facing URLs → internal English route folders (kept for backward compat)
      { source: "/wydarzenia/:path*", destination: "/workshops/:path*" },
      { source: "/wyjazdy/:path*", destination: "/retreats/:path*" },
      { source: "/zajecia/:path*", destination: "/classes/:path*" },
      // Polish instructor URL → internal English route folder
      { source: "/instruktor/:slug", destination: "/instructor/:slug" },
    ];
  },
  async redirects() {
    const wyjazdy = { type: "host", value: "wyjazdy.yoga" };
    const wydarzenia = { type: "host", value: "wydarzenia.yoga" };
    const appJoga = { type: "host", value: "app.joga.yoga" };

    return [
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

      // app.joga.yoga (old profile subdomain)
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
