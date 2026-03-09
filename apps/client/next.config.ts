import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'http://famaserver_backend:3001/:path*', // Docker Backend
      },
    ];
  },
};

export default nextConfig;
