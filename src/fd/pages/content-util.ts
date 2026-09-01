import { useEffect, useRef, useState } from "react";
import { fdApi } from "../lib/api";
import outlineJson from "../data/outline.json";

export const MODULE_TITLES: Record<string, string> = Object.fromEntries(
  (outlineJson as { modules: { id: string; title: string }[] }).modules.map((m) => [m.id, m.title])
);

/** Static public outline (titles/meta). Lesson bodies always come from the API. */
export function clientOutline() {
  return outlineJson as {
    modules: { id: string; n: number; title: string; promise: string; tools: { to: string; label: string }[]; lessons: { id: string; code: string; title: string; minutes: number; truth: string }[] }[];
  };
}

export function flatLessons() {
  const out: { id: string; title: string; moduleId: string; moduleTitle: string; code: string }[] = [];
  for (const m of clientOutline().modules) {
    for (const l of m.lessons) out.push({ id: l.id, code: l.code, title: l.title, moduleId: m.id, moduleTitle: m.title });
  }
  return out;
}

/** Debounced autosave for editors (notes). Flushes on unmount + beforeunload. */
export function useDebouncedSave<T>(value: T, save: (v: T) => Promise<unknown>, delay = 900) {
  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const timer = useRef<number | undefined>(undefined);
  const lastSaved = useRef<string>(JSON.stringify(value));
  const pending = useRef<T | null>(null);
  const first = useRef(true);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (JSON.stringify(value) === lastSaved.current) return;
    setStatus("dirty");
    pending.current = value;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, delay);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function flush() {
    if (pending.current == null || JSON.stringify(pending.current) === lastSaved.current) return;
    setStatus("saving");
    try {
      await saveRef.current(pending.current!);
      lastSaved.current = JSON.stringify(pending.current);
      pending.current = null;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    const beforeUnload = () => { void flush(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.clearTimeout(timer.current);
      // flush on unmount via sendBeacon-style await (best effort)
      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, flush };
}

export async function fetchCourseAsset<T>(key: string): Promise<T> {
  const r = await fdApi.get<{ value: T }>(`course/assets/${key}`);
  return r.value;
}
