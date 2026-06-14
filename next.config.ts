import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Slip uploads (submitSlipAction) accept up to 5MB; phone photos routinely
    // exceed Next's 1MB server-action default, which silently breaks uploads.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
