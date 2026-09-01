/* ─────────────────────────────────────────────────────────────
   PERSUASION STUDY — shared funnel state + instrumentation
   ─────────────────────────────────────────────────────────────
   One store for the whole simulated funnel. It holds:

     • the persistent (resetting) countdown deadline
     • the decaying seat counter and the fake viewer count
     • quiz answers, score, and the self-prediction the funnel
       will quote back at the visitor
     • the cart, and every "trip" — each time a dark pattern was
       actually exercised by this visitor

   The trip log is the research payload: the thank-you page
   reconstructs the visitor's own session as evidence, so the
   debrief is personal rather than abstract.

   Nothing here touches the network. No payment, no email, no
   analytics. sessionStorage only, wiped by closing the tab.
───────────────────────────────────────────────────────────── */

import { useSyncExternalStore } from "react";
import { studyFastMode } from "./flag";

export type StudyStage =
  | "hook"
  | "reveal"
  | "qualify"
  | "checkout"
  | "oto"
  | "downsell"
  | "thanks";

export type Trip = {
  at: number;
  pattern: string;
  stage: StudyStage;
  /** What the visitor actually did, in plain language. */
  note: string;
};

export type QuizAnswer = {
  question: string;
  choice: string;
  weight: number;
  /** What the answer told the seller about them. */
  reads: string;
};

export type StudyState = {
  stage: StudyStage;
  deadlineMs: number;
  /** How many times the "final" deadline has silently re-armed. */
  deadlineResets: number;
  seats: number;
  viewers: number;
  quiz: QuizAnswer[];
  score: number;
  selfPrediction: string | null;
  lead: { name: string; email: string } | null;
  cart: { id: string; label: string; price: number; preChecked?: boolean }[];
  declines: string[];
  trips: Trip[];
  startedAt: number;
};

const KEY = "study.state.v1";
const SEAT_FLOOR = 6;
const SEAT_START = 41;
const WINDOW_SECONDS = 14 * 60;

function fresh(): StudyState {
  return {
    stage: "hook",
    deadlineMs: Date.now() + WINDOW_SECONDS * 1000,
    deadlineResets: 0,
    seats: SEAT_START,
    viewers: 173,
    quiz: [],
    score: 0,
    selfPrediction: null,
    lead: null,
    cart: [],
    declines: [],
    trips: [],
    startedAt: Date.now(),
  };
}

function load(): StudyState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as Partial<StudyState>;
    return { ...fresh(), ...parsed };
  } catch {
    return fresh();
  }
}

let state: StudyState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* best effort */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function subscribeStudy(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getStudyState(): StudyState {
  return state;
}

export function useStudy(): StudyState {
  return useSyncExternalStore(subscribeStudy, getStudyState, getStudyState);
}

function update(patch: Partial<StudyState>) {
  state = { ...state, ...patch };
  emit();
}

/* ── the trip log ────────────────────────────────────────── */

/**
 * Record that a pattern was actually exercised on this visitor.
 * Deduped per pattern+note so a re-render never inflates the log.
 */
export function trip(pattern: string, note: string, stage: StudyStage = state.stage) {
  const already = state.trips.some((t) => t.pattern === pattern && t.note === note);
  if (already) return;
  state = {
    ...state,
    trips: [...state.trips, { at: Date.now(), pattern, stage, note }],
  };
  emit();
}

export function trippedPatterns(): string[] {
  return [...new Set(state.trips.map((t) => t.pattern))];
}

/* ── stage transitions ───────────────────────────────────── */

export function setStage(stage: StudyStage) {
  // Every stage advance nudges the fake room fuller — the visitor
  // is meant to feel the crowd arriving as they commit.
  const bump = Math.floor(Math.random() * 9) + 3;
  update({ stage, viewers: state.viewers + bump });
  try {
    window.scrollTo({ top: 0, behavior: "auto" });
  } catch {
    /* ignore */
  }
}

/* ── the countdown that never actually expires ───────────── */

export function remainingMs(now = Date.now()): number {
  return Math.max(0, state.deadlineMs - now);
}

/**
 * Called by the ticker. When the "final" deadline lapses it quietly
 * re-arms a fresh window and counts the lie. `deadlineResets` is
 * surfaced verbatim in the debrief.
 */
export function rearmDeadlineIfExpired(now = Date.now()) {
  if (state.deadlineMs > now) return;
  update({
    deadlineMs: now + WINDOW_SECONDS * 1000,
    deadlineResets: state.deadlineResets + 1,
  });
  trip(
    "persistent_countdown",
    "The 'final' deadline hit zero and silently restarted while you were on the page."
  );
}

export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ── scarcity widgets ────────────────────────────────────── */

export function decaySeat() {
  if (state.seats <= SEAT_FLOOR) return;
  update({ seats: state.seats - 1 });
  if (state.seats === SEAT_FLOOR) {
    trip(
      "seat_decay",
      `The seat counter reached its hard floor of ${SEAT_FLOOR}. It was never going to sell out.`
    );
  }
}

export function driftViewers() {
  const delta = Math.round((Math.random() - 0.45) * 9);
  const next = Math.min(268, Math.max(118, state.viewers + delta));
  update({ viewers: next });
}

/* ── quiz + lead ─────────────────────────────────────────── */

export function recordAnswer(answer: QuizAnswer) {
  const quiz = [...state.quiz.filter((a) => a.question !== answer.question), answer];
  update({ quiz, score: quiz.reduce((n, a) => n + a.weight, 0) });
}

export function recordSelfPrediction(choice: string) {
  update({ selfPrediction: choice });
  trip(
    "self_prediction",
    `You predicted your own future behaviour: “${choice}”. Every later decline link is written to contradict it.`
  );
}

export function recordLead(name: string, email: string) {
  update({ lead: { name: name.trim(), email: email.trim() } });
  trip(
    "lead_gate_before_price",
    "You handed over an email address before you were ever shown a price."
  );
}

/* ── cart ────────────────────────────────────────────────── */

export function setCart(cart: StudyState["cart"]) {
  update({ cart });
}

export function addToCart(item: StudyState["cart"][number]) {
  if (state.cart.some((c) => c.id === item.id)) return;
  update({ cart: [...state.cart, item] });
}

export function removeFromCart(id: string) {
  update({ cart: state.cart.filter((c) => c.id !== id) });
}

export function cartTotal(): number {
  return state.cart.reduce((n, c) => n + c.price, 0);
}

export function recordDecline(label: string) {
  if (state.declines.includes(label)) return;
  update({ declines: [...state.declines, label] });
}

/* ── reset ───────────────────────────────────────────────── */

export function resetStudy() {
  state = fresh();
  emit();
}

/* ── timing helper (respects ?study=fast) ────────────────── */

export function pace(ms: number): number {
  return studyFastMode() ? Math.min(40, ms) : ms;
}
