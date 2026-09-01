/** Enrolled-student home: current campaign, progress, today's actions. */
import { useFd } from "../lib/store";
import { FdLink } from "../lib/router";
import { Card, EmptyState, Spinner, Stat, SafeNotes } from "../lib/ui";
import { MODULE_TITLES } from "./content-util";

export function Dashboard() {
  const { me, loading } = useFd();
  if (loading || !me) return <Spinner label="Tuning the deck…" />;
  const first = me.user?.displayName || "operator";
  const snap = me.campaignSnapshot || ({} as never);
  const stats = (snap.stats || {}) as { counts?: Record<string, number> };
  const c = stats.counts || {};
  const campaign = me.campaign;
  const modules = me.course?.modules || [];

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Command Deck</p>
        <h1 className="fd-display mt-1 text-3xl leading-tight sm:text-4xl">Welcome back, {first}.</h1>
        <p className="mt-1 text-sm text-white/60">
          {campaign ? <>Active campaign: <strong className="text-white">{campaign.name}</strong>{campaign.releaseTitle ? ` · release “${campaign.releaseTitle}”` : ""} · {campaign.status.replace(/^\w/, (m) => m.toUpperCase())}{campaign.startDate ? ` · starts ${campaign.startDate}` : " · no start date yet"}</> : "No campaign yet — run the Tailoring Wizard to build your first 21-day operation."}
        </p>
      </header>

      <section aria-label="Course completion" className="fd-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-[180px] flex-1">
            <p className="fd-label">Course completion — {me.course.done}/{me.course.lessonTotal} lessons</p>
            <span className="fd-progress block"><span style={{ width: `${me.course.pct}%` }} /></span>
          </div>
          {me.course.resume && (
            <FdLink className="fd-btn fd-btn--gold" to={`/frequency-dominion/app/lesson/${me.course.resume.lessonId}`}>
              Continue: {me.course.resume.title.split("—")[0].trim()} →
            </FdLink>
          )}
          {!me.course.resume && me.course.done === 0 && (
            <FdLink className="fd-btn fd-btn--gold" to="/frequency-dominion/app/module/m1">Start Module 1 →</FdLink>
          )}
          {!me.course.resume && me.course.done > 0 && (
            <FdLink className="fd-btn" to="/frequency-dominion/app/module/m1">Pick the next incomplete lesson →</FdLink>
          )}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m: { id: string; done: number; total: number }) => {
            const pct = m.total ? Math.round((m.done / m.total) * 100) : 0;
            return (
              <FdLink key={m.id} to={`/frequency-dominion/app/module/${m.id}`} className="fd-card block p-3 hover:border-[#f4c21d]/40">
                <p className="flex items-baseline justify-between text-sm font-bold">
                  <span>MODULE {m.id.slice(1)} · {MODULE_TITLES[m.id]}</span>
                  <span className="tnum text-xs text-white/55">{m.done}/{m.total}</span>
                </p>
                <span className="fd-progress mt-2 block"><span style={{ width: `${pct}%` }} /></span>
                <p className="sr-only">Module {m.id.slice(1)} {MODULE_TITLES[m.id]}: {m.done} of {m.total} lessons complete ({pct}%).</p>
              </FdLink>
            );
          })}
        </div>
      </section>

      <section aria-label="Campaign status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today's tasks" value={snap.todayTasks ?? 0} note={campaign ? "from the 21-day board" : "create a campaign first"} tone="gold" />
        <Stat label="Overdue" value={snap.overdue ?? 0} note="pending past their date" tone={(snap.overdue ?? 0) > 0 ? "red" : undefined} />
        <Stat label="Prioritized stations" value={snap.prioritizedStations ?? 0} note="war-room rows scoring 70+" />
        <Stat label="Blocked" value={snap.blocked ?? 0} note="awaiting an unblock" tone={(snap.blocked ?? 0) > 0 ? "red" : undefined} />
      </section>

      <section aria-label="Outreach ledger" className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Sends" value={c.sends ?? 0} />
        <Stat label="Delivered" value={c.delivered ?? 0} />
        <Stat label="Replies" value={c.repliesHuman ?? 0} tone="teal" />
        <Stat label="Reviews/requests" value={c.reviews ?? 0} />
        <Stat label="Positive outcomes" value={c.outcomes ?? 0} tone="teal" note="verified air events" />
        <Stat label="Data defects" value={(c.bounceHard ?? 0) + (c.bounceSoft ?? 0) + (c.repliesWrongPerson ?? 0)} tone={(c.bounceHard ?? 0) > 0 ? "red" : undefined} note="bounces + wrong-person" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Unresolved decisions" sub="What the system still needs from you" as="section">
          {me.openDecisions?.length ? (
            <ul className="grid gap-2">
              {me.openDecisions.map((d: string, i: number) => (
                <li key={i} className="flex gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
                  <span aria-hidden="true" className="text-[#f0564f]">▲</span>{d}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-white/60">Nothing blocking. Schedule the next send window.</p>}
        </Card>
        <Card title="Recent notes & evidence" as="section">
          {(me.recentNotes?.length || me.recentEvidence?.length) ? (
            <div className="grid gap-2 text-sm">
              {(me.recentNotes || []).slice(0, 3).map((n: { id: string; body: string; updated_at: string }) => (
                <p key={n.id} className="truncate rounded-lg bg-black/20 px-3 py-2">✎ <SafeNotes text={n.body} /></p>
              ))}
              {(me.recentEvidence || []).slice(0, 3).map((ev: { id: string; title: string; claim_status: string }) => (
                <p key={ev.id} className="truncate rounded-lg bg-black/20 px-3 py-2">⛓ {ev.title || "Evidence"} <span className="fd-chip ml-1">{ev.claim_status}</span></p>
              ))}
            </div>
          ) : <p className="text-sm text-white/60">Notes autosave from any lesson; evidence lives in the Notes page.</p>}
        </Card>
      </div>

      {!campaign && (
        <EmptyState
          icon="⚡"
          title="Build your first campaign"
          body="The Tailoring Wizard turns your release facts, geography, proof and hours into a dated 21-day plan — editable, private, and yours."
          action={<FdLink className="fd-btn fd-btn--gold" to="/frequency-dominion/app/campaign">Open the Campaign Builder →</FdLink>}
        />
      )}

      <nav aria-label="Quick links" className="flex flex-wrap gap-2">
        {[
          ["/frequency-dominion/app/heatmap", "Heat Map"],
          ["/frequency-dominion/app/campaign", "Campaign Builder"],
          ["/frequency-dominion/app/stations", "Station War Room"],
          ["/frequency-dominion/app/analytics", "Analytics"],
          ["/frequency-dominion/app/vault", "Tool Vault"],
        ].map(([to, label]) => (
          <FdLink key={to} to={to} className="fd-btn fd-btn--sm">{label}</FdLink>
        ))}
      </nav>
    </div>
  );
}
