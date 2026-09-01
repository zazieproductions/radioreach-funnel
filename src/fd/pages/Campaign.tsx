/** Campaign list + Tailoring Wizard (guided generator) + editable result. */
import { useEffect, useState } from "react";
import { fdApi, ApiFailure } from "../lib/api";
import { FdLink, navigate } from "../lib/router";
import { useFd } from "../lib/store";
import { BasisChip, Card, EmptyState, Spinner } from "../lib/ui";
import { clientOutline } from "./content-util";

type Answers = {
  artist: string; releaseTitle: string; track: string;
  genres: string; adjacentGenres: string; runtime: string; cleanStatus: "clean" | "explicit" | "unknown";
  releaseDate: string; homeCity: string; homeState: string;
  connections: { label: string; kind: string }[];
  events: { city: string; venue: string; date: string }[];
  goals: string[]; targetFormats: string[];
  proof: string[]; radioHistory: string;
  readiness: Record<string, boolean>;
  startDate: string; weeklyHours: string; waves: number; name: string;
};

const GOALS = ["first adds", "interviews / features", "chart movement (NACC/Music Row)", "tour promo", "local brand deals", "sync/placement attention"];
const FORMATS = ["College", "Community / Non-commercial", "Commercial AAA", "Commercial Alternative", "Hip-Hop/R&B", "Country/Americana", "Electronic/Dance", "Jazz/Blues", "Latin", "Christian/Inspirational", "Online / Satellite"];
const READINESS: [string, string][] = [
  ["streamLink", "Master stream link live on DSPs"],
  ["cleanEdit", "Clean radio edit exists"],
  ["rawWav", "Broadcast WAV staged (no expiring links)"],
  ["epk", "One-page EPK"],
  ["photos", "Press photos (at least 2 usable)"],
  ["artwork", "Release artwork"],
  ["split", "Splits / ownership documented"],
  ["promo90", "90-second promo recorded"],
];
const STEPS = ["Artist", "Music", "Dates & Geography", "Goals & Lanes", "Proof", "Assets", "Schedule"];

const BLANK: Answers = {
  artist: "", releaseTitle: "", track: "", genres: "", adjacentGenres: "", runtime: "", cleanStatus: "unknown",
  releaseDate: "", homeCity: "", homeState: "", connections: [], events: [], goals: [], targetFormats: [],
  proof: [], radioHistory: "", readiness: {}, startDate: "", weeklyHours: "6", waves: 2, name: "",
};

function toWire(a: Answers) {
  const mmss = a.runtime.match(/^(\d+):(\d{1,2})$/);
  return {
    artist: a.artist, releaseTitle: a.releaseTitle, track: a.track,
    genres: splitTags(a.genres), adjacentGenres: splitTags(a.adjacentGenres),
    runtimeSec: mmss ? Number(mmss[1]) * 60 + Number(mmss[2]) : null,
    cleanStatus: a.cleanStatus,
    releaseDate: a.releaseDate || null,
    homeCity: a.homeCity, homeState: a.homeState,
    connections: a.connections.filter((c) => c.label.trim()),
    events: a.events.filter((e) => e.city.trim()),
    goals: a.goals, targetFormats: a.targetFormats,
    proof: a.proof.map((p) => p.trim()).filter(Boolean),
    radioHistory: a.radioHistory,
    readiness: a.readiness,
    startDate: a.startDate || null,
    weeklyHours: a.weeklyHours ? Number(a.weeklyHours) : null,
    waves: a.waves,
    name: a.name,
  };
}
function splitTags(s: string) { return s.split(/[,;]/).map((x) => x.trim()).filter(Boolean).slice(0, 12); }

export function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[] | null>(null);
  const [mode, setMode] = useState<"list" | "wizard">("list");
  useEffect(() => {
    fdApi.get<{ campaigns: Record<string, unknown>[] }>("campaigns").then((r) => setCampaigns(r.campaigns)).catch(() => setCampaigns([]));
  }, []);
  if (mode === "wizard") return <Wizard onDone={() => setMode("list")} />;
  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Campaign Builder</p>
          <h1 className="fd-display mt-1 text-3xl">The Tailoring Wizard</h1>
        </div>
        <button type="button" className="fd-btn fd-btn--gold ml-auto" onClick={() => setMode("wizard")}>+ New campaign</button>
      </header>
      {campaigns === null ? <Spinner /> : (
        campaigns.length === 0 ? (
          <EmptyState icon="⚡" title="No campaigns yet" body="Answer ~2 minutes of questions. The wizard turns your facts into an objective, rings, scoring weights, a 20-target composition, a dated 21-day schedule and pitch starting points — with every recommendation labelled as such." />
        ) : (
          <ul className="grid gap-3">
            {campaigns.map((c) => (
              <li key={String(c.id)}>
                <FdLink to={`/frequency-dominion/app/campaign/${c.id}`} className="fd-card block p-4 hover:border-[#f4c21d]/50">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="fd-display text-lg">{String(c.name)}</p>
                      <p className="text-xs text-white/55">{String(c.artist)}{c.releaseTitle ? ` · ${c.releaseTitle}` : ""}{c.startDate ? ` · starts ${c.startDate}` : " · no start date"} </p>
                    </div>
                    {c.active ? <span className="fd-chip text-[#f4c21d]">ACTIVE</span> : null}
                    <span className="fd-chip">{String(c.status)}</span>
                  </div>
                </FdLink>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

function Wizard({ onDone }: { onDone: () => void }) {
  const { toast } = useFd();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(BLANK);
  const [preview, setPreview] = useState<{ plan: PlanShape; tasks: { day: number; title: string; scheduledDate: string; wave: number | null }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((p) => ({ ...p, [k]: v }));
  const outline = clientOutline();

  const canPreview = a.artist.trim().length > 0;

  async function doPreview() {
    setBusy(true);
    try {
      setPreview(await fdApi.post("campaigns/wizard", toWire(a)));
    } catch (e) {
      toast(e instanceof ApiFailure ? e.message : "Preview failed", "err");
    } finally { setBusy(false); }
  }
  async function create() {
    setBusy(true);
    try {
      const r = await fdApi.post<{ id: string }>("campaigns", toWire(a));
      toast("Campaign built — 21-day schedule generated.", "ok");
      navigate(`/frequency-dominion/app/campaign/${r.id}`);
    } catch (e) {
      toast(e instanceof ApiFailure ? e.message : "Create failed", "err");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-5">
      <header>
        <button type="button" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white" onClick={onDone}>← Back to campaigns</button>
        <h1 className="fd-display mt-1 text-3xl">Tailoring Wizard</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">Facts, estimates and recommendations stay labelled throughout. Nothing here invents audience numbers, royalties, station fit, or outcomes.</p>
      </header>

      <ol className="flex flex-wrap gap-1.5" aria-label="Wizard progress">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" aria-current={i === step ? "step" : undefined} className={`fd-chip !text-[0.68rem] ${i === step ? "border-[#f4c21d] text-[#f4c21d]" : i < step ? "text-[#46c8ac]" : "text-white/40"}`} onClick={() => setStep(i)}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      <Card>
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Artist / project name *" hint="How programmers should see you spelled."><input className="fd-input" value={a.artist} onChange={(e) => set("artist", e.target.value)} autoComplete="off" /></Field>
            <Field label="Release title"><input className="fd-input" value={a.releaseTitle} onChange={(e) => set("releaseTitle", e.target.value)} /></Field>
            <Field label="Single / track being pushed"><input className="fd-input" value={a.track} onChange={(e) => set("track", e.target.value)} /></Field>
            <Field label="Campaign name (optional)"><input className="fd-input" value={a.name} onChange={(e) => set("name", e.target.value)} placeholder="defaults to artist — release" /></Field>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary genre(s)" hint="Comma separated."><input className="fd-input" value={a.genres} onChange={(e) => set("genres", e.target.value)} placeholder="indie rock, alt R&B" /></Field>
            <Field label="Adjacent genres"><input className="fd-input" value={a.adjacentGenres} onChange={(e) => set("adjacentGenres", e.target.value)} /></Field>
            <Field label="Runtime (mm:ss)" hint="Radio edit length if it differs, use the edit."><input className="fd-input" value={a.runtime} onChange={(e) => set("runtime", e.target.value)} placeholder="3:12" /></Field>
            <Field label="Content status">
              <select className="fd-select" value={a.cleanStatus} onChange={(e) => set("cleanStatus", e.target.value as Answers["cleanStatus"])}>
                <option value="clean">Clean (radio-safe)</option><option value="explicit">Explicit — clean edit needed</option><option value="unknown">Unknown</option>
              </select>
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Release date"><input type="date" className="fd-input" value={a.releaseDate} onChange={(e) => set("releaseDate", e.target.value)} /></Field>
              <Field label="Home city"><input className="fd-input" value={a.homeCity} onChange={(e) => set("homeCity", e.target.value)} /></Field>
              <Field label="State"><input className="fd-input" maxLength={2} value={a.homeState} onChange={(e) => set("homeState", e.target.value.toUpperCase())} /></Field>
            </div>
            <Repeater
              label="Meaningful geographic connections"
              hint="College town, military base hometown, where your audience actually lives — these justify Ring 3 picks."
              items={a.connections}
              blank={{ label: "", kind: "connection" }}
              onChange={(items) => set("connections", items)}
              fields={[{ key: "label", placeholder: "City / town — why it matters" }]}
            />
            <Repeater
              label="Confirmed tour / event dates"
              hint="Only CONFIRMED dates. Unconfirmed runs stay out of pitch copy."
              items={a.events}
              blank={{ city: "", venue: "", date: "" }}
              onChange={(items) => set("events", items)}
              fields={[{ key: "city", placeholder: "City" }, { key: "venue", placeholder: "Venue" }, { key: "date", placeholder: "", type: "date" }]}
            />
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-5">
            <CheckGroup label="Campaign goals" options={GOALS} value={a.goals} onChange={(v) => set("goals", v)} />
            <CheckGroup label="Target station types / formats" options={FORMATS} value={a.targetFormats} onChange={(v) => set("targetFormats", v)} />
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-4">
            <Field label="Verified proof (one per line)" hint="Only receipts you can evidence: spins at X, sell-out at Y, press quote, playlist numbers. These become pitch claims — nothing invented.">
              <textarea className="fd-textarea" rows={5} value={a.proof.join("\n")} onChange={(e) => set("proof", e.target.value.split("\n"))} placeholder={"Sold out 180-cap at The Basement, 5/12 (video: …)\nAdded at KXLU — spun 6x since May 4\nFeature: City Paper “best local releases”"} />
            </Field>
            <Field label="Existing radio history"><textarea className="fd-textarea" rows={3} value={a.radioHistory} onChange={(e) => set("radioHistory", e.target.value)} placeholder="Prior submissions, relationships, past adds — honest status of each." /></Field>
          </div>
        )}
        {step === 5 && (
          <CheckList label="Audio & EPK readiness" items={READINESS.map(([k, label]) => ({ key: k, label }))} value={a.readiness} onChange={(v) => set("readiness", v)} />
        )}
        {step === 6 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Preferred campaign start" hint="Day 1 of the 21-day loop."><input type="date" className="fd-input" value={a.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="Available hours / week"><input type="number" min={1} max={40} className="fd-input" value={a.weeklyHours} onChange={(e) => set("weeklyHours", e.target.value)} /></Field>
            <Field label="Outreach waves">
              <select className="fd-select" value={a.waves} onChange={(e) => set("waves", Number(e.target.value))}>
                <option value={2}>2 waves (default split of 20)</option><option value={1}>1 wave</option><option value={3}>3 waves</option><option value={4}>4 waves</option>
              </select>
            </Field>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" className="fd-btn" disabled={step === 0} onClick={() => setStep(step - 1)}>← Back</button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="fd-btn fd-btn--gold" onClick={() => setStep(step + 1)}>Next: {STEPS[step + 1]}</button>
          ) : (
            <button type="button" className="fd-btn fd-btn--gold" disabled={!canPreview || busy} onClick={doPreview}>{preview ? "Re-run preview" : "Generate tailored campaign preview"}</button>
          )}
          {preview && <button type="button" className="fd-btn fd-btn--gold" disabled={busy} onClick={create}>Create campaign ({a.startDate ? `Day 1 = ${a.startDate}` : "set date later"})</button>}
        </div>
      </Card>

      {preview && (
        <PlanPreview plan={preview.plan} tasks={preview.tasks} outline={outline} />
      )}
    </div>
  );
}

type PlanShape = Awaited<ReturnType<typeof fdApi.post<{ plan: never; tasks: never }>>> extends infer _ ? {
  objective: { value: string; basis: string };
  hypothesis: string;
  preparation: { label: string; basis: string }[];
  rings: { ring: string; scope: string; stationsTarget: number; rationale: string }[];
  formatLanes: { lane: string; why: string }[];
  weights: Record<string, number>;
  weightsWhy: string;
  composition: { segment: string; count: number; basis: string }[];
  scheduleHints: string[];
  pitchStarters: { lane: string; subject: string; body: string }[];
  missingAssets: string[];
  lessonRecommendations: { id: string; why: string }[];
  measurement: { metric: string; denominator: string; target: string }[];
} : never;

export function PlanPreview({ plan, tasks, outline }: { plan: PlanShape; tasks?: { day: number; title: string; scheduledDate: string; wave: number | null }[]; outline?: ReturnType<typeof clientOutline> }) {
  const legend = (
    <p className="text-xs text-white/55">
      Legend: <BasisChip basis="fact" /> you stated it · <BasisChip basis="estimate" /> your rough number · <BasisChip basis="recommendation" /> generated guidance — verify before trusting.
    </p>
  );
  return (
    <>
      {legend}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recommended objective"><p className="text-sm leading-6 text-white/85">{plan.objective.value}</p><p className="mt-1"><BasisChip basis={plan.objective.basis} /></p></Card>
        <Card title="Campaign hypothesis" sub="Editable after creation — this is a working theory, not a promise">
          <p className="text-sm leading-6 text-white/85">{plan.hypothesis}</p>
        </Card>
      </div>

      <Card title="Geographic rings">
        <ul className="grid gap-2 sm:grid-cols-2">
          {plan.rings.map((r) => (
            <li key={r.ring} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-extrabold text-sm">{r.ring}</p>
              <p className="text-xs text-white/60">{r.scope}</p>
              <p className="mt-1 text-[0.7rem] text-white/45">{r.stationsTarget} stations · {r.rationale}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Format lanes">
          <ul className="grid gap-1.5 text-sm">{plan.formatLanes.map((f) => <li key={f.lane}><strong>{f.lane}.</strong> <span className="text-white/60">{f.why}</span></li>)}</ul>
        </Card>
        <Card title="Station-scoring weights" sub={plan.weightsWhy}>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {Object.entries(plan.weights).map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-white/60">{WEIGHT_LABEL[k] || k}</span><span className="tnum">×{v}</span></li>)}
          </ul>
        </Card>
      </div>

      <Card title="Suggested 20-target composition" sub="Ratios, not a census — adjust from the Heat Map">
        <ul className="grid gap-1.5 text-sm">
          {plan.composition.map((c, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2"><span className="tnum w-8 font-extrabold text-[#f4c21d]">{c.count}</span><span className="flex-1">{c.segment}</span><BasisChip basis={c.basis} /></li>
          ))}
        </ul>
      </Card>

      {tasks && tasks.length > 0 && (
        <Card title="Tailored 21-day schedule preview" sub="Sends land Tue–Thu mornings; dependencies preserved">
          <ul className="grid gap-1 text-[0.83rem]">
            {tasks.slice(0, 24).map((t, i) => (
              <li key={i} className="flex flex-wrap gap-2 border-b border-white/5 pb-1">
                <span className="fd-chip !py-0">Day {t.day}</span><span className="text-white/50">{t.scheduledDate}</span>
                {t.wave ? <span className="text-[#6ea8fe]">wave {t.wave}</span> : null}
                <span className="flex-1">{t.title}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Pitch starting points" sub="Editable drafts — verify every bracket before sending">
        <div className="grid gap-3">
          {plan.pitchStarters.map((p, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[0.68rem] font-black uppercase tracking-widest text-[#f4c21d]">{p.lane}</p>
              <p className="mt-1 text-sm font-bold">Subject: {p.subject}</p>
              <p className="mt-1 text-sm leading-6 text-white/75">{p.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Missing-asset warnings">
          {plan.missingAssets.length ? (
            <ul className="grid gap-1.5 text-sm">{plan.missingAssets.map((m, i) => <li key={i} className="flex gap-2"><span aria-hidden="true" className="text-[#f0564f]">▲</span><span>{m}</span></li>)}</ul>
          ) : <p className="text-sm text-[#46c8ac]">Assets look complete. Re-verify the moment anything changes.</p>}
        </Card>
        <Card title="Lesson recommendations">
          <ul className="grid gap-1.5 text-sm">
            {plan.lessonRecommendations.map((r) => {
              const lesson = outline?.modules.flatMap((m) => m.lessons).find((l) => l.id === r.id);
              return <li key={r.id}>▸ <FdLink className="font-bold underline decoration-[#f4c21d] underline-offset-2" to={`/frequency-dominion/app/lesson/${r.id}`}>{lesson ? `${lesson.code} ${lesson.title}` : r.id}</FdLink> <span className="text-white/55">— {r.why}</span></li>;
            })}
          </ul>
        </Card>
      </div>

      <Card title="Measurement plan" sub="Denominators stated; correlation is never called attribution">
        <div className="scroll-x">
          <table className="fd-table min-w-[520px]">
            <thead><tr><th>Metric</th><th>Denominator</th><th>Honest target</th></tr></thead>
            <tbody>{plan.measurement.map((m, i) => <tr key={i}><td className="font-bold">{m.metric}</td><td className="text-white/60">{m.denominator}</td><td>{m.target}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

const WEIGHT_LABEL: Record<string, string> = {
  format_fit: "Format & sonic fit", geo_relevance: "Geography & story", access: "Verified human contact",
  timing: "Clock/daypart fit", evidence: "Indie-add appetite", data_risk: "Data-risk deduction",
};

/* ── small form helpers ────────────────────────────────────────────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="fd-label">{label}</span>
      {children}
      {hint && <span className="fd-fieldnote block">{hint}</span>}
    </label>
  );
}

function CheckGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="fd-label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button type="button" key={o} aria-pressed={on} className={`fd-chip !text-[0.75rem] ${on ? "border-[#f4c21d] bg-[#f4c21d]/15 text-[#f4c21d]" : "text-white/60"}`} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}>
              {on ? "✓ " : ""}{o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function CheckList({ label, items, value, onChange }: { label: string; items: { key: string; label: string }[]; value: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  return (
    <fieldset>
      <legend className="fd-label">{label}</legend>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {items.map((it) => (
          <label key={it.key} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm">
            <input type="checkbox" className="fd-check" checked={!!value[it.key]} onChange={(e) => onChange({ ...value, [it.key]: e.target.checked })} />
            {it.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Repeater<T extends Record<string, string>>({ label, hint, items, fields, blank, onChange }: {
  label: string; hint?: string; items: T[]; fields: { key: string; placeholder?: string; type?: string }[]; blank: T; onChange: (v: T[]) => void;
}) {
  return (
    <div>
      <p className="fd-label">{label}</p>
      {hint && <p className="fd-fieldnote">{hint}</p>}
      <ul className="mt-2 grid gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex flex-wrap gap-2">
            {fields.map((f) => (
              <input
                key={f.key}
                type={f.type || "text"}
                className="fd-input flex-1 !min-h-[40px]"
                aria-label={`${label} — ${f.key}`}
                placeholder={f.placeholder}
                value={(it as Record<string, string>)[f.key] || ""}
                onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, [f.key]: e.target.value } : x)))}
              />
            ))}
            <button type="button" className="fd-btn fd-btn--sm fd-btn--danger" aria-label={`Remove ${label} entry ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
          </li>
        ))}
      </ul>
      <button type="button" className="fd-btn fd-btn--sm mt-2" onClick={() => onChange([...items, blank])}>+ Add</button>
    </div>
  );
}

