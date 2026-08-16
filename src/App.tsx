import { lazy, Suspense, useEffect, useState } from "react";
import SalesPage from "./funnel/SalesPage";
import type { Addons } from "./funnel/Checkout";
import type { Stage } from "./funnel/FunnelNav";
import { trackTipFromReturnUrl } from "./lib/metaPixel";

const Checkout = lazy(() => import("./funnel/Checkout"));
const SuccessPage = lazy(() => import("./funnel/SuccessPage"));

const Upsell1 = lazy(() =>
  import("./funnel/Upsells").then((m) => ({ default: m.Upsell1 }))
);
const Upsell2 = lazy(() =>
  import("./funnel/Upsells").then((m) => ({ default: m.Upsell2 }))
);
const Downsell = lazy(() =>
  import("./funnel/Upsells").then((m) => ({ default: m.Downsell }))
);
const ThankYou = lazy(() =>
  import("./funnel/Upsells").then((m) => ({ default: m.ThankYou }))
);

function LoadingScreen() {
  return (
    <div className="min-h-screen grid place-items-center bg-ink text-white">
      <div className="text-center">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="mt-3 text-sm text-white/60">Loading…</p>
      </div>
    </div>
  );
}

export default function App() {
  const hash = window.location.hash || "";
  const routeSuccess = hash.startsWith("#/success");

  const [stage, setStage] = useState<Stage>("sales");
  const [total, setTotal] = useState(41);
  const [addons, setAddons] = useState<Addons>({
    contracts: true,
    au: true,
  });
  const [hasUpwork, setHasUpwork] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stage, routeSuccess]);

  // Track completed tips (Stripe redirects back with ?tip=thanks&…).
  useEffect(() => {
    trackTipFromReturnUrl();
  }, []);

  if (routeSuccess) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <SuccessPage />
      </Suspense>
    );
  }

  const screen = () => {
    switch (stage) {
      case "sales":
        return <SalesPage onCta={() => setStage("checkout")} />;

      case "checkout":
        return (
          <Checkout
            onComplete={(t, a) => {
              setTotal(t);
              setAddons(a);
            }}
          />
        );

      case "oto1":
        return (
          <Upsell1
            onAccept={(p) => {
              setTotal((t) => t + p);
              setStage("oto2");
            }}
            onDecline={() => setStage("oto2")}
          />
        );

      case "oto2":
        return (
          <Upsell2
            onAccept={(p) => {
              setTotal((t) => t + p);
              setHasUpwork(true);
              setStage("thanks");
            }}
            onDecline={() => setStage("downsell")}
          />
        );

      case "downsell":
        return (
          <Downsell
            onAccept={(p) => {
              setTotal((t) => t + p);
              setStage("thanks");
            }}
            onDecline={() => setStage("thanks")}
          />
        );

      default:
        return (
          <ThankYou
            total={total}
            hasContracts={addons.contracts}
            hasAu={addons.au}
            hasUpwork={hasUpwork}
            onRestart={() => {
              sessionStorage.clear();
              setTotal(41);
              setAddons({ contracts: true, au: true });
              setHasUpwork(false);
              setStage("sales");
            }}
          />
        );
    }
  };

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <main id="main">
        <Suspense fallback={<LoadingScreen />}>{screen()}</Suspense>
      </main>
    </>
  );
}
