import { EXT } from "../lib/site";

/* Request call to action: Request a run (main) and Get early access open the
   site-wide popups (site-dialogs.tsx). */
export default function RequestCta({ repo }: { repo: string }) {
  return (
    <>
      <div className="rq-actions">
        <a className="rq-btn is-fill" href="#request" data-open="request" aria-haspopup="dialog">
          Request a run
        </a>
        <a className="rq-btn" href="#request" data-open="early" aria-haspopup="dialog">
          Get early access
        </a>
      </div>
      <p className="rq-self">
        or run it yourself: <a href={repo} {...EXT}>git clone leakdown-cli ↗</a>
      </p>
    </>
  );
}
