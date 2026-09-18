import CopyButton from "../components/copy-button";
import TerminalLoop from "../components/terminal-loop";
import HeroDrop from "../components/hero-drop";
import SessionVideo from "../components/session-video";
import LeakScroll from "../components/leak-scroll";
import FeatureScroll from "../components/feature-scroll";
import DotTide from "../components/dot-tide";
import RequestCta from "../components/request-cta";
import FaqSection from "../components/faq-section";
import AlphaNote from "../components/alpha-note";
import { REPO } from "../lib/site";

/* Nonce CSP (middleware) can only reach Next's inline Flight scripts on a
   dynamically rendered page — static prerender has no request headers at
   build time, so hydration would stay blocked (see Next CSP guide). */
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main id="top">
      <section id="install" aria-label="Leakdown">
        <div className="hero-inner">
          <h1 data-reveal>
            <span className="l1">You are losing customers</span>
            <span className="l2">
              <span className="l2a">in the new</span>
              {/* a gap centred on the page, where the drop's tip rises through */}
              <span className="l2gap"> </span>
              <span className="l2b">web era.</span>
            </span>
          </h1>
          <div className="hs-stage" aria-hidden="true">
            <HeroDrop />
            <div className="hs-co hs-co-l">
              <i />
              <span>
                <b>3 / 10</b> stalled at signup step 2
              </span>
            </div>
            <div className="hs-co hs-co-r">
              <i />
              <span>
                <b>1</b> agent blocked by a captcha
              </span>
            </div>
            <div className="hs-co hs-co-b">
              <i />
              <span>&ldquo;This reads like a done page.&rdquo;</span>
            </div>
          </div>
          <p className="sub" data-reveal>
            We send a spawn of agents through your site in a real browser to check your{" "}
            <br className="sub-br" />
            flows, catch where visitors drop, and check how ready you are for agents.
          </p>
          <div className="term-cta" data-reveal>
            <div className="term-box">
              <span className="prompt" aria-hidden="true">
                $
              </span>
              <code id="hero-cmd">
                <span className="c-cmd">git clone</span> <span className="c-dim">{REPO.slice(0, REPO.lastIndexOf("/") + 1)}</span>
                <span className="c-repo">{REPO.slice(REPO.lastIndexOf("/") + 1)}</span>
              </code>
              <span className="caret-bar" aria-hidden="true" />
              <CopyButton target="hero-cmd" variant="icon" />
            </div>
            <a className="run" href="#request" data-open="request" aria-haspopup="dialog">
              Request a run
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <div className="frame">
        <section id="live" aria-label="Live run">
          <header className="sec-head bleed">
            <h2 data-reveal>Catch them before you lose them.</h2>
          </header>
          <div className="cells cols-2 live-duo">
            <div className="cell" data-reveal role="img" aria-label="Terminal running a prospect flow, typed run loop">
              <TerminalLoop />
            </div>
            <div className="cell" data-reveal>
              <SessionVideo
                className="videoframe"
                src="/assets/session.webm"
                ariaLabel="Agent surfacing a signup flow, recorded session"
              />
            </div>
          </div>
          <LeakScroll />
        </section>

        <section id="alpha" aria-label="Alpha">
          <AlphaNote />
        </section>

        <section id="features" aria-label="Features">
          <FeatureScroll />
        </section>

        <section id="faq" aria-label="Frequently asked questions">
          <FaqSection />
        </section>

        <section id="request" aria-label="Request a run">
          <div className="rq-hold">
            <div className="rq">
              <DotTide />
              <div className="rq-inner">
                <h2 data-reveal>
                  Run it yourself,
                  <br />
                  or have us run it.
                </h2>
                <div data-reveal>
                  <RequestCta repo={REPO} />
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
