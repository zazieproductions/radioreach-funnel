import { lazy, Suspense, useEffect, useState } from "react";
import SalesPage from "./funnel/SalesPage";
import { trackTipFromReturnUrl } from "./lib/metaPixel";
import { loadLuckyCoupon, type LuckyCoupon } from "./lib/luckyCoupon";
import { LuckyWheelModal } from "./funnel/LuckyWheel";
import type { ProductKey } from "./config/storefront";

const Checkout = lazy(() => import("./funnel/Checkout"));
const SuccessPage = lazy(() => import("./funnel/SuccessPage"));
const LabGallery = lazy(() => import("./lab/LabGallery"));
const CustomLeadsPage = lazy(() => import("./funnel/CustomLeadsPage"));
const CommunityForum = lazy(() => import("./funnel/CommunityForum"));

/**
 * LIVE FUNNEL MODEL
 *
 *   sales → checkout ─(embedded Stripe)→ #/success → post-purchase offers
 *
 * The old oto1/oto2/downsell/thanks stage machine was unreachable dead code:
 * real payment redirects straight to #/success. It has been removed; the
 * upsell SKUs now sell on the success page (PostPurchaseOffers) where every
 * buyer actually lands.
 */
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
  const [hash, setHash] = useState(() => window.location.hash || "");
  const routeSuccess = hash.startsWith("#/success");
  const routeLab = hash.startsWith("#/lab");
  const routeCustomLeads = hash.startsWith("#/custom-leads");
  const routeCommunity = hash.startsWith("#/community");

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const [stage, setStage] = useState<Stage>("sales");
  /** Ladder kit the buyer chose on the sales page (undefined = Vault alone). */
  const [presetItems, setPresetItems] = useState<ProductKey[]>([]);

  // Lucky wheel global state — jackpot holds the two add-on rows together
  // at checkout for the winner.
  const [luckyCoupon, setLuckyCoupon] = useState<LuckyCoupon | null>(() => {
    try {
      return loadLuckyCoupon();
    } catch {
      return null;
    }
  });
  const [isWheelOpen, setIsWheelOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stage, routeSuccess]);

  // Track completed tips (Stripe redirects back with ?tip=thanks&…).
  useEffect(() => {
    trackTipFromReturnUrl();
  }, []);

  // poll coupon validity every 5s (in case it expires while on checkout)
  useEffect(() => {
    const t = window.setInterval(() => {
      const cur = loadLuckyCoupon();
      setLuckyCoupon((prev) => {
        const prevCode = prev?.code;
        const curCode = cur?.code;
        if (prevCode !== curCode) return cur;
        if (cur && Date.now() > cur.expiresAt) return null;
        if (prev && Date.now() > prev.expiresAt) return null;
        return prev;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  if (routeSuccess) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <SuccessPage />
      </Suspense>
    );
  }

  // Conversion Lab — the experiment shelf. A review surface only:
  // prototypes never mount on the production funnel from here.
  if (routeLab) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LabGallery />
      </Suspense>
    );
  }

  if (routeCustomLeads) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CustomLeadsPage onBack={() => { window.location.hash = "#top"; }} />
      </Suspense>
    );
  }

  // Simulated community archive: a concept surface of illustrative user
  // threads. Reachable from the sales page's community teaser section and
  // the top nav. Guest threads and replies persist in localStorage.
  if (routeCommunity) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CommunityForum onBack={() => { window.location.hash = "#top"; }} />
      </Suspense>
    );
  }

  const handleWheelWin = (c: LuckyCoupon) => {
    setLuckyCoupon(c);
  };

  const handleWheelClaim = () => {
    setIsWheelOpen(false);
    setStage("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openWheel = () => {
    setIsWheelOpen(true);
  };

  const screen = () => {
    switch (stage) {
      case "sales":
        return (
          <SalesPage
            onCta={(bundleItems) => {
              setPresetItems(bundleItems ?? []);
              setStage("checkout");
            }}
            luckyCoupon={luckyCoupon}
            onOpenWheel={() => openWheel()}
            onClaimWheel={handleWheelClaim}
          />
        );

      case "checkout":
        return (
          <Checkout
            initialItems={presetItems}
            luckyCoupon={luckyCoupon}
            onOpenWheel={() => openWheel()}
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

      <LuckyWheelModal
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
        onWin={handleWheelWin}
        onClaim={handleWheelClaim}
        existingCoupon={luckyCoupon}
      />
    </>
  );
}
