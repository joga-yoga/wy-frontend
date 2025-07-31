/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["res.cloudinary.com", "via.placeholder.com", "images.unsplash.com", "avatar.vercel.sh", "placehold.co"]
  },
};

export default nextConfig;