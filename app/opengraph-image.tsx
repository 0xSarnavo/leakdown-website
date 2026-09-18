import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { dropSvg } from "../lib/og-drop";

/* The card behind every shared leakdown.dev link: the hero and nothing else.

   It used to be a checked-in JPEG that still said leakdown.ai in blue, three
   renames after the site stopped being either — which is the argument for
   generating it. The composition is the hero with the furniture taken out: the
   headline and the drop, no nav, no sub line, no command bar. Those belong to a
   page someone is standing on, not to a link in a feed.

   The fonts are read off disk as TrueType because satori cannot parse woff2,
   which is the only format the site itself ships. They live in public/fonts so
   that every deploy target has them at a known path — nothing in the browser
   loads them. */
export const alt = "Leakdown — You are losing customers in the new web era.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFileSync(join(process.cwd(), "public", "fonts", file));

export default function Image() {
  const drop = dropSvg({ pitch: 3.1 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#101012",
          color: "#F1EEE5",
          padding: "0 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 40 }}>
          <div
            style={{
              fontFamily: "Newsreader",
              fontSize: 68,
              lineHeight: 1.04,
              letterSpacing: "-0.035em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>You are losing customers</span>
            <span>in the new web era.</span>
          </div>
          <div
            style={{
              fontFamily: "Plex",
              fontSize: 21,
              letterSpacing: "0.16em",
              color: "#A7A49D",
              marginTop: 40,
              display: "flex",
            }}
          >
            LEAKDOWN.DEV · ALPHA
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={drop} alt="" width={340} height={480} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: font("newsreader-light.ttf"), weight: 300, style: "normal" },
        { name: "Plex", data: font("plexmono-regular.ttf"), weight: 400, style: "normal" },
      ],
    },
  );
}
