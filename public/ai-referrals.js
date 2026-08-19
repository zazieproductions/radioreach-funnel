/*
 * RadioReach — AI referral attribution.
 *
 * Purpose: identify sessions that arrive from AI assistants and search
 * experiences, and make them visible in analytics alongside landing page and
 * conversion data. Without this, ChatGPT and Perplexity traffic largely lands
 * in "Direct" and the channel looks like it does not exist.
 *
 * Design constraints, deliberately:
 *   - No new tracking of individuals. This reads document.referrer, which the
 *     browser already sends, and stores a single first-touch attribution
 *     record in first-party sessionStorage/localStorage.
 *   - No PII. No query strings from the referrer are retained beyond the
 *     campaign parameters the platforms themselves attach.
 *   - Fails silently. Analytics must never break a page, and must never
 *     interfere with checkout.
 *   - Does not fire on transactional URLs (see SKIP_PATHS).
 *
 * Requires Referrer-Policy that permits cross-origin origins to be sent;
 * see public/_headers (strict-origin-when-cross-origin).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "rr_ai_attribution";
  var SESSION_KEY = "rr_ai_session_logged";

  // Hosts we attribute. Kept explicit rather than pattern-matched so that a
  // new subdomain is a deliberate decision rather than an accident.
  var SOURCES = [
    { match: /(^|\.)chatgpt\.com$/i, source: "chatgpt", label: "ChatGPT", type: "ai_assistant" },
    { match: /(^|\.)chat\.openai\.com$/i, source: "chatgpt", label: "ChatGPT", type: "ai_assistant" },
    { match: /(^|\.)openai\.com$/i, source: "openai", label: "OpenAI", type: "ai_assistant" },
    { match: /(^|\.)perplexity\.ai$/i, source: "perplexity", label: "Perplexity", type: "ai_search" },
    { match: /(^|\.)claude\.ai$/i, source: "claude", label: "Claude", type: "ai_assistant" },
    { match: /(^|\.)anthropic\.com$/i, source: "claude", label: "Claude", type: "ai_assistant" },
    { match: /(^|\.)copilot\.microsoft\.com$/i, source: "copilot", label: "Microsoft Copilot", type: "ai_assistant" },
    { match: /(^|\.)bing\.com$/i, source: "bing", label: "Bing", type: "search_or_copilot" },
    { match: /(^|\.)gemini\.google\.com$/i, source: "gemini", label: "Gemini", type: "ai_assistant" },
    { match: /(^|\.)google\.com$/i, source: "google", label: "Google", type: "search_or_ai_overview" },
    { match: /(^|\.)google\.[a-z.]{2,6}$/i, source: "google", label: "Google", type: "search_or_ai_overview" }
  ];

  // Never attribute or beacon on transactional paths — keeps checkout and
  // post-purchase state clean and uncrawlable.
  var SKIP_PATHS = [/^\/success/i, /^\/api\//i];

  function safe(fn, fallback) {
    try {
      return fn();
    } catch (e) {
      return fallback;
    }
  }

  var path = safe(function () {
    return window.location.pathname;
  }, "/");

  for (var s = 0; s < SKIP_PATHS.length; s++) {
    if (SKIP_PATHS[s].test(path)) return;
  }

  function classify(referrer) {
    if (!referrer) return null;
    var host = safe(function () {
      return new URL(referrer).hostname;
    }, null);
    if (!host) return null;
    if (host === window.location.hostname) return null; // internal navigation
    for (var i = 0; i < SOURCES.length; i++) {
      if (SOURCES[i].match.test(host)) {
        return {
          source: SOURCES[i].source,
          label: SOURCES[i].label,
          type: SOURCES[i].type,
          referrerHost: host
        };
      }
    }
    return { source: "other", label: host, type: "referral", referrerHost: host };
  }

  // Platforms increasingly tag their outbound links; capture those when present.
  function campaignParams() {
    var out = {};
    var q = safe(function () {
      return new URLSearchParams(window.location.search);
    }, null);
    if (!q) return out;
    ["utm_source", "utm_medium", "utm_campaign", "ref", "source"].forEach(function (k) {
      var v = q.get(k);
      if (v) out[k] = String(v).slice(0, 120);
    });
    return out;
  }

  var referrer = safe(function () {
    return document.referrer;
  }, "");
  var hit = classify(referrer);
  var params = campaignParams();

  // Some assistants strip the referrer entirely. A utm_source naming a known
  // assistant is still a usable signal, so treat it as one.
  if (!hit && params.utm_source) {
    var tagged = String(params.utm_source).toLowerCase();
    var known = ["chatgpt", "openai", "perplexity", "claude", "copilot", "gemini", "bing"];
    for (var k = 0; k < known.length; k++) {
      if (tagged.indexOf(known[k]) !== -1) {
        hit = {
          source: known[k],
          label: known[k],
          type: "ai_assistant",
          referrerHost: "(tagged, no referrer)"
        };
        break;
      }
    }
  }

  if (!hit || (hit.type === "referral" && !params.utm_source)) {
    // Not an AI/search source we track. Do nothing at all.
    return;
  }

  var record = {
    source: hit.source,
    label: hit.label,
    type: hit.type,
    referrerHost: hit.referrerHost,
    landingPage: path,
    landingTitle: safe(function () {
      return document.title.slice(0, 200);
    }, ""),
    firstSeen: new Date().toISOString(),
    params: params
  };

  // First-touch wins: the page an AI cited is the page that earned the visit,
  // even if conversion happens three pages later.
  var existing = safe(function () {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
  }, null);

  if (!existing) {
    safe(function () {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    });
  }

  var attribution = existing || record;

  // Expose for the checkout/conversion layer to attach to orders. Read-only
  // by convention; nothing here mutates payment state.
  window.rrAIAttribution = attribution;

  // Emit once per session into whichever analytics layer exists.
  var alreadyLogged = safe(function () {
    return window.sessionStorage.getItem(SESSION_KEY);
  }, null);

  if (!alreadyLogged) {
    safe(function () {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    });

    var payload = {
      ai_source: attribution.source,
      ai_source_label: attribution.label,
      ai_source_type: attribution.type,
      ai_landing_page: attribution.landingPage,
      ai_referrer_host: attribution.referrerHost,
      ai_is_first_touch: !existing
    };

    // GA4 / gtag
    safe(function () {
      if (typeof window.gtag === "function") {
        window.gtag("event", "ai_referral", payload);
      }
    });

    // Google Tag Manager / generic dataLayer
    safe(function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(
        Object.assign({ event: "ai_referral" }, payload)
      );
    });

    // Meta Pixel — custom event only; does not touch standard purchase events.
    safe(function () {
      if (typeof window.fbq === "function") {
        window.fbq("trackCustom", "AIReferral", payload);
      }
    });

    // Plausible / Fathom style, if present.
    safe(function () {
      if (typeof window.plausible === "function") {
        window.plausible("AI Referral", { props: payload });
      }
    });
  }

  // Let the rest of the app react (e.g. to show source-appropriate copy).
  safe(function () {
    window.dispatchEvent(
      new CustomEvent("rr:ai-referral", { detail: attribution })
    );
  });
})();
