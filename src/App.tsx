import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import SalesPage from "./funnel/SalesPage";
import type { Addons } from "./funnel/Checkout";
import type { Stage } from "./funnel/FunnelNav";
import { trackAddToCart, trackTipFromReturnUrl, trackViewContent } from "./lib/metaPixel";
import { PRODUCTS } from "./config/storefront";
import { loadLuckyCoupon, type LuckyCoupon, clearLuckyCoupon } from "./lib/luckyCoupon";

// The wheel is an opt-in detour: load it only when someone asks for it.
const LuckyWheelModal = lazy(() =>
  import("./funnel/LuckyWheel").then((m) => ({ default: m.LuckyWheelModal }))
);

const importCheckout = () => import("./funnel/Checkout");

const Checkout = lazy(importCheckout);
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

/**
 * Checkout-shaped skeleton instead of a spinner.
 *
 * The gap between "tapped buy" and "sees a payment form" is where impulse
 * purchases die. Showing the layout immediately makes the wait feel like
 * loading rather than breaking, and it matches where the real content lands.
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ink px-4 pt-6" role="status" aria-live="polite">
      <span className="sr-only">Loading secure checkout…</span>
      <div className="mx-auto max-w-6xl">
        <div className="skeleton mx-auto h-6 w-56" />
        <div className="skeleton mx-auto mt-3 h-4 w-40" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-3">
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
          </div>
          <div className="skeleton h-[420px] w-full" />
        </div>
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

  // Lucky wheel global state — jackpot for pre-selected upsells
  const [luckyCoupon, setLuckyCoupon] = useState<LuckyCoupon | null>(() => {
    try {
      return loadLuckyCoupon();
    } catch {
      return null;
    }
  });
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const prefetched = useRef(false);

  /**
   * Warm the checkout chunk (and, through it, Stripe.js) once the hero has
   * had the network to itself. By the time a visitor taps "buy" the code is
   * already parsed, so the payment form appears in one frame instead of two
   * round trips.
   */
  useEffect(() => {
    if (routeSuccess) return;
    const warm = () => {
      if (prefetched.current) return;
      prefetched.current = true;
      void importCheckout();
    };
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback.bind(window)
        : undefined;
    const handle = idle
      ? idle(warm, { timeout: 3500 })
      : window.setTimeout(warm, 2500);
    return () => {
      if (idle && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(handle as number);
      } else {
        window.clearTimeout(handle as number);
      }
    };
  }, [routeSuccess]);

  /**
   * ViewContent for Meta. PageView alone tells the optimizer nothing about
   * intent or value; this is the event that lets a cold-traffic campaign
   * learn who is worth showing the ad to.
   */
  useEffect(() => {
    if (routeSuccess) return;
    trackViewContent({
      value: PRODUCTS.vault_core.price,
      contentIds: ["vault_core"],
      contentName: PRODUCTS.vault_core.shortName,
    });
  }, [routeSuccess]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stage, routeSuccess]);

  /**
   * Give the funnel real history entries.
   *
   * Inside the Facebook / Instagram webview the back gesture is how people
   * navigate. Without this, one back swipe from checkout throws the visitor
   * out of the site entirely instead of returning them to the offer.
   */
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      if (window.location.hash.startsWith("#/success")) {
        window.location.reload();
        return;
      }
      const state = event.state as { rrStage?: Stage } | null;
      setStage(state?.rrStage ?? "sales");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goStage = useCallback((next: Stage) => {
    setStage(next);
    try {
      if (next === "sales") {
        window.history.pushState({ rrStage: "sales" }, "", "#top");
      } else {
        window.history.pushState({ rrStage: next }, "", `#${next}`);
      }
    } catch {
      /* history unavailable — state navigation still works */
    }
  }, []);

  /** Every path into checkout goes through here, so intent is measured once. */
  const goCheckout = useCallback(
    (label = "cta") => {
      trackAddToCart({
        value: PRODUCTS.vault_core.price,
        contentIds: ["vault_core"],
        contentName: PRODUCTS.vault_core.shortName,
        ctaLabel: label,
      });
      goStage("checkout");
    },
    [goStage]
  );

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

  const handleWheelWin = (c: LuckyCoupon) => {
    setLuckyCoupon(c);
  };

  const handleWheelClaim = () => {
    setIsWheelOpen(false);
    goCheckout("lucky_wheel");
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
            onCta={(label) => goCheckout(label)}
            luckyCoupon={luckyCoupon}
            onOpenWheel={() => openWheel()}
            onClaimWheel={handleWheelClaim}
          />
        );

      case "checkout":
        return (
          <Checkout
            onComplete={(t, a) => {
              setTotal(t);
              setAddons(a);
            }}
            luckyCoupon={luckyCoupon}
            onOpenWheel={() => openWheel()}
            onBack={() => goStage("sales")}
          />
        );

      case "oto1":
        return (
          <Upsell1
            onAccept={(p) => {
              setTotal((t) => t + p);
              goStage("oto2");
            }}
            onDecline={() => goStage("oto2")}
          />
        );

      case "oto2":
        return (
          <Upsell2
            onAccept={(p) => {
              setTotal((t) => t + p);
              setHasUpwork(true);
              goStage("thanks");
            }}
            onDecline={() => goStage("downsell")}
          />
        );

      case "downsell":
        return (
          <Downsell
            onAccept={(p) => {
              setTotal((t) => t + p);
              goStage("thanks");
            }}
            onDecline={() => goStage("thanks")}
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
              clearLuckyCoupon();
              setLuckyCoupon(null);
              setTotal(41);
              setAddons({ contracts: true, au: true });
              setHasUpwork(false);
              goStage("sales");
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

      {(isWheelOpen || luckyCoupon) && (
        <Suspense fallback={null}>
          <LuckyWheelModal
            isOpen={isWheelOpen}
            onClose={() => setIsWheelOpen(false)}
            onWin={handleWheelWin}
            onClaim={handleWheelClaim}
            existingCoupon={luckyCoupon}
          />
        </Suspense>
      )}
    </>
  );
}
