import { useEffect, useRef, useState } from "react";
import { FlipClock } from "./ui";

/**
 * Casino-style "one more hand" — intercepts Android back and tab-hide
 * once per session. Desktop exit-intent already lives in ExitIntent.
 */
export default function MobileBounceSave({
  onTake,
}: {
  onTake: () => void;
}) {
  const [open, setOpen] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 639px), (pointer: coarse)").matches) return;
    try {
      if (sessionStorage.getItem("rr_bounce_save") === "1") return;
    } catch {
      /* ignore */
    }

    const fire = () => {
      if (fired.current) return;
      fired.current = true;
      try {
        sessionStorage.setItem("rr_bounce_save", "1");
      } catch {
        /* ignore */
      }
      setOpen(true);
    };

    history.pushState({ rrGuard: 1 }, "");
    const onPop = () => {
      fire();
    };
    window.addEventListener("popstate", onPop);

    const onHide = () => {
      if (document.visibilityState === "hidden") fire();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fade-in fixed inset-0 z-[75] grid place-items-end bg-black/80 p-3 sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bounce-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border-2 border-acid bg-panel shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
        <p className="bg-blood py-2 text-center text-[11px] font-black uppercase tracking-[0.16em]">
          Wait — your $20 founder slot is still open
        </p>
        <div className="p-5 text-center">
          <h2 id="bounce-title" className="font-display text-[1.7rem] leading-[1.05]">
            LEAVING COSTS YOU{" "}
            <span className="text-blood line-through">$29</span>{" "}
            AND SIX MONTHS OF RESEARCH
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-white/70">
            Close this and you go back to guessing <code className="text-acid">info@</code> inboxes.
            Stay and the contacts land on your phone in 90 seconds.
          </p>
          <div className="mt-4 flex justify-center">
            <FlipClock seconds={897} size="sm" />
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onTake();
            }}
            className="cta mt-5 w-full rounded-lg bg-acid px-4 py-4 font-display text-xl uppercase tracking-wide text-ink"
          >
            Keep my $20 price →
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="tap-sm mt-3 w-full justify-center text-[13px] text-white/40 underline underline-offset-4"
          >
            I&apos;ll keep guessing emails
          </button>
        </div>
      </div>
    </div>
  );
}
