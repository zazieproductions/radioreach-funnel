// Frequency Dominion API — single Pages Functions entry for /api/fd/*
import { dispatchFd } from "../../_lib/fd/router";

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/api\/fd\/?/, "");
  return dispatchFd(context.env, context.request, path);
};
