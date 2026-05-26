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
      // Root serves workshops listing (/ is canonical for wydarzenia)
      { source: "/", destination: "/workshops" },
      // Short canonical slug URLs → internal route folders
      { source: "/wydarzenia/:slug", destination: "/workshops/:slug" },
      { source: "/wyjazdy/:slug", destination: "/retreats/:slug" },
      { source: "/zajecia/:slug", destination: "/classes/:slug" },
      // Polish-facing URLs → internal English route folders (kept for backward compat)
      { source: "/wydarzenia/:path*", destination: "/workshops/:path*" },
      { source: "/wyjazdy/:path*", destination: "/retreats/:path*" },
      { source: "/zajecia/:path*", destination: "/classes/:path*" },
    ];
  },
  async redirects() {
    const wyjazdy = { type: "host", value: "wyjazdy.yoga" };
    const wydarzenia = { type: "host", value: "wydarzenia.yoga" };
    const appJoga = { type: "host", value: "app.joga.yoga" };

    return [
      // ── Old domain → joga.yoga redirects (host-conditional, processed first) ──

      // wyjazdy.yoga
      { source: "/", has: [wyjazdy], destination: "https://joga.yoga/wyjazdy", permanent: true },
      { source: "/contact", has: [wyjazdy], destination: "https://joga.yoga/contact", permanent: true },
      { source: "/policy", has: [wyjazdy], destination: "https://joga.yoga/policy", permanent: true },
      { source: "/terms", has: [wyjazdy], destination: "https://joga.yoga/terms", permanent: true },
      { source: "/delete-account", has: [wyjazdy], destination: "https://joga.yoga/delete-account", permanent: true },
      { source: "/retreats/:path*", has: [wyjazdy], destination: "https://joga.yoga/wyjazdy/:path*", permanent: true },
      { source: "/partner/:organizerId", has: [wyjazdy], destination: "https://joga.yoga/partner/:organizerId", permanent: true },
      { source: "/organizer/:organizerId", has: [wyjazdy], destination: "https://joga.yoga/partner/:organizerId", permanent: true },
      { source: "/:path*", has: [wyjazdy], destination: "https://joga.yoga/wyjazdy/:path*", permanent: true },

      // wydarzenia.yoga
      { source: "/", has: [wydarzenia], destination: "https://joga.yoga/", permanent: true },
      { source: "/contact", has: [wydarzenia], destination: "https://joga.yoga/contact", permanent: true },
      { source: "/policy", has: [wydarzenia], destination: "https://joga.yoga/policy", permanent: true },
      { source: "/terms", has: [wydarzenia], destination: "https://joga.yoga/terms", permanent: true },
      { source: "/delete-account", has: [wydarzenia], destination: "https://joga.yoga/delete-account", permanent: true },
      { source: "/workshops/:path*", has: [wydarzenia], destination: "https://joga.yoga/wydarzenia/:path*", permanent: true },
      { source: "/partner/:organizerId", has: [wydarzenia], destination: "https://joga.yoga/partner/:organizerId", permanent: true },
      { source: "/organizer/:organizerId", has: [wydarzenia], destination: "https://joga.yoga/partner/:organizerId", permanent: true },
      { source: "/:path*", has: [wydarzenia], destination: "https://joga.yoga/wydarzenia/:path*", permanent: true },

      // app.joga.yoga (old profile subdomain)
      { source: "/:path*", has: [appJoga], destination: "https://joga.yoga/profile/:path*", permanent: true },

      // ── joga.yoga internal redirects ──

      // /wydarzenia is redundant — / is canonical
      { source: "/wydarzenia", destination: "/", permanent: true },
      // Old English paths → Polish paths
      { source: "/workshops/:path*", destination: "/wydarzenia/:path*", permanent: true },
      { source: "/retreats/:path*", destination: "/wyjazdy/:path*", permanent: true },
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
