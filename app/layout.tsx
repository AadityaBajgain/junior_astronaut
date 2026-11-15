import type { Metadata } from "next";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/press-start-2p/latin-400.css";
import "./style.css";

export const metadata: Metadata = {
  title: "JuniorAstronaut · Mission map",
  description: "Choose a destination on your astronaut training map.",
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
