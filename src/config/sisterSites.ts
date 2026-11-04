// Typed access to the off-site editorial links declared in
// src/config/sister-sites.json — the same file the resource-page generator
// reads. Never hard-code an outbound editorial URL in a component.
//
// Placement rules live in docs/backlink-strategy.md: one contextual link per
// page at most, never inside checkout or pricing surfaces.
import sisterSites from "./sister-sites.json";

export type SisterSite = {
  name: string;
  url: string;
  showreelUrl: string;
  shortDescription: string;
  footerLine: string;
};

export const ZAZIE_PRODUCTIONS: SisterSite = sisterSites.zazieProductions;
