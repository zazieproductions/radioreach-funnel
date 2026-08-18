import { Suspense, lazy, useEffect, useState } from "react";
import SalesPage from "./funnel/SalesPage";
import { trackTipFromReturnUrl } from "./lib/metaPixel";
import { clearLuckyCoupon } from "./lib/luckyCoupon";

const Checkout = lazy(() => import("./funnel/Checkout"));
const SuccessPage = lazy(() => import("./funnel/SuccessPage"));

type Stage = "sales" | "checkout";

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stage, routeSuccess]);

  // Track completed tips (Stripe redirects back with ?tip=thanks&…).
  useEffect(() => {
    trackTipFromReturnUrl();
    // Clean out any stale jackpot coupons left by earlier funnel
    // versions — the current flow never reads them.
    clearLuckyCoupon();
  }, []);

  // Warm the checkout chunk at the first sign of intent (or after a
  // short idle delay) so the sales → checkout switch is instant even
  // on slow mobile networks.
  useEffect(() => {
    const warm = () => {
      import("./funnel/Checkout").catch(() => {});
    };
    const onIntent = () => warm();
    window.addEventListener("pointerdown", onIntent, { once: true, passive: true });
    const t = window.setTimeout(warm, 2500);
    return () => {
      window.removeEventListener("pointerdown", onIntent);
      window.clearTimeout(t);
    };
  }, []);

  if (routeSuccess) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <SuccessPage />
      </Suspense>
    );
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <main id="main">
        <Suspense fallback={<LoadingScreen />}>
          {stage === "sales" ? (
            <SalesPage onCta={() => setStage("checkout")} />
          ) : (
            <Checkout />
          )}
        </Suspense>
      </main>
    </>
  );
}
