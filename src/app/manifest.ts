import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "پارت شاپ",
    short_name: "پارت شاپ",
    description: "بازار درخواست قطعات یدکی خودرو",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#f97316",
    orientation: "portrait",
    lang: "fa",
    dir: "rtl",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}