export const REPO = "https://github.com/0xSarnavo/leakdown-cli";
// this site's own origin: canonicals, social cards, sitemap and robots
export const SITE = "https://leakdown.dev";
// the docs are their own app (leakdown-docs), hosted separately
export const DOCS = "https://docs.leakdown.dev";

// links to other sites open in a new tab
export const EXT = { target: "_blank", rel: "noopener noreferrer" } as const;
export const ext = (href: string) => (/^https?:/.test(href) ? EXT : {});
