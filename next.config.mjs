/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["res.cloudinary.com", "via.placeholder.com", "images.unsplash.com", "avatar.vercel.sh", "placehold.co"]
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
