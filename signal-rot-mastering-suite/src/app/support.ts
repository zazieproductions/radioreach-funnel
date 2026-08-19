import { PROCESSING_CAPABILITIES } from "../signal-rot/engine";

export const SUPPORT=PROCESSING_CAPABILITIES.map(capability=>({
  ...capability,
  previewLabel:capability.preview?"Yes":"No",
  exportLabel:capability.export?"Yes":"No",
  exactLabel:capability.exactAlgorithm?"Yes":"No",
}));
