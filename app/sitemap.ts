import type { MetadataRoute } from "next";
import { SITE } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // the legal pages carry their own "last updated" date; keep this in step with it
  const lastModified = new Date("2026-09-18");
  return [
    { url: `${SITE}/`, lastModified },
    { url: `${SITE}/sample-report`, lastModified },
    { url: `${SITE}/privacy`, lastModified },
    { url: `${SITE}/terms`, lastModified },
  ];
}
