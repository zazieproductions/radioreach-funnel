/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — CollectionKit (collection completion + endowed progress)
   ─────────────────────────────────────────────────────────────
   The core product + add-ons re-framed as a 5-piece Campaign Kit
   with the first slot pre-stamped. Pre-stamped progress is the
   coffee-card effect: a card that starts 1/5 full gets finished
   more often than one that starts empty (Kivetz, Urminsky &
   Zheng). The near-complete glow on piece 5 makes the set's last
   gap the loudest thing in the cart.

   Control = today's independent checkboxes. Treatment = the kit.
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { GoalBar, LabCta, LabFrame } from "./shared";
import { collectionStats, type CollectionItem } from "../core";
import { labLogAction, labLogMilestone } from "../log";

const KIT: CollectionItem[] = [
  { id: "vault", label: "Radio Reach Vault — 18,000+ contacts", collected: true },
  { id: "contracts", label: "Indie Contract Kit — 6 templates", collected: false },
  { id: "au", label: "AU Radio List — 2,847 contacts", collected: false },
  { id: "swipe", label: "Pitch Swipe File — 12 openers", collected: false },
  { id: "calendar", label: "30-Day Outreach Calendar", collected: false },
];

const PRICES: Record<string, number> = { vault: 20, contracts: 9, au: 12, swipe: 0, calendar: 0 };

export default function CollectionKit() {
  return (
    <LabFrame
      experiment="lab_collection_kit"
      title="Campaign kit — collect all 5 pieces"
      principles={["collection", "goal_gradient", "endowment"]}
      variants={["control", "kit grid, 1 pre-stamped", "kit + near-complete glow"]}
      footer="Control = plain add-on checkboxes. Treatments show an already-started kit: endowed progress + set completion turn optional add-ons into a set that wants finishing."
    >
      {(variant) => <Kit variant={variant} />}
    </LabFrame>
  );
}

function Kit({ variant }: { variant: string }) {
  const [items, setItems] = useState<CollectionItem[]>(
    KIT.map((i) => ({ ...i, collected: variant !== "control" ? i.collected : false }))
  );
  const stats = collectionStats(items);
  const total = items.reduce((sum, i) => sum + (i.collected ? PRICES[i.id] ?? 0 : 0), 0);

  function toggle(id: string) {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, collected: !i.collected } : i));
      const nowCollected = next.find((i) => i.id === id)?.collected;
      labLogAction("lab_collection_kit", variant, nowCollected ? "slot_added" : "slot_removed", { slot: id });
      if (collectionStats(next).collected === next.length && nowCollected) {
        labLogMilestone("lab_collection_kit", variant, "kit_complete", {});
      }
      return next;
    });
  }

  if (variant === "control") {
    return (
      <div className="space-y-2">
        {KIT.map((i) => (
          <label key={i.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
            <input
              type="checkbox"
              checked={items.find((x) => x.id === i.id)?.collected ?? false}
              onChange={() => toggle(i.id)}
              className="h-5 w-5 accent-yellow-400"
            />
            <span className="flex-1 text-sm font-bold text-white/85">{i.label}</span>
            <span className="text-sm font-bold text-acid">${PRICES[i.id] ?? 0}</span>
          </label>
        ))}
        <div className="flex items-center justify-between pt-1 text-sm">
          <span className="font-display uppercase text-white/70">Total</span>
          <span className="font-display text-xl text-acid">${total}</span>
        </div>
        <LabCta experiment="lab_collection_kit" variant={variant} label={`Checkout — $${total}`} sub="Independent add-ons" />
      </div>
    );
  }

  const glow = variant === "kit + near-complete glow";

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg uppercase leading-none text-white">Your campaign kit</p>
          <span className="rounded-full bg-acid/15 px-2.5 py-1 text-[11px] font-black text-acid">
            {stats.collected}/{stats.total} collected
          </span>
        </div>
        <div className="mt-3">
          <GoalBar pct={stats.pct} label={stats.label} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((i, idx) => {
          const isVault = i.id === "vault";
          const nearCompleteGlow = glow && stats.remaining === 1 && !i.collected;
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => !isVault && toggle(i.id)}
              disabled={isVault}
              aria-pressed={i.collected}
              className={`pressable relative flex min-h-[86px] flex-col justify-between rounded-xl border p-2.5 text-left transition ${
                i.collected
                  ? "border-acid/60 bg-acid/10"
                  : nearCompleteGlow
                    ? "animate-pulse border-acid bg-acid/20 shadow-[0_0_24px_rgba(255,230,0,0.35)]"
                    : "border-white/15 bg-black/30 hover:border-acid/40"
              }`}
            >
              {i.collected && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-acid text-[10px] font-black text-ink">
                  ✓
                </span>
              )}
              <span className={`text-lg ${i.collected ? "" : "opacity-40 grayscale"}`} aria-hidden>
                {["📇", "📄", "🇦🇺", "✍️", "🗓️"][idx]}
              </span>
              <span className={`mt-1 text-[11px] font-bold leading-tight ${i.collected ? "text-white" : "text-white/55"}`}>
                {i.label}
              </span>
              <span className={`mt-1 text-[10px] font-black uppercase tracking-wider ${i.collected ? "text-acid" : "text-white/35"}`}>
                {isVault ? "Included ✓" : i.collected ? "Collected" : `Add $${PRICES[i.id] ?? 0}`}
              </span>
            </button>
          );
        })}
      </div>

      {stats.nearComplete && (
        <p className="fade-in rounded-lg border border-acid/40 bg-acid/10 px-3 py-2 text-center text-[12px] font-bold text-acid">
          One piece left to complete your kit — the last piece is the one you'll actually use.
        </p>
      )}

      <LabCta
        experiment="lab_collection_kit"
        variant={variant}
        label={stats.remaining === 0 ? "Kit complete — claim it" : `Complete my kit — $${total}`}
        sub={stats.remaining === 0 ? "All 5 pieces" : `${stats.remaining} piece${stats.remaining === 1 ? "" : "s"} to finish`}
      />
    </div>
  );
}
