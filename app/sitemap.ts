import type { MetadataRoute } from "next";
import { SITE } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-15");
  return [
    { url: `${SITE}/`, lastModified },
    { url: `${SITE}/sample-report`, lastModified },
    { url: `${SITE}/privacy`, lastModified },
    { url: `${SITE}/terms`, lastModified },
  ];
}
