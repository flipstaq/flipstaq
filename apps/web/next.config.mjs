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
      // Rewrite avatar uploads to API route
      {
        source: '/uploads/avatars/:filename',
        destination: '/api/uploads/avatars/:filename',
      },
    ];
  },
};

export default nextConfig;
