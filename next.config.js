/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["res.cloudinary.com", "via.placeholder.com"],
  },
};

module.exports = nextConfig;
