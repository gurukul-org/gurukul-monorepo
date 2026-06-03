/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Required for dev on lvh.me and any wildcard subdomain.
  // Next 15.3+ rejects cross-origin asset requests in dev unless allowlisted.
  allowedDevOrigins: ['lvh.me', '*.lvh.me'],
};

export default nextConfig;
