import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SafeSpend",
    short_name: "SafeSpend",
    description: "Private personal finance and safe-to-spend planning",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8fafc",
    theme_color: "#0b855f",
    icons: [
      { src: "/icons/safespend-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/safespend-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/safespend-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
