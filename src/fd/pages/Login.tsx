/** Login / signup / claim-access screen for enrolled students. */
import { useState } from "react";
import { fdApi, ApiFailure, devPurchase } from "../lib/api";
import { navigate } from "../lib/router";
import { useFd, type EntitlementView, type SessionUser } from "../lib/store";

type Mode = "login" | "signup" | "claim";

export function LoginScreen({ mode: initial, next }: { mode: "login" | "signup"; next: string }) {
  const { onAuthed } = useFd();
  const boot = (() => {
    try { return new URLSearchParams(window.location.search); } catch { return null; }
  })();
  const [mode, setMode] = useState<Mode>(boot?.get("tab") === "claim" ? "claim" : initial === "signup" ? "signup" : "login");
  const [email, setEmail] = useState(boot?.get("email") || "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [sessionId, setSessionId] = useState(boot?.get("sid") || "");
  const [claimMode, setClaimMode] = useState<"create" | "reset">("create");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [simNote, setSimNote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      let r: { user: SessionUser; entitlement: EntitlementView };
      if (mode === "login") r = await fdApi.post("auth/login", { email, password });
      else if (mode === "signup") r = await fdApi.post("auth/register", { email, password, name, sessionId: sessionId || undefined });
      else r = await fdApi.post("auth/claim", { email, password, sessionId, mode: claimMode });
      onAuthed(r.user, r.entitlement || { status: "none" });
      navigate(next || "/frequency-dominion/app");
    } catch (ex) {
      setErr(ex instanceof ApiFailure ? `${ex.message}${ex.details ? ` ${(ex.details as { missing?: string[] }).missing?.join("; ") || ""}` : ""}` : "Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "login", label: "Sign in" },
    { id: "signup", label: "Create account" },
    { id: "claim", label: "I already paid" },
  ];

  return (
    <div className="fd-root grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <a href="/frequency-dominion/" className="inline-block">
            <p className="fd-display text-4xl leading-none">FREQUENCY<span className="text-[#f4c21d]">DOMINION</span></p>
            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.25em] text-white/45">The 24-lesson independent radio campaign system</p>
          </a>
        </header>

        <div className="fd-card p-5 sm:p-6">
          <div role="tablist" aria-label="Account options" className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
            {tabs.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={mode === t.id} className={`rounded-lg px-2 py-2 text-xs font-extrabold uppercase tracking-wider ${mode === t.id ? "bg-[#f4c21d] text-black" : "text-white/60 hover:text-white"}`} onClick={() => setMode(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="grid gap-4" noValidate>
            <p>
              <label className="fd-label" htmlFor="fd-email">Email</label>
              <input id="fd-email" className="fd-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} />
            </p>
            {mode !== "claim" && (
              <p>
                <label className="fd-label" htmlFor="fd-pw">{mode === "signup" ? "Create password (10+ characters)" : "Password"}</label>
                <input id="fd-pw" className="fd-input" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} />
              </p>
            )}
            {mode === "claim" && (
              <>
                <p>
                  <label className="fd-label" htmlFor="fd-claim-ref">Stripe checkout reference <span className="normal-case tracking-normal text-white/40">(from your receipt / download page)</span></label>
                  <input id="fd-claim-ref" className="fd-input font-mono text-sm" required placeholder="cs_test_…" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
                </p>
                <p>
                  <label className="fd-label" htmlFor="fd-pw2">{claimMode === "reset" ? "New password (also resets login)" : "Choose a password for your new account"}</label>
                  <input id="fd-pw2" className="fd-input" type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} />
                </p>
                <p className="text-xs text-white/55">
                  No account yet? We verify the payment server-side, then open your course room.{" "}
                  <button type="button" className="text-[#f4c21d] underline underline-offset-2" onClick={() => setClaimMode((m) => (m === "create" ? "reset" : "create"))}>
                    {claimMode === "create" ? "Lost your password instead?" : "Create an account"}
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <>
                <p>
                  <label className="fd-label" htmlFor="fd-name">Name <span className="normal-case tracking-normal text-white/40">(for the welcome line — optional)</span></label>
                  <input id="fd-name" className="fd-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </p>
                <p>
                  <label className="fd-label" htmlFor="fd-sess">Already purchased? Paste your checkout reference (optional)</label>
                  <input id="fd-sess" className="fd-input font-mono text-sm" placeholder="cs_test_…" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
                </p>
                <p className="text-xs leading-relaxed text-white/50">
                  Purchases are matched by the email on the receipt. Use the same address you checked out with, or paste the reference above. Progress, notes and campaigns sync to your account on any device.
                </p>
              </>
            )}
            {err && <p role="alert" className="fd-error">{err}</p>}
            <button type="submit" className="fd-btn fd-btn--gold w-full" disabled={busy}>
              {busy ? "Working…" : mode === "login" ? "Enter the console" : mode === "signup" ? "Create account & enter" : "Verify purchase & enter"}
            </button>
          </form>

          {mode === "login" && (
            <p className="mt-4 border-t border-white/10 pt-3 text-xs text-white/50">
              Forgot access? Use <button type="button" className="underline" onClick={() => setMode("claim")}>“I already paid”</button> to reset with your purchase reference, or contact support.
            </p>
          )}

          {devPurchase.available && (
            <div className="mt-5 rounded-lg border border-dashed border-white/20 p-3 text-xs">
              <p className="font-bold uppercase tracking-widest text-white/40">Dev preview</p>
              <p className="mt-1 text-white/55">No Stripe keys in this environment? Simulate a paid checkout for an email, then create the account:</p>
              <div className="mt-2 flex gap-2">
                <button type="button" className="fd-btn fd-btn--sm" disabled={busy} onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await devPurchase.simulate(email || "student@example.com");
                    setSimNote(`Paid session ${r.sessionId} simulated for ${r.email}. Now “Create account”${email ? " with this email" : ""}.`);
                  } catch { setSimNote("Simulator unavailable."); } finally { setBusy(false); }
                }}>
                  Simulate $97 purchase
                </button>
              </div>
              {simNote && <p className="mt-2 text-[#46c8ac]">{simNote}</p>}
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-white/40">Back to the <a className="underline" href="/frequency-dominion/">sales page</a></p>
      </div>
    </div>
  );
}
