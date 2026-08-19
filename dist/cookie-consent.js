/* RadioReach analytics consent gate. No Meta code or marketing cookie is loaded
   until the visitor explicitly accepts. The stored choice is first-party and
   used only to remember this preference. */
(() => {
  "use strict";
  const KEY = "rr_analytics_consent_v1";
  const script = document.currentScript;
  const ids = (script?.dataset.pixelIds || "2551277695315034")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  let loaded = false;
  let sessionChoice = null;

  function choice() {
    try { return localStorage.getItem(KEY) || sessionChoice; } catch { return sessionChoice; }
  }

  function remember(value) {
    sessionChoice = value;
    try { localStorage.setItem(KEY, value); } catch { /* session-only choice */ }
  }

  function loadMeta() {
    if (loaded || choice() !== "granted") return;
    loaded = true;
    ((f, b, e, v, n, t, s) => {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    ids.forEach((id) => window.fbq("init", id));
    window.fbq("track", "PageView");
    window.dispatchEvent(new CustomEvent("radioreach:consent", { detail: "granted" }));
  }

  function removeBanner() {
    document.getElementById("rr-consent")?.remove();
  }

  function showChoices() {
    removeBanner();
    const box = document.createElement("section");
    box.id = "rr-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Analytics privacy choices");
    box.style.cssText = "position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px;max-width:720px;margin:auto;padding:16px 18px;border:1px solid #45454d;border-radius:10px;background:#111114;color:#eee;font:14px/1.45 system-ui,-apple-system,sans-serif;box-shadow:0 12px 40px #000b";
    box.innerHTML = `<strong style="display:block;margin-bottom:5px">Your privacy choice</strong>
      <span>We use optional Meta analytics to measure advertising. It is off unless you accept. See our <a href="/privacy-policy/" style="color:#c7ff4a">privacy policy</a>.</span>
      <div style="display:flex;flex-wrap:wrap;gap:9px;margin-top:13px">
        <button type="button" data-choice="denied" style="min-height:42px;padding:8px 14px;border:1px solid #777;border-radius:7px;background:#222;color:#fff;font-weight:700;cursor:pointer">Reject optional analytics</button>
        <button type="button" data-choice="granted" style="min-height:42px;padding:8px 14px;border:0;border-radius:7px;background:#c7ff4a;color:#09090b;font-weight:800;cursor:pointer">Accept analytics</button>
      </div>`;
    box.addEventListener("click", (event) => {
      const value = event.target?.dataset?.choice;
      if (!value) return;
      remember(value);
      removeBanner();
      if (value === "granted") loadMeta();
      else if (loaded) location.reload();
    });
    document.body.appendChild(box);
    box.querySelector("button")?.focus();
  }

  window.RadioReachPrivacyChoices = showChoices;
  if (choice() === "granted") loadMeta();
  else if (!choice()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showChoices, { once: true });
    else showChoices();
  }
})();
