/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — the x-ray layer
   ─────────────────────────────────────────────────────────────
   Every manipulative element on the replica is wrapped in <Xray>.
   That wrapper does two jobs:

     1. it records the exposure (the thank-you receipt is built
        from what actually rendered, not from what could have),
     2. with the teardown toggled on (button in the dev bar, or
        the `x` key) it paints the pattern's name over the live
        element and opens the full annotation on click.

   The point of annotating in place rather than in a doc: these
   techniques are invisible precisely because they look like
   ordinary interface. Seeing the label sitting on the thing,
   while the thing is still working on you, is the lesson.
───────────────────────────────────────────────────────────── */

import { useEffect, type ElementType, type ReactNode } from "react";
import { PATTERNS_BY_ID, RISK_COLOR } from "./annotations";
import { useFunnel } from "./state";

export const INSPECT_EVENT = "df:inspect";

export function inspectPattern(id: string) {
  window.dispatchEvent(new CustomEvent(INSPECT_EVENT, { detail: id }));
}

export function useInspectListener(cb: (id: string) => void) {
  useEffect(() => {
    const handler = (e: Event) => cb((e as CustomEvent<string>).detail);
    window.addEventListener(INSPECT_EVENT, handler);
    return () => window.removeEventListener(INSPECT_EVENT, handler);
  }, [cb]);
}

type XrayProps = {
  /** id from annotations.ts */
  id: string;
  children: ReactNode;
  className?: string;
  /** render the tag under the element (for things near the top edge) */
  below?: boolean;
  as?: ElementType;
};

export function Xray({ id, children, className = "", below, as }: XrayProps) {
  const { teardown, expose } = useFunnel();
  const Tag = (as ?? "div") as ElementType;
  const pattern = PATTERNS_BY_ID[id];

  useEffect(() => {
    expose(id);
  }, [id, expose]);

  if (!teardown || !pattern) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag className={`relative xray ${className}`}>
      <button
        type="button"
        className="xray-tag"
        data-below={below ? "true" : "false"}
        style={{ background: RISK_COLOR[pattern.risk] }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          inspectPattern(id);
        }}
        title={`${pattern.principle} — click for the teardown`}
      >
        {pattern.label}
      </button>
      {children}
    </Tag>
  );
}
