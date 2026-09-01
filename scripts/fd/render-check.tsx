/** Headless render check: mounts the real fd app in jsdom against the
 *  running dev server (http://localhost:5173) and asserts key screens paint.
 *  Run: node --import tsx scripts/fd/render-check.tsx   (dev server must be up) */
import { JSDOM } from "jsdom";

const BASE = process.env.FD_BASE || "http://127.0.0.1:5173";

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: `${BASE}/frequency-dominion/app`,
  pretendToBeVisual: true,
});
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
Object.defineProperty(g, "navigator", { value: dom.window.navigator, configurable: true });
try { g.location = dom.window.location; } catch { Object.defineProperty(g, "location", { value: dom.window.location, configurable: true }); }
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.getComputedStyle = dom.window.getComputedStyle;
g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 16);
g.cancelAnimationFrame = (id: number) => clearTimeout(id);
g.matchMedia = g.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
for (const key of ["history", "localStorage", "sessionStorage", "scrollTo", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "FocusEvent", "InputEvent", "HTMLInputElement", "HTMLTextAreaElement", "HTMLSelectElement", "Image"]) {
  const v = (dom.window as any)[key];
  if (v == null) continue;
  try {
    (g as any)[key] = typeof v === "function" && /^(scroll)/.test(key) ? v.bind(dom.window) : v;
  } catch {
    try { Object.defineProperty(g, key, { value: typeof v === "function" && /^(scroll)/.test(key) ? v.bind(dom.window) : v, configurable: true }); } catch { /* still stuck */ }
  }
}
// fetch → prefix relative URLs with the dev server
const realFetch = g.fetch || fetch;
g.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === "string" && input.startsWith("/")) return realFetch(`${BASE}${input}`, init);
  return realFetch(input as any, init);
};
g.IS_REACT_ACT_ENVIRONMENT = true;
// cookie jar: jsdom starts empty; we log in via the dev API and echo Set-Cookie
let jar = "";
function absorbCookies(res: Response) {
  const sc = typeof (res.headers as any).getSetCookie === "function" ? (res.headers as any).getSetCookie() as string[] : [];
  for (const c of sc) {
    const kv = c.split(";")[0];
    if (kv.startsWith("fd_session=") || kv.startsWith("fd_csrf=")) {
      const prev = jar.split("; ").filter((p) => !p.startsWith(kv.split("=")[0] + "="));
      jar = [...prev, kv].join("; ");
    }
    if (kv.startsWith("fd_session=") || kv.startsWith("fd_csrf=")) {
      try { dom.window.document.cookie = `${kv}; path=/`; } catch { /* jsdom */ }
    }
  }
}
const origFetch = g.fetch;
g.fetch = async (input: any, init: any = {}) => {
  init.headers = { origin: BASE, ...(init.headers || {}), ...(jar ? { cookie: jar } : {}) };
  const res = await origFetch(input, init);
  absorbCookies(res);
  return res;
};

async function main() {
  // create a paid dev account first
  const email = `render-${Date.now()}@example.com`;
  let r = await fetch(`${BASE}/api/fd/auth/register`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, password: "render-pass-1234", name: "Render" }) });
  absorbCookies(r);
  await fetch(`${BASE}/api/fd-dev/simulate-purchase`, { method: "POST", headers: { "content-type": "application/json", origin: BASE, cookie: jar }, body: JSON.stringify({ email }) });
  const csrf = (jar.match(/fd_csrf=([^;]+)/) || [])[1] || "";
  const created = await fetch(`${BASE}/api/fd/campaigns`, { method: "POST", headers: { "content-type": "application/json", origin: BASE, cookie: jar, "x-fd-csrf": csrf }, body: JSON.stringify({ artist: "Prairie Static", releaseTitle: "Dust Radio", genres: ["indie rock"], homeCity: "Austin", homeState: "TX", startDate: "2026-09-08", proof: ["sold 200 tickets"], goals: ["first adds"] }) });
  (globalThis as any).__cid = (await created.json()).id;

  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { default: FdApp } = await import("../../src/fd/FdApp.tsx");
  const { FdProvider } = await import("../../src/fd/lib/store.tsx");

  const errors: string[] = [];
  const origErr = console.error;
  console.error = (...a: unknown[]) => { errors.push(a.map((x) => (x instanceof Error ? x.stack || x.message : String(x))).join(" ")); origErr(...a); };

  const root = createRoot(document.getElementById("root"));
  root.render(React.createElement(FdProvider, null, React.createElement(FdApp)));
  await new Promise((res) => setTimeout(res, 1500));
  await new Promise((res) => setTimeout(res, 1500));

  const text = () => dom.window.document.body.textContent || "";
  const checks: [string, boolean][] = [
    ["dashboard heading", text().includes("Welcome back")],
    ["course progress", /Command Deck/.test(text())],
    ["module grid", text().includes("MODULE")],
    ["campaign card", text().includes("Prairie Static") || text().includes("Dust Radio")],
  ];
  for (const [name, pass] of checks) console.log(`${pass ? "✓" : "✗"} ${name}`);
  const check = (ok: boolean, name: string) => { checks.push([name, ok]); console.log(`${ok ? "✓" : "✗"} ${name}`); };
  const act: (cb: () => Promise<void> | void) => Promise<void> = (React as any).act;

  // navigate: lessons list via pushState
  dom.window.history.pushState({}, "", "/frequency-dominion/app/module/m1");
  dom.window.dispatchEvent(new dom.window.Event("popstate"));
  await new Promise((res) => setTimeout(res, 700));
  const lessonOk = /Masterclass Directives|MODULE 1|Ignored/.test(text());
  console.log(`${lessonOk ? "✓" : "✗"} module page renders lessons`);

  dom.window.history.pushState({}, "", "/frequency-dominion/app/lesson/m1l1");
  dom.window.dispatchEvent(new dom.window.Event("popstate"));
  await new Promise((res) => setTimeout(res, 900));
  const lessonText = text();
  check(/Field exercise/.test(lessonText) && /Mark complete/.test(lessonText) && /Private lesson notes/.test(lessonText) && /Industry decoder/.test(lessonText), "lesson page sections: exercise, complete, notes, decoder");
  check(/Pass standard/.test(lessonText), "pass standard rendered");
  // Marking complete without answering must surface the client-side pass-standard panel
  const attest = dom.window.document.querySelector("input.fd-check") as HTMLInputElement | null;
  await act(async () => { attest && attest.click(); });
  const completeBtn = [...dom.window.document.querySelectorAll("button")].find((b) => /Mark complete/i.test(b.textContent || "")) as HTMLButtonElement | undefined;
  await act(async () => { completeBtn && completeBtn.click(); });
  await new Promise((res) => setTimeout(res, 500));
  check(/Pass standard not met/i.test(text()), "incomplete exercise blocked (server 422 surfaced)");

  dom.window.history.pushState({}, "", "/frequency-dominion/app/heatmap");
  dom.window.dispatchEvent(new dom.window.Event("popstate"));
  await new Promise((res) => setTimeout(res, 1200));
  check(!!dom.window.document.querySelector(".fd-map svg path.state"), "heat map renders state paths");
  const pins = dom.window.document.querySelectorAll(".fd-map .station").length;
  check(pins > 50, `map pins clustered: ${pins}`);

  dom.window.history.pushState({}, "", "/frequency-dominion/app/campaign");
  dom.window.dispatchEvent(new dom.window.Event("popstate"));
  await new Promise((res) => setTimeout(res, 800));
  check(text().includes("Tailoring Wizard"), "campaign list");
  check(/Prairie Static|Dust Radio/.test(text()), "created campaign visible in list");

  const cid = (globalThis as any).__cid;
  dom.window.history.pushState({}, "", `/frequency-dominion/app/campaign/${cid || ""}`);
  dom.window.dispatchEvent(new dom.window.Event("popstate"));
  await new Promise((res) => setTimeout(res, 900));
  check(/Ignored|rebuild|plan|wave/i.test(text()), "campaign board page reachable");

  const realErrors = errors.filter((e) => !e.includes("Not implemented: Window") && !e.includes("not wrapped in act") && !e.includes("React Router") && !/useLayoutEffect does nothing on the server/.test(e));
  console.log(realErrors.length ? `✗ console errors:\n${realErrors.filter((e,i)=>realErrors.indexOf(e)===i).slice(0, 8).join("\n---\n").slice(0, 4000)}` : "✓ no console errors");
  const failed = checks.filter(([, p]) => !p);
  if (failed.length) console.log(`BODY DUMP:\n${text().slice(0, 500)}`);
  process.exit(checks.every(([, p]) => p) && realErrors.length === 0 ? 0 : 1);
}
main().catch((e) => { console.error("RENDER CHECK CRASH:", e); process.exit(1); });
