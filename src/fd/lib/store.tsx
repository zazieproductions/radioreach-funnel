/** Global FD state: session, entitlement, dashboard "me" payload, outline. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fdApi, ApiFailure } from "./api";

export type EntitlementView = { status: string; product?: string; source?: string; grantedAt?: string | null; revokedAt?: string | null };
export type SessionUser = { id: string; email: string; displayName: string; role: "member" | "admin" };

export type CampaignRow = { id: string; name: string; artist: string; releaseTitle: string; track: string; startDate: string | null; status: string; objective: string; hypothesis: string; active: boolean; plan: Record<string, any> | null; [k: string]: unknown };
export type MePayload = {
  user: { email: string; displayName: string };
  profile: Record<string, unknown> | null;
  entitlement: string; // "active" | code from requireEnrolled | "none"
  campaign: CampaignRow | null;
  course: { lessonTotal: number; done: number; pct: number; resume: { lessonId: string; title: string; moduleTitle: string } | null; modules: { id: string; done: number; total: number }[] };
  campaignSnapshot: { todayTasks: number; overdue: number; blocked: number; prioritizedStations: number; stats: Record<string, unknown> | null };
  recentNotes: { id: string; scope: string; body: string; updated_at: string }[];
  recentEvidence: { id: string; kind: string; title: string; claim_status: string; created_at: string }[];
  openDecisions: string[];
};

type Store = {
  loading: boolean;
  user: SessionUser | null;
  entitlement: EntitlementView | null;
  me: MePayload | null;
  outline: any | null;
  toasts: { id: number; text: string; kind: "ok" | "warn" | "err" }[];
  refreshSession: () => Promise<void>;
  refreshMe: () => Promise<void>;
  onAuthed: (user: SessionUser, ent: EntitlementView) => void;
  logout: () => Promise<void>;
  toast: (text: string, kind?: "ok" | "warn" | "err") => void;
};

const Ctx = createContext<Store>(null as never);
export const useFd = () => useContext(Ctx);

let toastSeq = 1;

export function FdProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementView | null>(null);
  const [me, setMe] = useState<MePayload | null>(null);
  const [outline, setOutline] = useState<any | null>(null);
  const [toasts, setToasts] = useState<Store["toasts"]>([]);

  const toast = useCallback((text: string, kind: "ok" | "warn" | "err" = "ok") => {
    const id = toastSeq++;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      setMe(await fdApi.get<MePayload>("me"));
    } catch (e) {
      if (e instanceof ApiFailure && [402, 403].includes(e.status)) setMe(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const r = await fdApi.get<{ user: SessionUser | null; entitlement?: EntitlementView; profile?: unknown }>("auth/session");
      setUser(r.user || null);
      setEntitlement(r.entitlement || null);
      if (r.user) void refreshMe();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshMe]);

  useEffect(() => {
    void refreshSession();
    void fdApi.get("course/outline").then(setOutline).catch(() => setOutline(null));
  }, [refreshSession]);

  const onAuthed = useCallback((u: SessionUser, ent: EntitlementView) => {
    setUser(u);
    setEntitlement(ent);
    void refreshMe();
  }, [refreshMe]);

  const logout = useCallback(async () => {
    try { await fdApi.post("auth/logout"); } catch { /* ignore */ }
    setUser(null);
    setEntitlement(null);
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ loading, user, entitlement, me, outline, toasts, refreshSession, refreshMe, onAuthed, logout, toast }),
    [loading, user, entitlement, me, outline, toasts, refreshSession, refreshMe, onAuthed, logout, toast]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
