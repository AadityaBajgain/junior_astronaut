import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoonSprout",
    short_name: "MoonSprout",
    description:
      "Go, Land, Live, Explore: an astronaut training game for ages 7 to 12 that uses real NASA data.",
    start_url: "/",
    display: "fullscreen",
    orientation: "landscape",
    background_color: "#0b1321",
    theme_color: "#0b1321",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
