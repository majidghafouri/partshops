import type { MetadataRoute } from "next";

const BASE = "https://partshops.ir";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/auth/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/request/new`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];
}