import { lazy, Suspense, useEffect, useState } from "react";
import SalesPage from "./funnel/SalesPage";
import type { Addons } from "./funnel/Checkout";
import type { Stage } from "./funnel/FunnelNav";
import { trackTipFromReturnUrl } from "./lib/metaPixel";
import { loadLuckyCoupon, type LuckyCoupon, clearLuckyCoupon } from "./lib/luckyCoupon";
import { LuckyWheelModal } from "./funnel/LuckyWheel";

const Checkout = lazy(() => import("./funnel/Checkout"));
const SuccessPage = lazy(() => import("./funnel/SuccessPage"));
const LabGallery = lazy(() => import("./lab/LabGallery"));
const CustomLeadsPage = lazy(() => import("./funnel/CustomLeadsPage"));
const CommunityForum = lazy(() => import("./funnel/CommunityForum"));
const CourseSalesPage = lazy(() => import("./course/CourseSalesPage"));
const CourseClassroom = lazy(() => import("./course/CourseClassroom"));

const FrequencyDominionCheckout = lazy(() =>
  import("./funnel/FrequencyDominionCheckout")
);
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
  const [hash, setHash] = useState(() => window.location.hash || "");
  const routeSuccess = hash.startsWith("#/success");
  const routeLab = hash.startsWith("#/lab");
  const routeCustomLeads = hash.startsWith("#/custom-leads");
  const routeCommunity = hash.startsWith("#/community");
  const routeClassroom = hash.startsWith("#/course/classroom");
  const routeCourse = hash.startsWith("#/course");
  const routeFdCheckout = hash.startsWith("#/fd-checkout");

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const [stage, setStage] = useState<Stage>("sales");
  const [total, setTotal] = useState(20);
  const [addons, setAddons] = useState<Addons>({
    contracts: false,
    au: false,
    contractGuide: false,
    course: false,
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

  // Standalone checkout for the Frequency Dominion backend course
  // (reached from /frequency-dominion/).
  if (routeFdCheckout) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <FrequencyDominionCheckout />
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

  if (routeClassroom) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CourseClassroom
          onBack={() => {
            window.location.hash = "#/course";
          }}
          onBuy={() => {
            try {
              sessionStorage.setItem("radioreach:want-course", "1");
            } catch {
              /* ignore */
            }
            window.location.hash = "";
            setStage("checkout");
          }}
        />
      </Suspense>
    );
  }

  if (routeCourse) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CourseSalesPage
          onCta={() => {
            try {
              sessionStorage.setItem("radioreach:want-course", "1");
            } catch {
              /* ignore */
            }
            window.location.hash = "";
            setStage("checkout");
          }}
          onClassroom={() => {
            window.location.hash = "#/course/classroom";
          }}
          onVault={() => {
            window.location.hash = "";
            setStage("sales");
          }}
        />
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
            onCta={() => setStage("checkout")}
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
            hasContractGuide={addons.contractGuide}
            hasCourse={addons.course}
            hasUpwork={hasUpwork}
            onRestart={() => {
              sessionStorage.clear();
              clearLuckyCoupon();
              setLuckyCoupon(null);
              setTotal(20);
              setAddons({ contracts: false, au: false, contractGuide: false, course: false });
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
