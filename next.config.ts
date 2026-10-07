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
