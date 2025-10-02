/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@brainliest/ui'],
  experimental: {
    optimizePackageImports: ['@brainliest/ui'],
  },
};

module.exports = nextConfig;
