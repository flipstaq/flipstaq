/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // Configure images to allow API Gateway URLs
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3100',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3100',
        pathname: '/uploads/**',
      },
    ],
    // Preserve image quality - only use supported formats
    formats: ['image/webp'], // Only webp is supported in formats array
    // Note: quality property goes on the Image component, not in config
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
