import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "../components/site-nav";
import SiteFooter from "../components/site-footer";
import RevealInit from "../components/reveal-init";
import FaviconAnim from "../components/favicon-anim";
import SiteDialogs from "../components/site-dialogs";

export const metadata: Metadata = {
  metadataBase: new URL("https://leakdown.ai"),
  title: "Leakdown",
  description:
    "Simulated prospects walk through your signup in a real browser, think out loud, and quit the way people do. One page tells you where they stalled and why.",
  alternates: { canonical: "https://leakdown.ai/" },
  openGraph: {
    title: "Leakdown",
    description: "Analytics say where people leave. This says why.",
    type: "website",
    url: "https://leakdown.ai/",
    images: ["https://leakdown.ai/assets/og-card.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leakdown",
    description: "Analytics say where people leave. This says why.",
    images: ["https://leakdown.ai/assets/og-card.jpg"],
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
      </head>
      <body>
        <a className="skip" href="#live">
          Skip to content
        </a>
        <RevealInit />
        <FaviconAnim />
        <SiteNav />
        {children}
        <SiteFooter />
        <SiteDialogs />
      </body>
    </html>
  );
}
