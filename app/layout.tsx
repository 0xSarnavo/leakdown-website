import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "../components/site-nav";
import LogoMark from "../components/logo-mark";
import SiteFooter from "../components/site-footer";
import RevealInit from "../components/reveal-init";
import FaviconAnim from "../components/favicon-anim";
import SiteDialogs from "../components/site-dialogs";
import Analytics from "../components/analytics";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Leakdown",
  description:
    "Simulated prospects walk through your signup in a real browser, think out loud, and quit the way people do. One page tells you where they stalled and why.",
  alternates: { canonical: `${SITE}/` },
  openGraph: {
    title: "Leakdown",
    description: "Analytics say where people leave. This says why.",
    type: "website",
    url: `${SITE}/`,
    images: [`${SITE}/assets/og-card.jpg`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leakdown",
    description: "Analytics say where people leave. This says why.",
    images: [`${SITE}/assets/og-card.jpg`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="auto">
      <head>
        <link
          rel="preload"
          href="/fonts/newsreader-light.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* the boot veil is set in mono: preload it too, or the first thing a
            visitor sees is a fallback face swapping under them */}
        <link
          rel="preload"
          href="/fonts/plexmono.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* A held breath, not a spinner: the mark draws itself a row of dots at
            a time, from the tip down, and then the whole veil lifts. The site's
            own drop is the progress — nothing else on the page loads a shape
            this recognisable this early. Pure CSS (no `lm-live`, so none of the
            mark's idle loops run here) so it clears itself even if the bundle
            never arrives, and so the page underneath is already painted and
            settled the moment it goes. */}
        <div className="boot" aria-hidden="true">
          <LogoMark className="logo-mark boot-mark" animate={false} />
          <span className="boot-word">Leakdown</span>
        </div>
        <a className="skip" href="#live">
          Skip to content
        </a>
        <RevealInit />
        <FaviconAnim />
        <SiteNav />
        {children}
        <SiteFooter />
        <SiteDialogs />
        <Analytics />
      </body>
    </html>
  );
}
