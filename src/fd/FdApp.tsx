/** Route table + access guards for the FD web app. */
import { useEffect } from "react";
import { matchRoute, useLocation, navigate } from "./lib/router";
import { useFd } from "./lib/store";
import { Shell } from "./Shell";
import { LoginScreen } from "./pages/Login";
import { AccessScreen } from "./pages/Access";
import { Dashboard } from "./pages/Dashboard";
import { ModulePage } from "./pages/ModulePage";
import { LessonPage } from "./pages/LessonPage";
import { CampaignPage } from "./pages/Campaign";
import { CampaignBoard } from "./pages/CampaignBoard";
import { HeatmapPage } from "./pages/Heatmap";
import { StationsPage } from "./pages/Stations";
import { NotesPage } from "./pages/Notes";
import { AnalyticsPage } from "./pages/Analytics";
import { VaultPage } from "./pages/Vault";
import { AdminPage } from "./pages/Admin";
import { Spinner } from "./lib/ui";

const APP_PREFIX = "/frequency-dominion/app";

export default function FdApp() {
  const { loading, user, entitlement } = useFd();
  const loc = useLocation();
  const path = loc.path;

  const isApp = path.startsWith(APP_PREFIX) || path === "/frequency-dominion/admin" || path.startsWith("/frequency-dominion/admin/");
  const isAuthPage = path === "/frequency-dominion/login" || path === "/frequency-dominion/signup";
  const entitled = entitlement?.status === "active";

  // Guard: protected routes bounce to login with a return path; then to the
  // access screen when authenticated-but-unpaid. (Server-side checks are the
  // real authorization — this is UX only.)
  useEffect(() => {
    if (loading) return;
    if (isApp || (path.startsWith("/frequency-dominion/admin") && path !== "/frequency-dominion/admin")) {
      if (!user) navigate(`/frequency-dominion/login?next=${encodeURIComponent(path + (location.search || ""))}`, true);
      else if (path.startsWith(APP_PREFIX) && !entitled) navigate(`/frequency-dominion/app/access?next=${encodeURIComponent(path)}`, true);
    }
    if (isAuthPage && user) navigate(nextTarget(loc.query) || "/frequency-dominion/app", true);
  }, [loading, user, entitled, path, isApp, isAuthPage, loc.query]);

  if (path === "/frequency-dominion/login" || path === "/frequency-dominion/signup") {
    return <LoginScreen mode={path.endsWith("signup") ? "signup" : "login"} next={nextTarget(loc.query)} />;
  }

  if (loading) {
    return (
      <div className="fd-root grid min-h-dvh place-items-center">
        <Spinner label="Opening the console…" />
      </div>
    );
  }

  if (path.startsWith(APP_PREFIX) || path.startsWith("/frequency-dominion/admin")) {
    if (!user || (path.startsWith(APP_PREFIX) && !entitled)) {
      return (
        <div className="fd-root grid min-h-dvh place-items-center">
          <Spinner label="Redirecting…" />
        </div>
      );
    }
    let screen: React.ReactNode;
    const lesson = matchRoute(path, `${APP_PREFIX}/lesson/:lessonId`);
    const module = matchRoute(path, `${APP_PREFIX}/module/:moduleId`);
    const board = matchRoute(path, `${APP_PREFIX}/campaign/:campaignId`);
    if (path === `${APP_PREFIX}/access`) screen = <AccessScreen />;
    else if (path === APP_PREFIX) screen = <Dashboard />;
    else if (module) screen = <ModulePage moduleId={module.moduleId} />;
    else if (lesson) screen = <LessonPage lessonId={lesson.lessonId} />;
    else if (path === `${APP_PREFIX}/campaign`) screen = <CampaignPage />;
    else if (board) screen = <CampaignBoard campaignId={board.campaignId} />;
    else if (path === `${APP_PREFIX}/heatmap`) screen = <HeatmapPage />;
    else if (path === `${APP_PREFIX}/stations`) screen = <StationsPage />;
    else if (path === `${APP_PREFIX}/notes`) screen = <NotesPage />;
    else if (path === `${APP_PREFIX}/analytics`) screen = <AnalyticsPage />;
    else if (path === `${APP_PREFIX}/vault`) screen = <VaultPage />;
    else if (path.startsWith("/frequency-dominion/admin")) screen = user.role === "admin" ? <AdminPage /> : <Forbidden />;
    else screen = <NotFound />;
    return <Shell>{screen}</Shell>;
  }

  return <NotFound />;
}

function nextTarget(q: URLSearchParams): string {
  const n = q.get("next") || "";
  return n.startsWith("/frequency-dominion/") ? n : "";
}

function Forbidden() {
  return (
    <div className="fd-card p-8 text-center">
      <p className="fd-display text-2xl">Administrator access required</p>
      <p className="mt-2 text-sm text-white/60">Your account is not in the admin group. Ask a RadioReach administrator.</p>
      <button type="button" className="fd-btn mt-4" onClick={() => navigate("/frequency-dominion/app")}>Back to the Command Deck</button>
    </div>
  );
}

function NotFound() {
  return (
    <div className="fd-root grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="fd-display text-5xl">OFF<span className="text-[#f4c21d]">TUNE</span></p>
        <p className="mt-3 text-sm text-white/60">That frequency does not exist. The course lives at <code>/frequency-dominion/app</code>; the sales page at <code>/frequency-dominion/</code>.</p>
        <div className="mt-5 flex justify-center gap-3">
          <a className="fd-btn fd-btn--gold" href="/frequency-dominion/">Sales page</a>
          <button type="button" className="fd-btn" onClick={() => navigate("/frequency-dominion/app")}>Open the console</button>
        </div>
      </div>
    </div>
  );
}
