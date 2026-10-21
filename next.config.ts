import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
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
};

export default nextConfig;
