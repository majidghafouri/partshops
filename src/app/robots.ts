import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/seller", "/account", "/notifications"] },
    sitemap: "https://partshops.ir/sitemap.xml",
  };
}