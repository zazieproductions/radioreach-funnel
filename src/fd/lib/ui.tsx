/** Shared UI primitives + the safe content-block renderer.
 *  NOTE: blocks/span data are plain values; text goes through React (escaped).
 *  No dangerouslySetInnerHTML anywhere — user markdown renders via this same
 *  safe path, so stored content can never inject HTML. */
import type { ReactNode } from "react";
import { FdLink } from "./router";

export function Card({ title, sub, right, children, className = "", as: As = "section" }: { title?: string; sub?: string; right?: ReactNode; children: ReactNode; className?: string; as?: "section" | "div" }) {
  return (
    <As className={`fd-card p-4 sm:p-5 ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div>
            {title && <h2 className="fd-display text-lg leading-tight">{title}</h2>}
            {sub && <p className="mt-0.5 text-xs text-white/55">{sub}</p>}
          </div>
          {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
        </div>
      )}
      {children}
    </As>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "gold" | "teal" | "red" | "blue" }) {
  const color = tone === "gold" ? "text-[#f4c21d]" : tone === "teal" ? "text-[#46c8ac]" : tone === "red" ? "text-[#f0564f]" : tone === "blue" ? "text-[#6ea8fe]" : "";
  return (
    <div className="fd-card px-4 py-3.5">
      <p className="fd-label !mb-1">{label}</p>
      <p className={`fd-display text-3xl leading-none ${color}`}>{value}</p>
      {note && <p className="mt-1.5 text-[0.72rem] leading-snug text-white/55">{note}</p>}
    </div>
  );
}

export function Rate({ label, value, denominator, explain }: { label: string; value: number | null; denominator: string; explain?: string }) {
  return (
    <div className="fd-card px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="fd-label !mb-0">{label}</p>
        <p className="fd-display text-2xl">{value == null ? <span className="text-white/40">n/a</span> : <span className="tnum">{value.toFixed(1)}%</span>}</p>
      </div>
      <p className="mt-1 text-[0.72rem] text-white/55">per {denominator}</p>
      {explain && <p className="mt-0.5 text-[0.7rem] text-white/40">{explain}</p>}
      {value == null && <span className="sr-only">No data yet for {label}.</span>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-white/60" role="status" aria-live="polite">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-[#f4c21d]" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="fd-card flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icon && <p className="fd-display text-4xl text-white/25">{icon}</p>}
      <p className="fd-display text-xl">{title}</p>
      {body && <p className="max-w-md text-sm text-white/60">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Bar({ value, max = 100, color = "var(--fd-gold)" }: { value: number; max?: number; color?: string }) {
  return (
    <span className="fd-progress block w-full" aria-hidden="true">
      <span style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: color }} />
    </span>
  );
}

export function BasisChip({ basis }: { basis: string }) {
  const map: Record<string, [string, string]> = {
    fact: ["✓ fact", "basis-fact"],
    estimate: ["≈ your estimate", "basis-estimate"],
    recommendation: ["◆ recommended", "basis-recommendation"],
  };
  const [label, cls] = map[basis] || [basis, ""];
  return <span className={`fd-chip ${cls}`} style={{ borderColor: "currentColor" }}>{label}</span>;
}

/* ── Block renderer ─────────────────────────────────────────────────────── */

type Span = { t: string; v: string; href?: string };

export function Spans({ spans }: { spans: Span[] | string }) {
  if (typeof spans === "string") return <>{spans}</>;
  return (
    <>
      {(spans || []).map((s, i) => {
        if (s.t === "b") return <strong key={i}>{s.v}</strong>;
        if (s.t === "i") return <em key={i}>{s.v}</em>;
        if (s.t === "code") return <code key={i}>{s.v}</code>;
        if (s.t === "a") {
          const internal = s.href?.startsWith("/");
          return internal ? (
            <FdLink key={i} to={s.href!}>{s.v}</FdLink>
          ) : (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer nofollow">{s.v}</a>
          );
        }
        return <span key={i}>{s.v}</span>;
      })}
    </>
  );
}

export type Block =
  | { b: "h"; level: number; spans: Span[] }
  | { b: "p"; spans: Span[] }
  | { b: "quote"; spans: Span[] }
  | { b: "list"; ordered: boolean; items: { spans: Span[] }[] }
  | { b: "table"; headers: string[]; rows: Span[][][] }
  | { b: "hr" };

export function Blocks({ blocks, headingAs = "h4" }: { blocks: Block[]; headingAs?: "h3" | "h4" }) {
  const H = headingAs;
  return (
    <div className="fd-prose">
      {(blocks || []).map((b, i) => {
        switch (b.b) {
          case "h":
            return (
              <H key={i} className={b.level <= 3 ? "fd-display mt-6" : "fd-display mt-4"}>
                <Spans spans={b.spans} />
              </H>
            );
          case "p":
            return <p key={i}><Spans spans={b.spans} /></p>;
          case "quote":
            return <blockquote key={i}><Spans spans={b.spans} /></blockquote>;
          case "hr":
            return <hr key={i} />;
          case "list":
            return b.ordered ? (
              <ol key={i}>{b.items.map((it, j) => <li key={j}><Spans spans={it.spans} /></li>)}</ol>
            ) : (
              <ul key={i}>{b.items.map((it, j) => <li key={j}><Spans spans={it.spans} /></li>)}</ul>
            );
          case "table":
            return (
              <div key={i} className="scroll-x">
                <table className="fd-table">
                  <thead><tr>{b.headers.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
                  <tbody>
                    {b.rows.map((row, j) => (
                      <tr key={j}>{row.map((cell, k) => <td key={k}><Spans spans={cell as Span[]} /></td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

/** Notes markdown-lite: render user text safely — escaped by React, then a
 *  tiny line-level transform for headings/lists/bold. No raw HTML. */
export function SafeNotes({ text }: { text: string }) {
  const lines = String(text || "").split("\n");
  return (
    <div className="fd-prose text-sm">
      {lines.map((line, i) => {
        const h = line.match(/^(#{1,4})\s+(.*)/);
        if (h) return <p key={i} className="fd-display text-base mt-2"><MdInline text={h[2]} /></p>;
        const li = line.match(/^\s*[-*]\s+(.*)/);
        if (li) return <p key={i} className="pl-4">•&nbsp;<MdInline text={li[1]} /></p>;
        const check = line.match(/^\s*[-*]\s*\[([ xX])\]\s*(.*)/);
        if (check) return <p key={i} className="pl-4">{check[1] !== " " ? "☑" : "☐"}&nbsp;<MdInline text={check[2]} /></p>;
        if (!line.trim()) return <br key={i} />;
        return <p key={i}><MdInline text={line} /></p>;
      })}
    </div>
  );
}

function MdInline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let rest = text;
  let k = 0;
  while (rest.length) {
    const bold = rest.match(/^\*\*([^*]+)\*\*/);
    const code = rest.match(/^`([^`]+)`/);
    const link = rest.match(/^\[([^\]]+)\]\((https?:[^)\s]+)\)/);
    if (bold) { parts.push(<strong key={k++}>{bold[1]}</strong>); rest = rest.slice(bold[0].length); continue; }
    if (code) { parts.push(<code key={k++}>{code[1]}</code>); rest = rest.slice(code[0].length); continue; }
    if (link) { parts.push(<a key={k++} href={link[2]} target="_blank" rel="noopener noreferrer nofollow">{link[1]}</a>); rest = rest.slice(link[0].length); continue; }
    parts.push(rest[0]);
    rest = rest.slice(1);
  }
  return <>{parts}</>;
}
