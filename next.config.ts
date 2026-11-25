import type { NextConfig } from "next";

const legacyCategoryRedirects = [
  ["/category/specialisti", "/specialisti"],
  ["/category/zdravni-zavedenia", "/zavedenia"],
  ["/category/полезно-диети-лекарства-съвети", "/articles"],
] as const

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
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
  async redirects() {
    const category = legacyCategoryRedirects.flatMap(([source, destination]) => {
      const encoded = source
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")
      const sources = encoded === source ? [source] : [source, encoded]
      return sources.flatMap((item) => [
        { source: item, destination, statusCode: 301 },
        { source: `${item}/`, destination, statusCode: 301 },
      ])
    })
    return [
      { source: "/sitemap_index.xml", destination: "https://zdravenspravochnik.com/sitemap.xml", statusCode: 301 },
      { source: "/sitemap_index.xml/", destination: "https://zdravenspravochnik.com/sitemap.xml", statusCode: 301 },
      { source: "/own-search", destination: "/search", permanent: true },
      { source: "/own-search/", destination: "/search", permanent: true },
      { source: "/tag/:slug", destination: "/specialisti", permanent: true },
      { source: "/tag/:slug/", destination: "/specialisti", permanent: true },
      ...category,
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:path*/",
          destination: "/:path*",
        },
      ],
      afterFiles: [
        {
          source: "/wp-content/uploads/:path*",
          destination: "https://media.zdravenspravochnik.com/:path*",
        },
      ],
    }
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
