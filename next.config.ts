import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // The approved source is 1600 px wide; larger derivatives add no detail.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          // Embedding protection only: do not block Next hydration or approved
          // post-consent providers with an untested script/connect policy.
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Also covers framework-generated 405/OPTIONS responses.
        source: '/api/leads',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        // Generated names contain a content hash. Never apply this to HTML/API/SEO.
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
