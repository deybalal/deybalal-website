import type { NextConfig } from "next";

const downloadHost =
  process.env.NEXT_PUBLIC_DOWNLOAD_HOST || "https://dl.deybalal.ir";

let downloadHostname = "dl.deybalal.ir";
try {
  downloadHostname = new URL(downloadHost).hostname;
} catch {
  // fallback default
}

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
    "192.168.1.109",
    "192.168.70.109",
    "my.local",
    "lori.local",
    "192.168.70.108",
    "deybalal.ir",
    "dl.deybalal.ir",
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: downloadHostname,
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dl.deybalal.ir",
        port: "",
        pathname: "/**",
      },
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

  async redirects() {
    const targetHost =
      process.env.NEXT_PUBLIC_DOWNLOAD_HOST || "https://dl.deybalal.ir";
    const cleanHost = targetHost.replace(/\/+$/, "");
    return [
      {
        source: "/assets/:path*",
        destination: `${cleanHost}/assets/:path*`,
        permanent: false,
      },
    ];
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
