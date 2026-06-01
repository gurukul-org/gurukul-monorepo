/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbo repo compatibility
  transpilePackages: [],

  // So Next.js can import .md files as raw strings if needed
  webpack(config) {
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    });
    return config;
  },
};

module.exports = nextConfig;
