/** Polished paywall screen for signed-in users without an entitlement. */
import { navigate } from "../lib/router";
import { useFd } from "../lib/store";
import { fdApi, devPurchase, ApiFailure } from "../lib/api";
import { useState } from "react";

const INCLUDED = [
  "24 interactive lessons · 6 modules — exercises gate completion, not page views",
  "Campaign Tailoring Wizard → a dated 21-day plan built from YOUR facts",
  "Interactive heat maps: hometown rings, tour corridors, formats, outcomes",
  "Station War Room with the 300-station curated database + priority scoring",
  "Pitch lab: 90-word builder, 30 subject-line formulas, 3-touch follow-ups",
  "Private autosaved notes, evidence vault with approved-claim discipline",
  "Analytics with explicit denominators + CSV/JSON/Markdown export",
  "Lifetime access — every future course update included, no upsell",
];

export function AccessScreen() {
  const { user, entitlement, refreshMe } = useFd();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const status = entitlement?.status || "none";
  const blocked = status === "refunded" || status === "disputed" || status === "revoked";

  const reasons: Record<string, string> = {
    refunded: "This purchase was refunded, so access ended. Re-purchase any time — your old progress stays linked to this account.",
    disputed: "Access is on hold while the payment dispute resolves. If this surprises you, email support@radioreach.us.",
    revoked: "Access was revoked by an administrator. Reply to the notice you received or contact support.",
  };

  return (
    <div className="fd-root mx-auto max-w-2xl px-4 py-10">
      <p className="fd-display text-3xl">Almost on the air</p>
      <p className="mt-2 text-sm leading-6 text-white/65">
        {blocked
          ? reasons[status]
          : `You're signed in as ${user?.email}. We haven't linked a Frequency Dominion purchase to this email yet. Buy below, or verify an existing receipt — either way you land exactly where you left off.`}
      </p>

      <div className="fd-card mt-6 p-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="fd-display text-4xl">$97</p>
          <span className="fd-chip text-[#f4c21d]">One-time · lifetime access</span>
        </div>
        <ul className="mt-4 grid gap-2 text-sm text-white/80">
          {INCLUDED.map((x) => (
            <li key={x} className="flex gap-2"><span className="mt-0.5 text-[#f4c21d]" aria-hidden="true">▸</span><span>{x}</span></li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          {!blocked && (
            <a className="fd-btn fd-btn--gold" href="/#/fd-checkout">Build My 21-Day Campaign — $97</a>
          )}
          <button type="button" className="fd-btn" onClick={() => navigate("/frequency-dominion/login?mode=claim")}>I already paid — verify receipt</button>
        </div>
        {devPurchase.available && (
          <div className="mt-4 rounded-lg border border-dashed border-white/20 p-3 text-xs">
            <button type="button" className="fd-btn fd-btn--sm" disabled={busy} onClick={async () => {
              if (!user) return;
              setBusy(true); setNote("");
              try {
                await devPurchase.simulate(user.email);
                await refreshMe();
                const r = await fdApi.get<{ entitlement: { status: string } }>("entitlement");
                setNote(`Dev grant active (${r.entitlement.status}). Reload to continue.`);
                setTimeout(() => location.reload(), 900);
              } catch (e) {
                setNote(e instanceof ApiFailure ? e.message : "Simulator unavailable.");
              } finally { setBusy(false); }
            }}>
              Simulate purchase (dev preview only)
            </button>
            {note && <p className="mt-2 text-[#46c8ac]">{note}</p>}
          </div>
        )}
        <p className="mt-4 text-[0.7rem] leading-5 text-white/45">
          30-day refund window on digital course content (see refund policy). Educational program: no results, airplay, royalties, or income are guaranteed.
        </p>
      </div>
    </div>
  );
}
