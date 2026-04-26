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
  async redirects() {
    return [
      {
        source: "/organizer/:organizerId",
        destination: "/partner/:organizerId",
        permanent: true,
      },
      {
        source: "/workshops/organizer/:organizerId",
        destination: "/workshops/partner/:organizerId",
        permanent: true,
      },
      {
        source: "/retreats/organizer/:organizerId",
        destination: "/retreats/partner/:organizerId",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
