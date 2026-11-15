import type { NextConfig } from "next";

// Sent with every response. The game needs the gamepad, serial (ESP32
// controller) and fullscreen features; it never uses camera, microphone or location.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "gamepad=(self), serial=(self), fullscreen=(self), camera=(), microphone=(), geolocation=()",
  },
];
const config: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Game art never changes under the same file name during a deployment.
        source: "/art/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};
export default config;
