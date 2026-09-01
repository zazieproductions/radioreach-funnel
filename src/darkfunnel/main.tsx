import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./darkfunnel.css";
import DarkFunnelApp from "./DarkFunnelApp";

/* Dev-only research entry. Loud console notice so nobody
   mistakes a screenshot of this for the live storefront. */
if (typeof console !== "undefined") {
  console.info(
    "%cDARK FUNNEL TEARDOWN — research replica. No payments, no network, not deployed.",
    "background:#22d3ee;color:#04141a;font-weight:700;padding:2px 6px;border-radius:3px",
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DarkFunnelApp />
  </StrictMode>,
);
