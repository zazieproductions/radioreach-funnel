import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const container = document.getElementById("root")!;

// The static entity-facts block (injected into index.html by
// scripts/build-homepage-facts.mjs) exists so that crawlers and retrieval
// systems which do not execute JavaScript still see the critical facts:
// what RadioReach is, what it is not, price, refund terms, and disclaimers.
//
// It is real, visible content — not hidden text and not a crawler-only
// variant — but once React mounts, the interactive page states the same facts
// in full, so the static block is removed to avoid duplicating it.
// createRoot() would clear the container anyway; removing it explicitly keeps
// the intent obvious and avoids any flash of duplicated headings.
document.getElementById("entity-facts")?.remove();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
