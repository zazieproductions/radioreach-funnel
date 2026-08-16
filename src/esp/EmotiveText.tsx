/* ─────────────────────────────────────────────────────────────
   EMOTIVE TEXT — the only visual surface of the ESP
   ─────────────────────────────────────────────────────────────
   Renders every copy variant for a slot in one grid cell; only
   the active mode is visible. Because the cell is sized by the
   largest variant, swapping copy can NEVER cause layout shift —
   the page just crossfades between tones (300ms opacity fade,
   killed automatically by the existing prefers-reduced-motion
   rule in index.css).

   Accessibility: inactive variants are hidden from the tree
   (aria-hidden + visibility), and the slot is a polite live
   region so a mode change is announced, not ignored.
───────────────────────────────────────────────────────────── */

import { useSyncExternalStore, type ReactNode, type ElementType } from "react";
import type { EmotionalMode } from "./types";
import { MODES } from "./types";
import { espStore } from "./store";
import { SLOT_COPY, copyFor, type SlotKey } from "./copy";
import { cn } from "@/utils/cn";

/** Subscribe a component to the current emotional mode. */
export function useEspMode(): EmotionalMode {
  return useSyncExternalStore(espStore.subscribe, espStore.getMode, espStore.getMode);
}

interface EmotiveTextProps {
  slot: SlotKey;
  as?: ElementType;
  className?: string;
  id?: string;
}

export function EmotiveText({
  slot,
  as: Tag = "span",
  className,
  id,
}: EmotiveTextProps) {
  const mode = useEspMode();
  const variants = SLOT_COPY[slot];
  const present = MODES.filter((m) => variants[m] != null);
  const active: ReactNode = copyFor(slot, mode);

  return (
    <Tag
      id={id}
      className={cn("esp-slot", className)}
      data-esp-slot={slot}
      data-esp-mode={mode}
      aria-live="polite"
    >
      {present.map((m) => (
        <span
          key={m}
          className={cn("esp-variant", m === mode && "esp-variant--active")}
          aria-hidden={m !== mode}
        >
          {m === mode ? active : variants[m]}
        </span>
      ))}
    </Tag>
  );
}
