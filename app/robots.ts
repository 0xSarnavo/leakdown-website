import type { MetadataRoute } from "next";
import { SITE } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/orders", "/api", "/request", "/ingest"] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
