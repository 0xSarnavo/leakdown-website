export const REPO = "https://github.com/0xSarnavo/leakdown-cli";
// the docs are their own app (leakdown-docs), hosted separately
export const DOCS = "https://docs.leakdown.ai";

// links to other sites open in a new tab
export const EXT = { target: "_blank", rel: "noopener noreferrer" } as const;
export const ext = (href: string) => (/^https?:/.test(href) ? EXT : {});
