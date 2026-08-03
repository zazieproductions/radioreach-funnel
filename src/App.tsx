import { useEffect, useState } from "react";
import SalesPage from "./funnel/SalesPage";
import Checkout, { type Addons } from "./funnel/Checkout";
import { Downsell, ThankYou, Upsell1, Upsell2 } from "./funnel/Upsells";
import FunnelNav, { type Stage } from "./funnel/FunnelNav";
import SuccessPage from "./funnel/SuccessPage";

export default function App() {
  const hash = window.location.hash || "";
  const routeSuccess = hash.startsWith("#/success");
  const [stage, setStage] = useState<Stage>("sales");
  const [total, setTotal] = useState(41);
  const [addons, setAddons] = useState<Addons>({ contracts: true, au: true });
  const [hasUpwork, setHasUpwork] = useState(false);
  // const [hasFonts, setHasFonts] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stage, routeSuccess]);

  if (routeSuccess) return <SuccessPage />;

  const screen = () => {
    switch (stage) {
      case "sales":
        return <SalesPage onCta={() => setStage("checkout")} />;
      case "checkout":
        return <Checkout onComplete={(t, a) => { setTotal(t); setAddons(a); }} />;
      case "oto1":
        return <Upsell1 onAccept={(p) => { setTotal((t) => t + p); setStage("oto2"); }} onDecline={() => setStage("oto2")} />;
      case "oto2":
        return <Upsell2 onAccept={(p) => { setTotal((t) => t + p); setHasUpwork(true); setStage("thanks"); }} onDecline={() => setStage("downsell")} />;
      // case "oto3":
      //   return <Upsell3 onAccept={(p) => { setTotal((t) => t + p); setHasFonts(true); setStage("thanks"); }} onDecline={() => setStage("downsell")} />;
      case "downsell":
        return <Downsell onAccept={(p) => { setTotal((t) => t + p); setStage("thanks"); }} onDecline={() => setStage("thanks")} />;
      default:
        return (
          <ThankYou
            total={total}
            hasContracts={addons.contracts}
            hasAu={addons.au}
            hasUpwork={hasUpwork}
            // hasFonts={hasFonts}
            onRestart={() => {
              sessionStorage.clear();
              setTotal(41);
              setAddons({ contracts: true, au: true });
              setHasUpwork(false);
              // setHasFonts(false);
              setStage("sales");
            }}
          />
        );
    }
  };

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <FunnelNav stage={stage} go={setStage} />
      <div id="main">{screen()}</div>
    </>
  );
}
