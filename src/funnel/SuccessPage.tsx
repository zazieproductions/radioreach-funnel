import { useEffect, useMemo, useState } from "react";
import { createDownloadLinks, verifySession } from "../lib/api";
import { trackVerifiedPurchase } from "../lib/metaPixel";

type DownloadItem = {
  key: string;
  name: string;
  downloadUrl: string;
  expiresAt: string;
};

type DownloadError = {
  name: string;
  error: string;
};

type DeliveryState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      email?: string;
      orderId: string;
      items: DownloadItem[];
      errors: DownloadError[];
    };

function getSessionIdFromHash() {
  const hash = window.location.hash || "";
  const query = hash.includes("?") ? hash.split("?")[1] : "";
  const params = new URLSearchParams(query);
  return params.get("session_id") || "";
}

function formatExpiry(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function SuccessPage() {
  const sessionId = useMemo(() => getSessionIdFromHash(), []);
  const [state, setState] = useState<DeliveryState>({ kind: "loading" });
  const [tipLoading, setTipLoading] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!sessionId) {
          throw new Error("Missing session ID.");
        }

        const verification = await verifySession(sessionId);

        if (!verification.verified || !verification.token) {
          throw new Error(
            "We could not verify this purchase yet. Please refresh in a moment or contact support."
          );
        }

        // Fire the Meta Pixel Purchase event with value/currency and hashed
        // Advanced Matching data. Deduplicated per Stripe session, so a page
        // refresh never double-counts. Non-blocking: tracking failures must
        // never break order delivery.
        if (verification.order && typeof verification.order.amountTotal === "number" && verification.order.amountTotal > 0) {
          const o = verification.order;
          trackVerifiedPurchase({
            sessionId,
            email: o.email || undefined,
            value: o.amountTotal / 100, // cents → dollars
            currency: o.currency || "USD",
            contentIds: o.productKeys,
            contentName: o.productNames.join(" + ") || "Radio Reach Vault",
          }).catch(() => {});
        }

        const delivery = await createDownloadLinks(verification.token);

        if (cancelled) return;

        setState({
          kind: "ready",
          email: delivery.email,
          orderId: delivery.orderId,
          items: delivery.items || [],
          errors: delivery.errors || [],
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: "error",
          message:
            err instanceof Error
              ? err.message
              : "Something went wrong while unlocking your files.",
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function startTip(amount: number) {
    try {
      setTipLoading(amount);

      const response = await fetch("/api/checkout/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start tip checkout.");
      }

      window.location.assign(data.url);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to start tip checkout."
      );
      setTipLoading(null);
    }
  }

  async function sharePublicSalesPage() {
    const publicSalesUrl = "https://radioreach.us/";

    const shareData = {
      title: "RadioReach",
      text: "Check out the RadioReach radio contact vault.",
      url: publicSalesUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("Shared!");
      } else {
        await navigator.clipboard.writeText(publicSalesUrl);
        setShareStatus("Public sales page copied!");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(publicSalesUrl);
          setShareStatus("Public sales page copied!");
        } catch {
          setShareStatus("Copy failed — visit radioreach.us");
        }
      }
    }

    window.setTimeout(() => setShareStatus(""), 3000);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,255,0,0.14),transparent_30%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-full border border-acid/40 bg-acid/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-acid">
              radio reach delivery vault
            </div>
          </div>

          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-panel/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="border-b border-white/10 px-6 py-8 sm:px-8 sm:py-10">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-acid/40 bg-acid text-ink shadow-[0_0_30px_rgba(220,255,0,0.25)]">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-acid">
                    purchase confirmed
                  </p>
                  <h1 className="font-display text-3xl uppercase tracking-tight text-white sm:text-4xl">
                    Your files are unlocked
                  </h1>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                Payment verified. Your secure RadioReach delivery screen is active below.
                Download your files now, and revisit this page later if you need a fresh private link.
              </p>
            </div>

            {state.kind === "loading" && (
              <div className="px-6 py-12 sm:px-8">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-acid">
                    unlocking delivery
                  </p>
                  <p className="mt-3 text-white/70">
                    Verifying payment and preparing your private download links…
                  </p>
                </div>
              </div>
            )}

            {state.kind === "error" && (
              <div className="px-6 py-12 sm:px-8">
                <div className="rounded-2xl border border-blood/40 bg-blood/10 p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-white">
                    delivery error
                  </p>
                  <p className="mt-3 text-white/80">{state.message}</p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded-full bg-acid px-5 py-3 text-sm font-bold uppercase tracking-wider text-ink transition hover:scale-[1.02]"
                    >
                      Retry
                    </button>
                    <a
                      href="/"
                      className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white/80 transition hover:border-white/30 hover:text-white"
                    >
                      Return to home
                    </a>
                  </div>
                </div>
              </div>
            )}

            {state.kind === "ready" && (
              <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="border-b border-white/10 px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r">
                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">
                        receipt email
                      </p>
                      <p className="mt-2 break-all text-sm text-white/85">
                        {state.email || "Unavailable"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">
                        order reference
                      </p>
                      <p className="mt-2 break-all text-sm text-white/85">
                        {state.orderId}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-acid">
                        your downloads
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-white">
                        Files ready for access
                      </h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/55">
                      {state.items.length} item{state.items.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {state.items.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-acid/40"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-lg font-semibold text-white">{item.name}</p>
                            <p className="mt-2 text-sm text-white/55">
                              Secure private link ready
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                              refreshable access • current link valid until {formatExpiry(item.expiresAt)}
                            </p>
                          </div>

                          <a
                            href={item.downloadUrl}
                            className="inline-flex shrink-0 items-center justify-center rounded-full bg-acid px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-ink transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(220,255,0,0.18)]"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}

                    {state.errors.map((err) => (
                      <div
                        key={err.name}
                        className="rounded-2xl border border-blood/40 bg-blood/10 p-5"
                      >
                        <p className="text-sm font-semibold text-white">{err.name}</p>
                        <p className="mt-2 text-sm text-white/75">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="px-6 py-8 sm:px-8">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-acid">
                        what happens next
                      </p>
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-white/72">
                        <li>• Download your files now or revisit this page later for a fresh secure link.</li>
                        <li>• Keep your receipt email for your records.</li>
                        <li>• If a link ever expires, this page can generate a new one after verification.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-acid">
                        access note
                      </p>
                      <p className="mt-3 text-sm leading-6 text-white/72">
                        Your storage bucket is not public. Download links are private, time-limited,
                        and generated only after server-side payment verification.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-acid">
                        need help
                      </p>
                      <p className="mt-3 text-sm leading-6 text-white/72">
                        If anything looks wrong, contact support and include your receipt email plus
                        the order reference shown on this page.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-acid/30 bg-acid/5 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-acid">
                        enjoyed the vault?
                      </p>
                      <p className="mt-3 text-sm leading-6 text-white/72">
                        Leave an optional tip to support future RadioReach resources.
                      </p>

                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {[300, 500, 1000, 2000].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            disabled={tipLoading !== null}
                            onClick={() => startTip(amount)}
                            className="rounded-xl border border-white/15 bg-black/20 px-2 py-3 text-xs font-bold text-white transition hover:border-acid/60 hover:bg-acid/10 disabled:cursor-wait disabled:opacity-50"
                          >
                            {tipLoading === amount
                              ? "..."
                              : `$${amount / 100}`}
                          </button>
                        ))}
                      </div>

                      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-white/35">
                        completely optional
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-acid">
                        know another artist?
                      </p>
                      <p className="mt-3 text-sm leading-6 text-white/72">
                        Share RadioReach with a friend. This shares only the public sales page, never your private download page.
                      </p>

                      <button
                        type="button"
                        onClick={sharePublicSalesPage}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-ink transition hover:scale-[1.01]"
                      >
                        Share with friends
                      </button>

                      {shareStatus && (
                        <p className="mt-3 text-center text-xs font-semibold text-acid">
                          {shareStatus}
                        </p>
                      )}
                    </div>

                    <a
                      href="/"
                      className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white/80 transition hover:border-white/30 hover:text-white"
                    >
                      Return to homepage
                    </a>
                  </div>
                </aside>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
