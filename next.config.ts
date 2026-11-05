import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    proxyClientMaxBodySize: 26214400, // 25MB in bytes
  },
  allowedDevOrigins: ["locahost", "192.168.1.108", "my.local"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dl.mytg.ir",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dl2.mytg.ir",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
