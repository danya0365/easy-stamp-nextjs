import { execSync } from "child_process";
import type { NextConfig } from "next";

const getCommitSha = () => {
  try {
    return (
      process.env.VERCEL_GIT_COMMIT_SHA ||
      execSync("git rev-parse HEAD").toString().trim()
    );
  } catch {
    return "";
  }
};

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.1.0",
    NEXT_PUBLIC_COMMIT_SHA: getCommitSha(),
  },
  experimental: {
    // Slip uploads (submitSlipAction) accept up to 5MB; phone photos routinely
    // exceed Next's 1MB server-action default, which silently breaks uploads.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
