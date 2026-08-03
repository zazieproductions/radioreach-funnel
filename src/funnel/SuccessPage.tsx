import { useEffect, useMemo, useState } from "react";
import { STORE_COPY } from "../config/storefront";
import { createDownloadLinks, verifySession } from "../lib/api";

export default function SuccessPage() {
  const sessionId = useMemo(() => {
    const hash = window.location.hash || "";
    const q = hash.includes("?") ? hash.split("?")[1] : "";
    return new URLSearchParams(q).get("session_id") || "";
  }, []);

  const [state, setState] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment…");
  const [items, setItems] = useState<Array<{ key: string; name: string; downloadUrl: string; expiresAt: string }>>([]);
  const [downloadErrors, setDownloadErrors] = useState<Array<{ name: string; error: string }>>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let alive = true;
    let attempts = 0;
    const maxAttempts = 10;

    async function poll() {
      if (!sessionId) {
        setState("error");
        setMessage("Missing session ID.");
        return;
      }

      try {
        const verification = await verifySession(sessionId);
        if (!alive) return;

        if (!verification.verified || !verification.token) {
          attempts++;
          if (attempts >= maxAttempts) {
            setState("error");
            setMessage("Payment verification timed out. Please contact support if you were charged.");
            return;
          }
          setState("pending");
          setMessage(`Waiting for payment confirmation... (Attempt ${attempts}/${maxAttempts})`);
          setTimeout(poll, 3000);
          return;
        }

        const downloads = await createDownloadLinks(verification.token);
        if (!alive) return;
        setItems(downloads.items);
        if (downloads.errors) setDownloadErrors(downloads.errors);
        setEmail(downloads.email || "");
        setState("paid");
      } catch (e) {
        setState("error");
        setMessage(e instanceof Error ? e.message : "Unable to verify your order.");
      }
    }
    poll();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-ink">
      <div className="bg-green-600 py-2 text-center text-[11px] font-black uppercase tracking-[0.18em]">
        Stripe payment return
      </div>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-panel p-6 sm:p-8">
          <h1 className="font-display text-4xl sm:text-5xl">{STORE_COPY.successTitle}</h1>
          <p className="mt-3 text-lg text-white/70">{STORE_COPY.successSubtitle}</p>

          {state !== "paid" && (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-white/70" aria-live="polite">
              {message}
            </div>
          )}

          {state === "paid" && (
            <>
              {email && <p className="mt-4 text-sm text-white/50">Receipt email: {email}</p>}
              <div className="mt-6 space-y-3">
                {items.map((item) => (
                  <div key={item.key} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-[12px] text-white/45">Link expires: {new Date(item.expiresAt).toLocaleString()}</p>
                    </div>
                    <a href={item.downloadUrl} className="cta inline-flex items-center justify-center rounded-lg bg-acid px-5 py-3 font-display text-lg uppercase text-ink">
                      Download
                    </a>
                  </div>
                ))}
                {downloadErrors.map((err, idx) => (
                  <div key={idx} className="flex flex-col gap-3 rounded-xl border border-blood/40 bg-blood/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-white/70">{err.name}</p>
                      <p className="text-[12px] text-blood">{err.error}</p>
                    </div>
                    <button disabled className="inline-flex items-center justify-center rounded-lg bg-white/10 px-5 py-3 font-display text-lg uppercase text-white/30 cursor-not-allowed">
                      Unavailable
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-white/45">
                These links are time-limited and only generated after server-side payment verification.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
