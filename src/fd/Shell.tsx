/** App chrome: sidebar (desktop), top bar + drawer (mobile), toasts. */
import { useEffect, useState } from "react";
import { FdLink, navigate, useLocation } from "./lib/router";
import { useFd } from "./lib/store";

const NAV = [
  { to: "/frequency-dominion/app", label: "Command Deck", icon: "▣", exact: true },
  { to: "/frequency-dominion/app/campaign", label: "Campaign Builder", icon: "⚡" },
  { to: "/frequency-dominion/app/heatmap", label: "Heat Map", icon: "◎" },
  { to: "/frequency-dominion/app/stations", label: "Station War Room", icon: "📻" },
  { to: "/frequency-dominion/app/notes", label: "Notes & Evidence", icon: "✎" },
  { to: "/frequency-dominion/app/analytics", label: "Analytics", icon: "▤" },
  { to: "/frequency-dominion/app/vault", label: "Tool Vault", icon: "⌘" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, me, logout, toasts, entitlement } = useFd();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [loc.path]);
  const admin = user?.role === "admin";

  const navItems = (
    <nav aria-label="Course sections" className="grid gap-1">
      {NAV.map((n) => {
        const active = n.exact ? loc.path === n.to : loc.path.startsWith(n.to);
        return (
          <FdLink key={n.to} to={n.to} className="fd-navlink" aria-current={active ? "page" : undefined}>
            <span aria-hidden="true" className="w-5 text-center">{n.icon}</span>
            {n.label}
          </FdLink>
        );
      })}
      {admin && (
        <FdLink to="/frequency-dominion/admin" className="fd-navlink" aria-current={loc.path.startsWith("/frequency-dominion/admin") ? "page" : undefined}>
          <span aria-hidden="true" className="w-5 text-center">⚙</span>
          Admin Console
        </FdLink>
      )}
    </nav>
  );

  return (
    <div className="fd-root">
      <a href="#fd-main" className="skip-link">Skip to content</a>
      <div className="mx-auto flex min-h-dvh w-full max-w-[1500px]">
        {/* Sidebar (desktop) */}
        <aside className="fd-no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-white/10 bg-[#0d0d10] p-4 lg:flex">
          <FdLink to="/frequency-dominion/app" className="mb-5 block">
            <p className="fd-display text-2xl leading-none">FREQUENCY<span className="text-[#f4c21d]">DOMINION</span></p>
            <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white/45">24-Lesson Campaign System</p>
          </FdLink>
          {navItems}
          <div className="mt-auto space-y-2 pt-4 text-xs text-white/50">
            {me?.course && (
              <FdLink to="/frequency-dominion/app" className="block rounded-lg border border-white/10 p-2.5 hover:border-[#f4c21d]/40">
                <p className="mb-1 flex justify-between text-[0.68rem] font-bold uppercase tracking-wider">
                  <span>Course</span><span className="tnum text-[#f4c21d]">{me.course.pct}%</span>
                </p>
                <span className="fd-progress block"><span style={{ width: `${me.course.pct}%` }} /></span>
              </FdLink>
            )}
            <p className="flex items-center gap-1.5">
              <span className={`fd-chip ${entitlement?.status === "active" ? "text-[#46c8ac]" : "text-[#f0564f]"}`}>
                {entitlement?.status === "active" ? "LIFETIME ACCESS" : "ACCESS: " + (entitlement?.status || "NONE")}
              </span>
            </p>
            <p className="truncate">{user?.email}</p>
            <button
              type="button"
              className="fd-btn fd-btn--ghost fd-btn--sm"
              onClick={async () => { await logout(); navigate("/frequency-dominion/login"); }}
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="fd-no-print sticky top-0 z-40 flex w-full items-center gap-3 border-b border-white/10 bg-[#0d0d10]/95 px-4 py-3 backdrop-blur lg:hidden">
          <button type="button" className="fd-btn fd-btn--sm fd-btn--ghost !px-2.5" aria-expanded={menuOpen} aria-controls="fd-mobile-nav" onClick={() => setMenuOpen((v) => !v)}>
            <span aria-hidden="true">☰</span><span className="sr-only">{menuOpen ? "Close" : "Open"} menu</span>
          </button>
          <p className="fd-display text-lg leading-none">FREQ<span className="text-[#f4c21d]">DOM</span></p>
          {me?.course != null && <span className="fd-chip ml-auto text-[#f4c21d]">{me.course.pct}%</span>}
          <button
            type="button"
            className="fd-btn fd-btn--sm fd-btn--ghost ml-auto"
            onClick={async () => { await logout(); navigate("/frequency-dominion/login"); }}
          >
            Sign out
          </button>
        </header>
        {menuOpen && (
          <div id="fd-mobile-nav" className="fd-no-print fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-x-0 top-0 max-h-[80dvh] overflow-y-auto bg-[#0d0d10] p-4 pt-16" onClick={(e) => e.stopPropagation()}>
              {navItems}
            </div>
          </div>
        )}

        <main id="fd-main" className="min-w-0 flex-1 lg:px-6 lg:py-6">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-2 lg:px-2 lg:py-0">{children}</div>
        </main>
      </div>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 pb-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`fd-toast ${t.kind === "err" ? "fd-toast--err" : t.kind === "warn" ? "fd-toast--warn" : ""}`}>{t.text}</div>
        ))}
      </div>
    </div>
  );
}
