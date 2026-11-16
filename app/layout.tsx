import type { Metadata, Viewport } from "next";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/press-start-2p/latin-400.css";
import "./style.css";

// Vercel provides the production host name. Locally the links fall back to localhost.
const site = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
  : "http://127.0.0.1:3000";
const description =
  "Go, Land, Live, Explore: an astronaut training game for ages 7 to 12. Pack a rocket, power a Moon base, grow food in Moon soil and drive a lunar rover, with real NASA photos, facts and Sun storm data.";
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "JuniorAstronaut · Mission map",
    template: "%s",
  },
  description,
  applicationName: "JuniorAstronaut",
  openGraph: {
    title: "JuniorAstronaut",
    description,
    type: "website",
    images: [
      { url: "/art/go.webp", alt: "A pixel-art rocket on its launchpad" },
    ],
  },
};
export const viewport: Viewport = {
  themeColor: "#0b1321",
  colorScheme: "dark",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
