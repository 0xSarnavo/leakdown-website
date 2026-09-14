// the form only shows when the server has an orders bucket behind it (GET /orders answers 401)
const form = document.getElementById("request");
const closed = document.getElementById("closed");
if (form) {
  fetch("/orders").then((r) => { if (r.status === 401) { form.hidden = false; closed.hidden = true; } }).catch(() => {});
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = form.querySelector(".reqmsg"), f = new FormData(form);
    msg.textContent = "sending…";
    try {
      const r = await fetch("/request", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: f.get("url"), email: f.get("email"), consent: f.get("consent") === "on" }) });
      const b = await r.json();
      msg.textContent = r.ok ? "Got it. You will get an email when the run is done." : b.error;
      if (r.ok) form.reset();
    } catch { msg.textContent = "Could not send. Try again."; }
  });
}
for (const el of document.querySelectorAll("[data-copy]")) {
  el.addEventListener("click", async () => {
    const src = document.getElementById(el.dataset.copy);
    try { await navigator.clipboard.writeText(src.textContent); el.textContent = "copied"; }
    catch { el.textContent = "copy failed"; }
    setTimeout(() => { el.textContent = "copy"; }, 1400);
  });
}
