/** Tool Vault: the interactive tools + the confidential reference set,
 *  all rendered from private course assets (never the public /data path). */
import { useState } from "react";
import { fdApi, ApiFailure } from "../lib/api";
import { useFd } from "../lib/store";
import { Blocks, Card, Spinner } from "../lib/ui";
import { SubjectLineLab, PitchLab, FollowUpCadence, AuditChecklist } from "../tools";

type ToolId = "pitch" | "subject" | "followups" | "audit" | "compliance" | "decoder" | "playbooks" | "calendar" | "relationship" | "epk" | "arsenal";

const TOOLS: { id: ToolId; label: string; desc: string }[] = [
  { id: "pitch", label: "90-Word Pitch Lab", desc: "Six-line weapon builder with live word count + drafts saved to your account" },
  { id: "subject", label: "Subject-Line Engine", desc: "30 formulas across 4 trigger types; assemble & test against the rules" },
  { id: "followups", label: "3-Touch Cadence Board", desc: "receipt / graceful-close planner with the silence-after rule enforced" },
  { id: "audit", label: "90-Day Audit", desc: "The five-part retrospective with the re-baseline verdict" },
  { id: "compliance", label: "Outreach Compliance", desc: "No-Spam Oath, directory usage rules, stop-signal playbook" },
  { id: "decoder", label: "Industry Decoder", desc: "The 10 deep dives: how radio really measures, buys and adds" },
  { id: "playbooks", label: "Module Playbooks", desc: "The strategic doctrine per module" },
  { id: "calendar", label: "Release Calendar Doctrine", desc: "Cadence, add dates, book periods, release spacing" },
  { id: "relationship", label: "Relationship Maintenance", desc: "The 30/10/10 engine on a yearly clock" },
  { id: "epk", label: "EPK Standard", desc: "The one-page press kit spec the course actually requires" },
  { id: "arsenal", label: "Master Arsenal Contents", desc: "What ships in the ZIP download version" },
];

export function VaultPage() {
  const [tab, setTab] = useState<ToolId>("pitch");
  const { toast } = useFd();
  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Tool vault</p>
          <h1 className="fd-display mt-1 text-3xl">The working desk</h1>
        </div>
        <button
          type="button" className="fd-btn ml-auto" onClick={async () => {
            try {
              const r = await fdApi.post<{ url: string }>("vault");
              window.open(r.url, "_blank", "noopener");
            } catch (e) {
              toast(e instanceof ApiFailure ? e.message : "Bundle link unavailable", "warn");
            }
          }}
          title="The $97 master ZIP: private presigned download for your account"
        >⤓ Master ZIP download</button>
      </header>
      <nav aria-label="Tools" className="flex flex-wrap gap-1.5">
        {TOOLS.map((t) => (
          <button key={t.id} type="button" aria-current={tab === t.id ? "true" : undefined} className={`fd-chip !text-[0.72rem] ${tab === t.id ? "border-[#f4c21d] text-[#f4c21d]" : ""}`} onClick={() => setTab(t.id)} title={t.desc}>{t.label}</button>
        ))}
      </nav>
      {tab === "pitch" && <PitchLab />}
      {tab === "subject" && <SubjectLineLab />}
      {tab === "followups" && <FollowUpCadence />}
      {tab === "audit" && <AuditChecklist />}
      {(tab === "compliance" || tab === "decoder" || tab === "playbooks" || tab === "calendar" || tab === "relationship" || tab === "epk" || tab === "arsenal") && <AssetReader tab={tab} />}
    </div>
  );
}

function AssetReader({ tab }: { tab: "compliance" | "decoder" | "playbooks" | "calendar" | "relationship" | "epk" | "arsenal" }) {
  const [data, setData] = useState<unknown>(undefined);
  const [key, setKey] = useState("");
  if (key !== tab) {
    setKey(tab);
    void fdApi.get<{ value: unknown }>(`course/assets/${tab}`).then((r) => setData(r.value)).catch(() => setData(null));
  }
  if (data === undefined) return <Spinner label={`Loading ${tab}…`} />;
  if (data == null) return <Card title="Asset missing">This reference set isn't in the database — ask an admin to re-run the content migration.</Card>;
  return (
    <Card title={TOOLS.find((t) => t.id === tab)?.label || tab}>
      <AssetBody tab={tab} data={data as never} />
    </Card>
  );
}

function AssetBody({ tab, data }: { tab: string; data: any }) {
  if (tab === "compliance") {
    return (
      <div className="grid gap-4">
        <p className="text-xs text-white/50">{data.source}</p>
        <ul className="grid gap-2">
          {(data.principles || []).map((p: string, i: number) => (
            <li key={i} className="flex gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm"><span className="text-[#f0564f]">⚖</span>{p}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (Array.isArray(data) && data.length && data[0]?.blocks) {
    // decoder entries: {n,title,blocks}
    return (
      <div className="grid gap-5">
        {data.map((d: any, i: number) => (
          <div key={i}>
            <p className="fd-display text-lg">#{d.n ?? i + 1} — {d.title}</p>
            <Blocks blocks={d.blocks} />
          </div>
        ))}
      </div>
    );
  }
  if (tab === "playbooks" && data && !Array.isArray(data)) {
    return (
      <div className="grid gap-5">
        {Object.entries(data).map(([mid, blocks]) => (
          <div key={mid}><p className="fd-display text-lg">Module {mid.slice(1)}</p><Blocks blocks={blocks as never} /></div>
        ))}
      </div>
    );
  }
  if (Array.isArray(data)) return <Blocks blocks={data} />;
  return <pre className="scroll-x overflow-auto rounded-lg bg-black/30 p-3 text-xs">{JSON.stringify(data, null, 1)}</pre>;
}
