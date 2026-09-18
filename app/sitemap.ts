import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-15");
  return [
    { url: "https://leakdown.ai/", lastModified },
    { url: "https://leakdown.ai/sample-report", lastModified },
    { url: "https://leakdown.ai/privacy", lastModified },
    { url: "https://leakdown.ai/terms", lastModified },
  ];
}
