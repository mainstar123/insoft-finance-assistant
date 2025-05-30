import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    SESSION_MAX_AGE: process.env.SESSION_MAX_AGE,
  },
  // Enable static exports for serverless deployment
  output: 'standalone',
  // Disable React strict mode in development to prevent double renders
  reactStrictMode: false,
};

export default nextConfig;
