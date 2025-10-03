/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@brainliest/ui', 'lucide-react'],
  experimental: {
    optimizePackageImports: ['@brainliest/ui'],
  },
};

module.exports = nextConfig;
