/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // Remove i18n config since we're handling it manually
  async rewrites() {
    return [
      // Rewrite locale files to packages directory
      {
        source: '/locales/:path*',
        destination: '/api/locales/:path*',
      },
    ];
  },
};

export default nextConfig;
