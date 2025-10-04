/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@brainliest/ui'],
  experimental: {
    optimizePackageImports: ['@brainliest/ui'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bcrypt: false,
        '@mapbox/node-pre-gyp': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
