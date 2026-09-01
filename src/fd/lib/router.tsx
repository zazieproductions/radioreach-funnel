/** Tiny path router for the /frequency-dominion app (History API). */
import { useCallback, useEffect, useState } from "react";

const EVT = "fd:navigate";

export function navigate(to: string, replace = false) {
  const url = new URL(to, window.location.origin);
  if (url.pathname === window.location.pathname && url.search === window.location.search) return;
  if (replace) history.replaceState({}, "", url.pathname + url.search + url.hash);
  else history.pushState({}, "", url.pathname + url.search + url.hash);
  window.dispatchEvent(new Event(EVT));
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function useLocation() {
  const [loc, setLoc] = useState(() => ({
    path: window.location.pathname.replace(/\/+$/, "") || "/",
    query: new URLSearchParams(window.location.search),
  }));
  useEffect(() => {
    const update = () => setLoc({ path: window.location.pathname.replace(/\/+$/, "") || "/", query: new URLSearchParams(window.location.search) });
    window.addEventListener("popstate", update);
    window.addEventListener(EVT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(EVT, update);
    };
  }, []);
  return loc;
}

export function matchRoute(path: string, pattern: string): Record<string, string> | null {
  const p = path.split("/").filter(Boolean);
  const s = pattern.split("/").filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < s.length; i++) {
    if (s[i].startsWith(":")) params[s[i].slice(1)] = decodeURIComponent(p[i]);
    else if (s[i] !== p[i]) return null;
  }
  return params;
}

export function FdLink({
  to,
  className,
  children,
  onClick,
  ...rest
}: { to: string; className?: string; children: React.ReactNode; onClick?: () => void } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handle = useCallback(
    (e: React.MouseEvent) => {
      if (to.startsWith("/")) {
        e.preventDefault();
        navigate(to);
        onClick?.();
      }
    },
    [to, onClick]
  );
  return (
    <a href={to} className={className} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
