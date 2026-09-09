import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local Playwright / browser tests often hit 127.0.0.1 while `next dev` binds as localhost.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
