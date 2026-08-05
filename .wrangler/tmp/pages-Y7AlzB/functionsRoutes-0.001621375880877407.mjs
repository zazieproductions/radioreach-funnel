import { onRequestPost as __api_checkout_session_ts_onRequestPost } from "/Users/zaziekanwar-torge/radioreach-funnel/functions/api/checkout/session.ts"
import { onRequestGet as __api_checkout_verify_ts_onRequestGet } from "/Users/zaziekanwar-torge/radioreach-funnel/functions/api/checkout/verify.ts"
import { onRequestPost as __api_downloads_session_ts_onRequestPost } from "/Users/zaziekanwar-torge/radioreach-funnel/functions/api/downloads/session.ts"
import { onRequestPost as __api_stripe_webhook_ts_onRequestPost } from "/Users/zaziekanwar-torge/radioreach-funnel/functions/api/stripe/webhook.ts"

export const routes = [
    {
      routePath: "/api/checkout/session",
      mountPath: "/api/checkout",
      method: "POST",
      middlewares: [],
      modules: [__api_checkout_session_ts_onRequestPost],
    },
  {
      routePath: "/api/checkout/verify",
      mountPath: "/api/checkout",
      method: "GET",
      middlewares: [],
      modules: [__api_checkout_verify_ts_onRequestGet],
    },
  {
      routePath: "/api/downloads/session",
      mountPath: "/api/downloads",
      method: "POST",
      middlewares: [],
      modules: [__api_downloads_session_ts_onRequestPost],
    },
  {
      routePath: "/api/stripe/webhook",
      mountPath: "/api/stripe",
      method: "POST",
      middlewares: [],
      modules: [__api_stripe_webhook_ts_onRequestPost],
    },
  ]