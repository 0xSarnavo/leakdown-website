import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/orders", "/api"] },
    ],
    sitemap: "https://leakdown.ai/sitemap.xml",
  };
}
