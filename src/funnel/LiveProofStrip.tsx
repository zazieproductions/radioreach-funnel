import { useEffect, useState } from "react";

const EVENTS = [
  "Maya in Austin unlocked the Vault 2m ago",
  "Jordan in Nashville started checkout",
  "Dee in Columbus claimed the founder bundle",
  "Sam in Brooklyn emailed 14 stations tonight",
  "Alex in Denver locked the $20 price",
];

/** Variable-reward social proof — casino “someone just won” ticker. */
export default function LiveProofStrip() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % EVENTS.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2 text-[11px] text-white/55">
      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-400" />
      <span key={i} className="fade-in">
        {EVENTS[i]}
      </span>
    </p>
  );
}
