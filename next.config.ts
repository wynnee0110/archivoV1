import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Initialize PWA
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Disable in dev mode
  workboxOptions: {
    disableDevLogs: true,
  },
});

// 2. Your Normal Config
const nextConfig: NextConfig = {
  // If you are planning to use Capacitor later, keep this:
  // output: 'export', 
  // images: { unoptimized: true },
};

// 3. Wrap and Export
export default withPWA(nextConfig);