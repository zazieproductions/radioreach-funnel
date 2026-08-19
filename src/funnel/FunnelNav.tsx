import { useEffect, useRef, useState } from "react";

export type Stage = "sales" | "checkout" | "oto1" | "oto2" | "downsell" | "thanks";

const STEPS: { id: Stage; label: string; note: string }[] = [
  { id: "sales",    label: "1 · Sales page",  note: "Radio Reach Vault — $20" },
  { id: "checkout", label: "2 · Checkout",    note: "Contracts $9 · AU list $12" },
  { id: "oto1",     label: "3 · Upsell 1 (Future)",    note: "Airplay Accelerator — $37" },
  { id: "oto2",     label: "4 · Upsell 2 (Future)",    note: "Upwork course — $50" },
  { id: "downsell", label: "5 · Downsell (Future)",    note: "Accelerator Lite — 3×$6" },
  { id: "thanks",   label: "6 · Thank you",   note: "Delivery page" },
];

export default function FunnelNav({ stage, go }: { stage: Stage; go: (s: Stage) => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={wrap} className="fixed bottom-3 left-3 z-[60] print:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="funnel-demo-menu"
        className="pressable flex items-center gap-2 rounded-full border border-white/20 bg-black/90 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white/60 backdrop-blur hover:border-acid hover:text-acid"
      >
        <span aria-hidden>⚙</span>
        <span className="hidden sm:inline">Demo steps</span>
        <span className="sm:hidden">Steps</span>
      </button>

      {open && (
        <div
          role="menu"
          className="fade-in absolute bottom-12 left-0 w-60 overflow-hidden rounded-xl border border-white/15 bg-black/95 shadow-2xl backdrop-blur"
        >
          <p className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-widest text-white/35">
            Preview any funnel step
          </p>
          {STEPS.map((s) => {
            const active = s.id === stage;
            return (
              <button
                key={s.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  go(s.id);
                  setOpen(false);
                }}
                className={`block w-full border-b border-white/5 px-3 py-2.5 text-left last:border-0 ${
                  active ? "bg-acid text-ink" : "pressable text-white/85 hover:bg-white/10"
                }`}
              >
                <span className="block text-[12px] font-bold">{s.label}</span>
                <span className={`block text-[10px] ${active ? "text-ink/70" : "text-white/40"}`}>
                  {s.note}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
