/** Shared request context + the /api/fd route table. */
import { ApiError, err } from "./util";
import { requireCsrf, requireUser, getSessionUser } from "./auth";
import * as content from "./content";
import * as auth from "./auth-handlers";
import * as campaigns from "./campaigns";
import * as admin from "./admin";

export type Ctx = {
  env: Env;
  req: Request;
  segments: string[];
  query: URLSearchParams;
  user: Awaited<ReturnType<typeof requireUser>> | null;
  json: () => Promise<Record<string, any>>;
};

type H = (ctx: Ctx) => Promise<Response>;

/** path = remainder after /api/fd/ (no leading slash) */
export async function dispatchFd(env: Env, req: Request, path: string): Promise<Response> {
  const url = new URL(req.url);
  const segments = path.split("/").filter(Boolean);
  const head = segments[0] || "";

  const ctx: Ctx = {
    env,
    req,
    segments,
    query: url.searchParams,
    user: null,
    json: async () => {
      if (cachedBody) return cachedBody;
      const cl = Number(req.headers.get("content-length") || 0);
      if (cl > 1_000_000) throw new ApiError(413, "Request body too large.");
      const body = await req.json().catch(() => {
        throw new ApiError(400, "Invalid JSON body.");
      });
      if (!body || typeof body !== "object") throw new ApiError(400, "Invalid JSON body.");
      cachedBody = body as Record<string, any>;
      return cachedBody;
    },
  };
  let cachedBody: Record<string, any> | null = null;

  // Public auth + outline endpoints
  const publicRoutes: Record<string, H> = {
    "auth/register": auth.handleRegister,
    "auth/login": auth.handleLogin,
    "auth/logout": auth.handleLogout,
    "auth/session": auth.handleSession,
    "auth/claim": auth.handleClaim,
    "entitlement": auth.handleEntitlement,
    "course/outline": content.handleOutline,
    "health": async () => Response.json({ ok: true }),
  };

  const route = segments.slice(0, 2).join("/");
  const key = segments.length === 1 ? segments[0] : route;

  const handler = publicRoutes[key];
  if (handler) {
    try {
      ctx.user = await getSessionUser(env, req);
      return await handler(ctx);
    } catch (e) {
      return toResponse(e);
    }
  }

  // Everything below: authenticated. Mutating calls need CSRF echo.
  try {
    ctx.user = await requireUser(env, req);
    if (req.method !== "GET" && req.method !== "HEAD") {
      const origin = req.headers.get("origin");
      if (origin && new URL(origin).host !== url.host) throw new ApiError(403, "Cross-origin request blocked.");
      requireCsrf(req, ctx.user);
    }
    const h = await pickHandler(segments, req.method);
    return await h(ctx);
  } catch (e) {
    return toResponse(e);
  }
}

async function pickHandler(segments: string[], method: string): Promise<H> {
  const [head, sub] = segments;
  switch (head) {
    case "course":
      if (segments[1] === "lesson") return content.handleLesson;
      if (segments[1] === "assets") return content.handleCourseAsset;
      throw new ApiError(404, "Not found.");
    case "progress":
      if (segments[1] === "lesson" && method === "PUT") return content.handleProgressUpdate;
      if (segments[1] === "lesson") return content.handleProgressUpdate;
      return content.handleProgressList;
    case "notes":
      if (segments[1] === "lesson") return content.handleLessonNote;
      if (segments[1] === "revisions") return content.handleNoteRevisions;
      if (segments[1] === "export") return campaigns.handleNotesExport;
      if (segments[1] && req.method === "DELETE") return content.handleNotesUpsert;
      if (req.method !== "GET") return content.handleNotesUpsert;
      return content.handleNotesList;
    case "drafts":
      return content.handleDrafts;
    case "campaigns":
      if (!sub) return campaigns.handleCampaignsRoot;
      if (sub === "wizard") return campaigns.handleWizardPreview;
      if (segments[2] === "tasks" && method === "PATCH") return campaigns.handleTaskPatch;
      if (segments[2] === "tasks") return campaigns.handleTasks;
      if (segments[2] === "targets") return campaigns.handleTargets;
      if (segments[2] === "touches") return campaigns.handleTouches;
      if (segments[2] === "outcomes") return campaigns.handleOutcomes;
      if (segments[2] === "waves") return campaigns.handleWaves;
      if (segments[2] === "clone") return campaigns.handleClone;
      if (segments[2] === "activate") return campaigns.handleActivate;
      if (segments[2] === "analytics") return campaigns.handleAnalytics;
      if (segments[2] === "export") return campaigns.handleExport;
      if (segments[2] === "snapshot") return campaigns.handleSnapshot;
      if (segments[2] === "generate-tasks") return campaigns.handleGenerateTasks;
      return campaigns.handleCampaignOne;
    case "targets":
      return campaigns.handleTargetOne;
    case "touches":
      return campaigns.handleTouchOne;
    case "suppressions":
      return campaigns.handleSuppressions;
    case "evidence":
      if (segments[1] === "upload-init") return campaigns.handleUploadInit;
      if (segments[1] === "upload-confirm") return campaigns.handleUploadConfirm;
      return campaigns.handleEvidence;
    case "stations":
      return campaigns.handleStations;
    case "heatmap":
      return campaigns.handleHeatmapData;
    case "vault":
      return campaigns.handleVault;
    case "me":
      return campaigns.handleMe;
    case "admin":
      return admin.handleAdmin(segments.slice(1));
    default:
      throw new ApiError(404, "Not found.");
  }
}

export function toResponse(e: unknown): Response {
  if (e instanceof ApiError) return err(e.status, e.message, (e as ApiError).details);
  console.error("[fd] unexpected", e);
  return err(500, "Internal error.");
}
