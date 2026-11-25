import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.zdravenspravochnik.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "zdravenspravochnik.com",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "www.zdravenspravochnik.com",
        pathname: "/wp-content/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/wp-content/uploads/:path*",
        destination: "https://media.zdravenspravochnik.com/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/wp-content/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=86400",
          },
          {
            key: "Vercel-CDN-Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
