import type { NextConfig } from "next";

const backendUrl = (process.env.BACKEND_URL || "").replace(/\/$/, "");
const apiMode = (process.env.NEXT_PUBLIC_API_URL || "").trim().toLowerCase();
const wantsSameOriginProxy =
  apiMode === "same-origin" || apiMode === "" || apiMode === "/";

if (wantsSameOriginProxy && !backendUrl) {
  console.warn(
    "[capex] NEXT_PUBLIC_API_URL is same-origin but BACKEND_URL is unset — /api rewrites are disabled.",
  );
}

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
