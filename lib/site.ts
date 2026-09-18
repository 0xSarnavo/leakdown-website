export const REPO = "https://github.com/0xSarnavo/leakdown-cli";
/* This site's own origin: canonicals, social cards, sitemap and robots.

   It is the www host on purpose. Vercel serves the site at www and 308s the
   apex to it, so a canonical or sitemap entry on the bare apex names a URL that
   redirects — which asks Google to index one address while the server insists
   on another, and splits the ranking signal between them. Whatever actually
   serves 200 is what belongs here; flip this and the Vercel primary together,
   never one alone. */
export const SITE = "https://www.leakdown.dev";
// the docs are their own app (leakdown-docs), hosted separately
export const DOCS = "https://docs.leakdown.dev";

/* Where people write in: support, privacy and deletion requests, the footer.

   An alias on the personal mailbox, not a personal address. It used to be a
   gmail.com one, which put a private inbox in the privacy policy and meant the
   contact point could never be handed to anyone else without editing the site. */
export const CONTACT = "talk@leakdown.dev";

// links to other sites open in a new tab
export const EXT = { target: "_blank", rel: "noopener noreferrer" } as const;
export const ext = (href: string) => (/^https?:/.test(href) ? EXT : {});
