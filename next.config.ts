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

// Baseline security headers for every response. Deliberately conservative on CSP
// (only frame-ancestors/object-src/base-uri) so maplibre/recharts/inline styles
// keep working — a full script-src CSP would need a nonce pipeline (do later,
// report-only first). HSTS only takes effect over HTTPS (prod), harmless on http.
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  },
];

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
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
