/** Analytics: campaign rates with explicit denominators, breakdown tables,
 *  course + campaign progress. Correlation ≠ attribution, stated everywhere. */
import { useEffect, useState } from "react";
import { fdApi } from "../lib/api";
import { useFd } from "../lib/store";
import { Bar, Card, EmptyState, Rate, Spinner, Stat } from "../lib/ui";
import { stateNameByAbbr } from "./Heatmap";

type AnalyticsShape = {
  analytics: {
    counts: Record<string, number> & { targets: { total: number; verified: number; suppressed: number } };
    deliveryRate: { value: number | null; denominator: string };
    replyRate: { value: number | null; denominator: string };
    wrongPersonRate: { value: number | null; denominator: string };
    reviewRate: { value: number | null; denominator: string };
    positiveOutcomeRate: { value: number | null; denominator: string };
    dataDefectRate: { value: number | null; denominator: string };
    verificationCoverage: { value: number | null; denominator: string };
    suppressionRate: { value: number | null; denominator: string };
    note: string;
  };
  breakdowns: {
    byFormat: { label: string; targets: number; outcomes: number }[];
    byState: { label: string; targets: number; outcomes: number }[];
    byWave: { label: number; touches: number; replies: number }[];
    byPitch: { label: string; touches: number; positive: number }[];
  };
  campaignProgress: { done: number; total: number; pct: number };
  courseProgress: { done: number; total: number; pct: number };
};

export function AnalyticsPage() {
  const { me } = useFd();
  const [campaignId, setCampaignId] = useState<string>(me?.campaign?.id || "");
  const [data, setData] = useState<AnalyticsShape | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!campaignId) { setData(null); return; }
    setData(null); setErr("");
    fdApi.get<AnalyticsShape>(`campaigns/${campaignId}/analytics`).then(setData).catch((e) => setErr(String(e?.message || e)));
  }, [campaignId]);

  if (!me?.campaign && !campaignId) {
    return (
      <div className="grid gap-4">
        <h1 className="fd-display text-3xl">Analytics</h1>
        <EmptyState icon="▤" title="No campaign to measure yet" body="Rates need sends and outcomes. Build the campaign — the numbers stay honest about their denominators from the first touch." />
      </div>
    );
  }
  if (err) return <Card title="Analytics unavailable"><p className="text-sm text-white/70">{err}</p></Card>;

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Campaign analytics</p>
          <h1 className="fd-display mt-1 text-3xl">Numbers with denominators</h1>
        </div>
        {me?.campaign && (
          <label className="ml-auto flex items-center gap-2 text-xs"><span className="fd-label !mb-0">Campaign</span>
            <select className="fd-select !w-auto" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              <option value={me.campaign.id}>{me.campaign.name}</option>
            </select>
          </label>
        )}
      </header>

      {!data ? <Spinner /> : (() => {
        const a = data.analytics;
        const c = a.counts;
        return (
          <>
            <p className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs leading-5 text-white/60">⚖ {a.note}</p>
            <section aria-label="Funnel counts" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Targets" value={c.targets.total} note={`${c.targets.verified} verified contacts · ${c.targets.suppressed} suppressed`} tone="gold" />
              <Stat label="First touches sent" value={c.sends} />
              <Stat label="Delivered" value={c.delivered} note={`${c.bounceHard} hard · ${c.bounceSoft} soft bounces`} tone={c.bounceHard > 0 ? "red" : undefined} />
              <Stat label="Verified outcomes" value={c.outcomes} note={`${c.reviews} reviews · ${c.spins} spins · ${c.interviews} interviews · ${c.features} features · ${c.libraryAdds} lib-adds · ${c.rotations} rotations`} tone="teal" />
            </section>
            <section aria-label="Rates" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Rate label="Delivery" value={a.deliveryRate.value} denominator={a.deliveryRate.denominator} />
              <Rate label="Reply (human)" value={a.replyRate.value} denominator={a.replyRate.denominator} explain="a reply below 5% = message/targeting problem — Lesson 6.3 audit tree" />
              <Rate label="Wrong-person replies" value={a.wrongPersonRate.value} denominator={a.wrongPersonRate.denominator} explain="data defect, not rejection — fix the contact, not the pitch" />
              <Rate label="Review rate" value={a.reviewRate.value} denominator={a.reviewRate.denominator} />
              <Rate label="Positive outcomes" value={a.positiveOutcomeRate.value} denominator={a.positiveOutcomeRate.denominator} />
              <Rate label="Data defects" value={a.dataDefectRate.value} denominator={a.dataDefectRate.denominator} explain="bounces + wrong-person over all sends" />
              <Rate label="Verification coverage" value={a.verificationCoverage.value} denominator={a.verificationCoverage.denominator} explain="targets whose contact was verified this campaign" />
              <Rate label="Suppression share" value={a.suppressionRate.value} denominator={a.suppressionRate.denominator} />
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="By format lane" sub="outcomes / targets">
                <BreakdownTable rows={data.breakdowns.byFormat.map((r) => ({ label: r.label || "(none)", targets: r.targets, good: r.outcomes }))} goodLabel="outcomes" />
              </Card>
              <Card title="By state" sub="where the campaign concentrated">
                <BreakdownTable rows={data.breakdowns.byState.map((r) => ({ label: `${stateNameByAbbr(String(r.label))} (${r.label})`, targets: r.targets, good: r.outcomes }))} goodLabel="outcomes" />
              </Card>
              <Card title="By wave" sub="replies / touches">
                <BreakdownTable rows={data.breakdowns.byWave.map((r) => ({ label: `Wave ${r.label ?? 1}`, targets: r.touches, good: r.replies }))} goodLabel="replies" />
              </Card>
              <Card title="By pitch version" sub="positive outcomes / sends — A/B honesty">
                <BreakdownTable rows={data.breakdowns.byPitch.map((r) => ({ label: r.label || "(unlabeled)", targets: r.touches, good: r.positive }))} goodLabel="positive" />
              </Card>
            </div>

            <Card title="Progress">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="fd-label">21-day campaign tasks — {data.campaignProgress.done}/{data.campaignProgress.total}</p>
                  <Bar value={data.campaignProgress.pct} />
                </div>
                <div>
                  <p className="fd-label">Course lessons passed — {data.courseProgress.done}/{data.courseProgress.total}</p>
                  <Bar value={data.courseProgress.pct} color="#46c8ac" />
                </div>
              </div>
            </Card>
          </>
        );
      })()}
    </div>
  );
}

function BreakdownTable({ rows, goodLabel }: { rows: { label: string; targets: number; good: number }[]; goodLabel: string }) {
  if (!rows.length) return <p className="text-sm text-white/45">No data yet.</p>;
  return (
    <table className="fd-table">
      <thead><tr><th>Segment</th><th className="text-right">Targets</th><th className="text-right">{goodLabel}</th><th>Rate</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="max-w-[180px] truncate" title={r.label}>{r.label}</td>
            <td className="tnum text-right">{r.targets}</td>
            <td className="tnum text-right text-[#46c8ac]">{r.good}</td>
            <td className="w-[45%]"><span className="flex items-center gap-2 text-xs text-white/55"><Bar value={(r.good / Math.max(1, r.targets)) * 100} /><span className="tnum">{r.targets ? Math.round((r.good / r.targets) * 100) : 0}%</span></span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
