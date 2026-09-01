import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "./fd.css";
import FdApp from "./FdApp";
import { FdProvider } from "./lib/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FdProvider>
      <FdApp />
    </FdProvider>
  </StrictMode>
);
