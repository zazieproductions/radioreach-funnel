/* ─────────────────────────────────────────────────────────────
   PERSUASION STUDY — the shell
   ─────────────────────────────────────────────────────────────
   Mounts at #/study. Owns the stage machine, the persistent
   chrome, and the research banner that never leaves the top of
   the viewport.

   The banner is deliberately not dismissible. A simulated dark
   funnel with no standing disclosure is just a dark funnel.
───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { XrayProvider, XrayToggle, useXray } from "./Annotate";
import {
  ExitIntentModal,
  SocialProofToasts,
  SupportChat,
} from "./chrome";
import { setStage, useStudy, type StudyStage } from "./state";
import { studyLedgerAutoOpen } from "./flag";
import Hook from "./stages/Hook";
import Reveal from "./stages/Reveal";
import Qualify from "./stages/Qualify";
import CheckoutStage from "./stages/CheckoutStage";
import { Downsell, Oto } from "./stages/Upsell";
import ThankYou from "./stages/ThankYou";
import LedgerDrawer from "./LedgerDrawer";

const STAGE_ORDER: StudyStage[] = [
  "hook",
  "reveal",
  "qualify",
  "checkout",
  "oto",
  "downsell",
  "thanks",
];

function Banner({ onLedger }: { onLedger: () => void }) {
  const s = useStudy();
  const { on } = useXray();
  const idx = STAGE_ORDER.indexOf(s.stage) + 1;

  return (
    <div className="sticky top-0 z-[70] border-b border-white/15 bg-[#141418]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
        <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-ink">
          Simulation
        </span>
        <p className="min-w-0 flex-1 text-[10.5px] leading-tight text-white/55 sm:text-[11px]">
          Dark-pattern research build · nothing is sold, charged, stored or sent ·
          stage {idx}/7
        </p>
        <button
          onClick={onLedger}
          className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/60 hover:text-white"
        >
          Ledger
        </button>
        <XrayToggle />
      </div>
      {on && (
        <p className="border-t border-acid/25 bg-acid/10 px-3 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-acid">
          X-ray on — tap any tag for the research card · Alt+X to toggle
        </p>
      )}
    </div>
  );
}

function Funnel() {
  const s = useStudy();
  const [ledger, setLedger] = useState(studyLedgerAutoOpen);

  useEffect(() => {
    document.title = "Persuasion Study — simulated funnel | RadioReach";
  }, []);

  const go = (stage: StudyStage) => setStage(stage);

  const screen = () => {
    switch (s.stage) {
      case "hook":
        return <Hook onQualify={() => go("reveal")} />;
      case "reveal":
        return <Reveal onQualify={() => go("qualify")} />;
      case "qualify":
        return <Qualify onCheckout={() => go("checkout")} />;
      case "checkout":
        return <CheckoutStage onPaid={() => go("oto")} />;
      case "oto":
        return (
          <Oto onAccept={() => go("thanks")} onDecline={() => go("downsell")} />
        );
      case "downsell":
        return (
          <Downsell onAccept={() => go("thanks")} onDecline={() => go("thanks")} />
        );
      default:
        return <ThankYou onRestart={() => go("hook")} />;
    }
  };

  const chromeOn = s.stage !== "thanks";

  return (
    <>
      <Banner onLedger={() => setLedger(true)} />
      {screen()}
      {chromeOn && (
        <>
          <SocialProofToasts />
          <SupportChat />
          <ExitIntentModal onStay={() => undefined} />
        </>
      )}
      <LedgerDrawer open={ledger} onClose={() => setLedger(false)} />
    </>
  );
}

export default function StudyFunnel() {
  return (
    <XrayProvider>
      <Funnel />
    </XrayProvider>
  );
}
