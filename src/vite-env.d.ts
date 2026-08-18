/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_MOMENTUM_SEQUENCE_ENABLED?: "true" | "false";
  readonly VITE_SPIN_WHEEL_ENABLED?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
