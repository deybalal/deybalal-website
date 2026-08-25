import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["svg-captcha"],
  /* config options here */
  experimental: {
    proxyClientMaxBodySize: 52428800, // 50MB in bytes
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  allowedDevOrigins: [
    "locahost",
    "192.168.1.108",
    "my.local",
    "lori.local",
    "192.168.70.108",
  ],
  images: {
    unoptimized: true,
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
      {
        protocol: "http",
        hostname: "lori.local",
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
