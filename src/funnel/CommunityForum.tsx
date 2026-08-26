import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CATEGORIES,
  THREADS,
  USERS,
  formatCount,
  formatForumDate,
  lastPoster,
  threadActivity,
  threadCreated,
  threadReplies,
  threadVotes,
  type ForumPost,
  type ForumThread,
  type ThreadCategory,
} from "./forumData";
import { generateSimReply } from "./simReplies";

/* ─────────────────────────────────────────────────────────────
   RadioReach Community: simulated forum (concept build)

   A self-contained archive surface: 2017 → present, vote state and
   guest replies persist locally. All data comes from forumData.ts.
────────────────────────────────────────────────────────────── */

/* ── persistence ─────────────────────────────────────────── */

const VOTES_KEY = "rr_forum_votes_v1";
const REPLIES_KEY = "rr_forum_replies_v1";
const THREADS_KEY = "rr_forum_threads_v1";
const GUEST_KEY = "rr_forum_guest_v1";

type VoteMap = Record<string, true>;
/** Guest-authored and simulated replies, persisted so the forum grows locally. */
type GuestReply = {
  threadId: string;
  body: string;
  date: string;
  time: string;
  author?: string;
};
/** Guest-created threads, persisted the same way. */
type UserThread = {
  id: string;
  title: string;
  category: ThreadCategory;
  body: string;
  date: string;
  time: string;
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode — session-only is fine */
  }
}

function guestHandle(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY);
    if (existing) return existing;
    const id = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(GUEST_KEY, id);
    return id;
  } catch {
    return "guest_0000";
  }
}

/* ── avatar ──────────────────────────────────────────────── */

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  staff: { label: "STAFF", cls: "bg-acid text-ink" },
  moderator: { label: "MOD", cls: "bg-green-400 text-black" },
  founding: { label: "FOUNDING", cls: "bg-white/15 text-white/80" },
};

function Avatar({ user, size = 44 }: { user: (typeof USERS)[string]; size?: number }) {
  const staffRing =
    user.role === "staff"
      ? "ring-acid/70"
      : user.role === "moderator"
        ? "ring-green-400/60"
        : "ring-white/10";
  const initials = user.id === "guest" ? "?" : user.id.replace(/_/g, " ").slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-display ring-2 ${staffRing}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background:
          user.role === "staff"
            ? "var(--color-acid)"
            : `hsl(${user.hue} 42% 20%)`,
        color: user.role === "staff" ? "var(--color-ink)" : `hsl(${user.hue} 70% 78%)`,
        letterSpacing: "0.04em",
      }}
    >
      {initials}
    </span>
  );
}

/* ── tiny body renderer (paragraphs, quotes, lists, bold) ── */

function inline(text: string, keyBase: string): ReactNode[] {
  // unescape the \[ \] used in a few posts
  const cleaned = text.replace(/\\([\[\]])/g, "$1");
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|@[A-Za-z0-9_]+)/g);
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.86em] text-acid">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span key={key} className="font-bold text-acid/90">
          {part}
        </span>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function renderBody(body: string, keyBase: string): ReactNode[] {
  return body.split(/\n\n+/).map((block, bi) => {
    const key = `${keyBase}-b${bi}`;
    const lines = block.split("\n");

    if (lines.every((l) => l.startsWith("> "))) {
      return (
        <blockquote
          key={key}
          className="my-2 border-l-2 border-acid/50 pl-3 text-white/55 italic"
        >
          {lines.map((l, li) => (
            <p key={`${key}-q${li}`}>{inline(l.slice(2), `${key}-q${li}`)}</p>
          ))}
        </blockquote>
      );
    }

    if (lines.every((l) => l.startsWith("- "))) {
      return (
        <ul key={key} className="my-2 list-disc space-y-1.5 pl-5">
          {lines.map((l, li) => (
            <li key={`${key}-l${li}`}>{inline(l.slice(2), `${key}-l${li}`)}</li>
          ))}
        </ul>
      );
    }

    if (lines.every((l) => /^\d+\.\s/.test(l))) {
      return (
        <ol key={key} className="my-2 list-decimal space-y-1.5 pl-5">
          {lines.map((l, li) => (
            <li key={`${key}-o${li}`}>{inline(l.replace(/^\d+\.\s/, ""), `${key}-o${li}`)}</li>
          ))}
        </ol>
      );
    }

    return (
      <p key={key} className="my-2 first:mt-0 last:mb-0">
        {lines.map((l, li) => (
          <span key={`${key}-p${li}`}>
            {li > 0 && <br />}
            {inline(l, `${key}-p${li}`)}
          </span>
        ))}
      </p>
    );
  });
}

/* ── vote button ─────────────────────────────────────────── */

function VoteControl({
  votes,
  voted,
  onToggle,
  label,
}: {
  votes: number;
  voted: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={voted}
        aria-label={voted ? `Remove upvote from ${label}` : `Upvote ${label}`}
        className={`tap-target grid h-8 w-8 place-items-center rounded-md border transition-colors ${
          voted
            ? "border-acid bg-acid/20 text-acid"
            : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
        }`}
      >
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden className="fill-current">
          <path d="M6 1.2 11 8.4H1z" />
        </svg>
      </button>
      <span
        className={`tnum min-w-[2ch] text-sm font-bold ${voted ? "text-acid" : "text-white/70"}`}
        aria-label={`${votes} upvotes`}
      >
        {votes > 0 ? formatCount(votes) : "0"}
      </span>
    </div>
  );
}

/* ── badges ──────────────────────────────────────────────── */

function Tag({ kind }: { kind: "solved" | "staff" | "locked" | "pinned" }) {
  if (kind === "solved")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-400">
        ✓ Solved
      </span>
    );
  if (kind === "staff")
    return (
      <span className="rounded-full bg-acid/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-acid">
        Staff answer
      </span>
    );
  if (kind === "locked")
    return (
      <span className="rounded-full bg-blood/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blood">
        🔒 Locked
      </span>
    );
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white/60">
      📌 Pinned
    </span>
  );
}

/* ── post card ───────────────────────────────────────────── */

function PostCard({
  thread,
  post,
  index,
  voted,
  onVote,
  onQuote,
  onReply,
  onLink,
  highlighted,
  guestName,
}: {
  thread: ForumThread;
  post: ForumPost;
  index: number;
  voted: boolean;
  onVote: () => void;
  onQuote: () => void;
  onReply: () => void;
  onLink: () => void;
  highlighted: boolean;
  guestName: string;
}) {
  const user = USERS[post.author] ?? USERS.guest;
  const role = ROLE_BADGE[user.role ?? "member"];
  const isGuest = post.author === "guest";
  const shownName = isGuest ? guestName : user.id;

  if (post.removed) {
    return (
      <li className="rounded-xl border border-white/5 bg-black/30 p-4 opacity-60">
        <div className="flex items-center gap-3">
          <Avatar user={USERS.guest} size={34} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white/50">{post.author}</p>
            <p className="text-xs text-white/35">{formatForumDate(post.date, post.time)}</p>
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-dashed border-white/15 bg-black/40 p-3 font-mono text-[13px] leading-relaxed text-white/45">
          {renderBody(post.body, `${thread.id}-${index}`)}
        </p>
      </li>
    );
  }

  return (
    <li
      id={`post-${index}`}
      className={`rounded-xl border bg-panel transition-shadow ${
        highlighted ? "ring-2 ring-acid/70" : ""
      } ${
        post.staffAnswer ? "border-acid/30" : post.solved ? "border-green-400/30" : "border-white/10"
      }`}
    >
      {post.staffAnswer && (
        <p className="border-b border-acid/20 bg-acid/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-acid">
          Staff answer
        </p>
      )}
      {post.solved && (
        <p className="border-b border-green-400/20 bg-green-400/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-green-400">
          ✓ Accepted answer
        </p>
      )}
      <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
        {/* user column */}
        <div className="hidden w-40 shrink-0 sm:block">
          <div className="flex items-center gap-2">
            <Avatar user={user} size={38} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-bold text-white">
                <span className="truncate">{shownName}</span>
                {role && !isGuest && (
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black tracking-wider ${role.cls}`}>
                    {role.label}
                  </span>
                )}
                {index === 0 && (
                  <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white/75">
                    OP
                  </span>
                )}
              </p>
            </div>
          </div>
          {isGuest ? (
            <p className="mt-2 text-[11px] leading-snug text-white/45">that's you (demo guest)</p>
          ) : (
            user.flair && <p className="mt-2 text-[11px] leading-snug text-white/45">{user.flair}</p>
          )}
          <p className="mt-2 text-[11px] text-white/35">
            {isGuest ? "Joined today" : `Joined ${user.joined}`} ·{" "}
            {isGuest ? "1 post" : `${formatCount(user.posts)} posts`}
          </p>
          {!isGuest && user.online && (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> online now
            </p>
          )}
          {!isGuest && user.signature && (
            <p className="mt-3 border-t border-white/10 pt-2 text-[11px] italic text-white/30">
              {user.signature}
            </p>
          )}
        </div>

        {/* content column */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:hidden">
            <Avatar user={user} size={30} />
            <p className="text-sm font-bold text-white">{shownName}</p>
            {role && !isGuest && (
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-black tracking-wider ${role.cls}`}>
                {role.label}
              </span>
            )}
            {index === 0 && (
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white/75">
                OP
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
            <p className="text-xs text-white/40">
              <span className="sm:hidden">{user.flair ? `${user.flair} · ` : ""}</span>
              {index === 0 ? "posted" : "replied"} {formatForumDate(post.date, post.time)}
              {post.edited && <span className="text-white/25"> · {post.edited}</span>}
            </p>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onReply}
                className="tap-target rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white/35 hover:text-white"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={onQuote}
                className="tap-target rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white/35 hover:text-white"
              >
                Quote
              </button>
              <button
                type="button"
                onClick={onLink}
                className="tap-target rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white/35 hover:text-white"
              >
                Link
              </button>
            </div>
          </div>

          <div className="mt-3 text-[15px] leading-[1.65] text-white/80">
            {renderBody(post.body, `${thread.id}-${index}`)}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <VoteControl
              votes={post.votes + (voted ? 1 : 0)}
              voted={voted}
              onToggle={onVote}
              label={`reply by ${user.id}`}
            />
            <p className="text-[11px] text-white/25">#{index + 1}</p>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ── main component ──────────────────────────────────────── */

type SortMode = "latest" | "top" | "views";

const SORTS: { id: SortMode; label: string }[] = [
  { id: "latest", label: "Latest activity" },
  { id: "top", label: "Top of the archive" },
  { id: "views", label: "Most viewed" },
];

export default function CommunityForum({ onBack }: { onBack: () => void }) {
  const [votes, setVotes] = useState<VoteMap>(() => readJSON<VoteMap>(VOTES_KEY, {}));
  const [guestReplies, setGuestReplies] = useState<GuestReply[]>(() =>
    readJSON<GuestReply[]>(REPLIES_KEY, []),
  );
  const [userThreads, setUserThreads] = useState<UserThread[]>(() =>
    readJSON<UserThread[]>(THREADS_KEY, []),
  );
  const [guest] = useState(guestHandle);

  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ThreadCategory | "all">("all");
  const [sort, setSort] = useState<SortMode>("latest");
  const [postOrder, setPostOrder] = useState<"chrono" | "votes">("chrono");
  const [draft, setDraft] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [linkTarget, setLinkTarget] = useState<number | null>(null);

  /* new-thread composer */
  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCat, setNewCat] = useState<ThreadCategory>("start");

  /* simulated regular answering a fresh guest post */
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);
  const newTitleRef = useRef<HTMLInputElement>(null);
  const simTimers = useRef<number[]>([]);

  useEffect(
    () => () => {
      simTimers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [openThreadId]);

  // Per-thread UI state resets when switching threads.
  useEffect(() => {
    setWatching(false);
    setLinkTarget(null);
  }, [openThreadId]);

  /* threads: shipped archive + guest-created threads, then any locally
     posted replies (guest or simulated) merged into each */
  const threads = useMemo(() => {
    const mine: ForumThread[] = userThreads.map((u) => ({
      id: u.id,
      title: u.title,
      category: u.category,
      views: 1,
      posts: [
        { author: "guest", date: u.date, time: u.time, votes: 0, body: u.body },
      ],
    }));
    return [...THREADS, ...mine].map((t) => {
      const extras = guestReplies
        .filter((r) => r.threadId === t.id)
        .map<ForumPost>((r) => ({
          author: r.author ?? "guest",
          date: r.date,
          time: r.time,
          votes: 0,
          body: r.body,
        }));
      return extras.length ? { ...t, posts: [...t.posts, ...extras] } : t;
    });
  }, [guestReplies, userThreads]);

  /* Resolved against the merged list so freshly-posted guest replies appear
     inside the open thread immediately (no reopen needed). */
  const openThread = useMemo(
    () => (openThreadId ? (threads.find((t) => t.id === openThreadId) ?? null) : null),
    [openThreadId, threads],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = threads.filter((t) => (cat === "all" ? true : t.category === cat));
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.posts.some(
            (p) =>
              p.body.toLowerCase().includes(q) ||
              p.author.toLowerCase().includes(q),
          ),
      );
    }
    const pinned = list.filter((t) => t.pinned);
    const rest = list.filter((t) => !t.pinned);
    const cmp: Record<SortMode, (a: ForumThread, b: ForumThread) => number> = {
      latest: (a, b) => threadActivity(b).localeCompare(threadActivity(a)),
      top: (a, b) => threadVotes(b) - threadVotes(a),
      views: (a, b) => b.views - a.views,
    };
    return [...pinned, ...rest.sort(cmp[sort])];
  }, [threads, query, cat, sort]);

  const toggleVote = (threadId: string, index: number) => {
    const key = `${threadId}:${index}`;
    setVotes((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      writeJSON(VOTES_KEY, next);
      return next;
    });
  };

  const quotePost = (post: ForumPost) => {
    if (!openThread) return;
    const snippet = post.body.split("\n")[0].slice(0, 140);
    setDraft((d) =>
      `${d ? `${d}\n\n` : ""}> ${post.author} wrote: ${snippet}${post.body.length > 140 ? "…" : ""}\n\n`,
    );
    composerRef.current?.focus();
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /** Reply-to-mention: prefill just the @handle, the way every forum does it. */
  const replyTo = (post: ForumPost) => {
    setDraft((d) => `${d ? `${d}\n\n` : ""}@${post.author} `);
    composerRef.current?.focus();
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /** "Link" action: jump to the post and flash a highlight ring on it. */
  const linkPost = (index: number) => {
    document
      .getElementById(`post-${index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    setLinkTarget(index);
    window.setTimeout(() => setLinkTarget(null), 1600);
  };

  const submitReply = () => {
    if (!openThread || !draft.trim()) return;
    const text = draft.trim();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const reply: GuestReply = {
      threadId: openThread.id,
      body: text,
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    };
    const next = [...guestReplies, reply];
    setGuestReplies(next);
    writeJSON(REPLIES_KEY, next);
    setDraft("");
    setFlash("Posted. (Saved in this browser.)");
    window.setTimeout(() => setFlash(null), 4000);
    scheduleSimReply(openThread.id, text, openThread.title);
  };

  /** Create a new thread as the guest; it persists and joins the real list. */
  const submitThread = () => {
    const title = newTitle.trim();
    const body = newBody.trim();
    if (!title || !body) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ut: UserThread = {
      id: `u-${now.getTime()}`,
      title,
      category: newCat,
      body,
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    };
    const next = [ut, ...userThreads];
    setUserThreads(next);
    writeJSON(THREADS_KEY, next);
    setNewTitle("");
    setNewBody("");
    setNewCat("start");
    setComposerOpen(false);
    setPostOrder("chrono");
    setOpenThreadId(ut.id);
    scheduleSimReply(ut.id, body, title);
  };

  /** A regular "answers" the fresh post: typing indicator, then a reply
      in that persona's voice, persisted like any other post. */
  function scheduleSimReply(threadId: string, text: string, title: string) {
    const sim = generateSimReply(text, title);
    const typingStarts = 900 + Math.random() * 1600;
    const postsAt = typingStarts + 2600 + Math.random() * 2600;
    simTimers.current.push(
      window.setTimeout(() => setTypingUser(sim.author), typingStarts),
    );
    simTimers.current.push(
      window.setTimeout(() => {
        setTypingUser(null);
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        setGuestReplies((prev) => {
          const reply: GuestReply = {
            threadId,
            body: sim.body,
            date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
            time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
            author: sim.author,
          };
          const next = [...prev, reply];
          writeJSON(REPLIES_KEY, next);
          return next;
        });
      }, postsAt),
    );
  }

  /* ── thread detail ─────────────────────────────────────── */
  if (openThread) {
    const t = openThread;
    const ordered = [...t.posts];
    if (postOrder === "votes") ordered.sort((a, b) => b.votes - a.votes);
    const category = CATEGORIES[t.category];

    return (
      <div className="min-h-screen bg-ink text-white">
        <ForumHeader onBack={onBack} query={query} setQuery={setQuery} />

        <div ref={listTopRef} className="mx-auto max-w-5xl px-3 pb-24 pt-6 sm:px-4">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-white/40">
            <button
              type="button"
              onClick={() => setOpenThreadId(null)}
              className="font-bold text-acid hover:underline"
            >
              ← All threads
            </button>
            <span aria-hidden>/</span>
            <span>{category.label}</span>
            <span aria-hidden>/</span>
            <span className="text-white/25">thread</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <h1 className="max-w-3xl font-display text-[1.45rem] leading-tight tracking-wide sm:text-3xl">
              {t.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {t.pinned && <Tag kind="pinned" />}
              {t.locked && <Tag kind="locked" />}
              {t.posts.some((p) => p.solved) && <Tag kind="solved" />}
              {t.posts.some((p) => p.staffAnswer) && <Tag kind="staff" />}
              <button
                type="button"
                onClick={() => setWatching((w) => !w)}
                aria-pressed={watching}
                className={`tap-target rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  watching
                    ? "border-acid/60 bg-acid/10 text-acid"
                    : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                }`}
              >
                🔔 {watching ? "Watching" : "Watch"}
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/10 pb-4 text-xs text-white/45">
            <span>
              Started by{" "}
              <button
                type="button"
                onClick={() => quotePost(t.posts[0])}
                className="font-bold text-white/80"
              >
                {t.posts[0].author === "guest" ? guest : t.posts[0].author}
              </button>{" "}
              in <span style={{ color: `hsl(${category.hue} 70% 70%)` }}>{category.label}</span>
            </span>
            <span>{formatForumDate(threadCreated(t))}</span>
            <span>{formatCount(t.views)} views</span>
            <span>{threadReplies(t)} replies</span>
            <span>{formatCount(threadVotes(t))} upvotes across thread</span>
          </div>

          {t.locked && (
            <p className="mt-4 rounded-lg border border-blood/30 bg-blood/10 px-4 py-3 text-sm text-white/70">
              🔒 <b className="text-blood">Thread locked.</b> This conversation is archived
              read-only. See the moderator note at the bottom of the thread.
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
              {ordered.length} {postOrder === "votes" ? "posts · top-rated" : "posts · chronological"}
            </p>
            <div className="flex rounded-lg border border-white/10 p-0.5">
              {(["chrono", "votes"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPostOrder(mode)}
                  className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    postOrder === mode ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  }`}
                >
                  {mode === "chrono" ? "Chrono" : "Top"}
                </button>
              ))}
            </div>
          </div>

          <ol className="mt-3 space-y-3">
            {ordered.map((post, i) => {
              const realIndex = t.posts.indexOf(post);
              const vKey = `${t.id}:${realIndex}`;
              return (
                <PostCard
                  key={`${t.id}-${realIndex}-${i}`}
                  thread={t}
                  post={post}
                  index={realIndex}
                  voted={!!votes[vKey]}
                  onVote={() => toggleVote(t.id, realIndex)}
                  onQuote={() => quotePost(post)}
                  onReply={() => replyTo(post)}
                  onLink={() => linkPost(realIndex)}
                  highlighted={linkTarget === realIndex}
                  guestName={guest}
                />
              );
            })}
          </ol>

          {/* composer */}
          <div className="mt-6 rounded-xl border border-white/10 bg-panel p-4 sm:p-5">
            {t.locked ? (
              <p className="text-sm text-white/45">
                Replies are disabled: this thread is locked and preserved as part of the archive.
              </p>
            ) : (
              <>
                {typingUser && (
                  <p
                    aria-live="polite"
                    className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/60"
                  >
                    <Avatar user={USERS[typingUser] ?? USERS.guest} size={20} />
                    <span className="font-bold text-white/80">{typingUser}</span> is typing
                    <span className="inline-flex gap-0.5 pb-0.5" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1 w-1 animate-bounce rounded-full bg-current"
                          style={{ animationDelay: `${i * 160}ms` }}
                        />
                      ))}
                    </span>
                  </p>
                )}
                <label
                  htmlFor="reply-box"
                  className="text-xs font-black uppercase tracking-[0.16em] text-white/50"
                >
                  Reply to this thread
                </label>
                <p className="mt-1 text-xs text-white/35">
                  Posting as <span className="font-mono text-acid">{guest}</span> · read the rules
                  first: numbers welcome, no blasting. The regulars answer; your posts save to this
                  browser and stay here on every visit.
                </p>
                <textarea
                  id="reply-box"
                  ref={composerRef}
                  rows={4}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add to the archive… (blank lines separate paragraphs; '> quote' lines and - lists render too)"
                  className="mt-3 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-[15px] leading-relaxed text-white placeholder:text-white/30 focus:border-acid/60 focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-white/30">
                    Demo note: replies stay in your browser. Nothing is sent anywhere.
                  </p>
                  <button
                    type="button"
                    onClick={submitReply}
                    disabled={!draft.trim()}
                    className="cta rounded-lg bg-acid px-5 py-2.5 text-sm font-black uppercase tracking-wide text-ink disabled:opacity-40"
                  >
                    Post reply
                  </button>
                </div>
                {flash && (
                  <p role="status" className="mt-3 text-sm font-bold text-green-400">
                    ✓ {flash}
                  </p>
                )}
              </>
            )}
          </div>

          {/* more from this board, the way every real forum cross-links */}
          {(() => {
            const related = threads
              .filter((x) => x.id !== t.id && x.category === t.category)
              .slice(0, 3);
            if (!related.length) return null;
            return (
              <div className="mt-8 border-t border-white/10 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
                  More from {category.label}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {related.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setPostOrder("chrono");
                        setOpenThreadId(r.id);
                      }}
                      className="group rounded-lg border border-white/10 bg-panel p-3 text-left transition-colors hover:border-acid/40"
                    >
                      <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white/85 group-hover:text-acid">
                        {r.title}
                      </p>
                      <p className="mt-1.5 text-[11px] text-white/35">
                        {formatCount(threadVotes(r))} upvotes · {threadReplies(r)} replies ·{" "}
                        {formatCount(r.views)} views
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={() => setOpenThreadId(null)}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-white/70 hover:border-white/40 hover:text-white"
            >
              ← Back to all threads
            </button>
            <a
              href="#top"
              onClick={onBack}
              className="rounded-lg bg-acid px-4 py-2.5 text-sm font-black uppercase tracking-wide text-ink hover:bg-yellow-300"
            >
              Get the directory ($20)
            </a>
          </div>
        </div>
        <ForumFooter onBack={onBack} />
      </div>
    );
  }

  /* ── thread list ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-ink text-white">
      <ForumHeader onBack={onBack} query={query} setQuery={setQuery} />

      {/* stats strip */}
      <div className="border-b border-white/10 bg-panel">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-3 py-4 sm:px-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl leading-none tracking-wide sm:text-4xl">
              THE COMMUNITY <span className="text-acid">ARCHIVE</span>
            </h1>
            <p className="mt-1.5 text-[13px] text-white/45">
              Every question, argument, and receipt from the board. Ask something; the regulars
              answer.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <button
              type="button"
              onClick={() => {
                setComposerOpen((o) => !o);
                if (!composerOpen) {
                  window.setTimeout(() => newTitleRef.current?.focus(), 50);
                }
              }}
              className="cta rounded-lg bg-acid px-4 py-2.5 text-sm font-black uppercase tracking-wide text-ink"
            >
              {composerOpen ? "Close composer" : "＋ New thread"}
            </button>
            <p className="text-[11px] text-white/35">
              posts as <span className="font-mono">{guest}</span> · saved in this browser
            </p>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="sticky top-12 z-30 border-b border-white/10 bg-ink/95 backdrop-blur sm:top-14">
        <div className="mx-auto max-w-5xl px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", ...Object.keys(CATEGORIES)] as const).map((id) => {
              const active = cat === id;
              const label = id === "all" ? "All" : CATEGORIES[id as ThreadCategory].label;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCat(id as ThreadCategory | "all")}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    active
                      ? "border-acid bg-acid text-ink"
                      : "border-white/15 text-white/55 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-white/10 p-0.5">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    sort === s.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="ml-auto text-[11px] text-white/30">
              {filtered.length} of {threads.length} threads
            </p>
          </div>
        </div>
      </div>

      {/* threads */}
      <div ref={listTopRef} className="mx-auto max-w-5xl px-3 pb-24 pt-4 sm:px-4">
        {/* new-thread composer */}
        {composerOpen && (
          <div className="mb-4 rounded-xl border border-acid/30 bg-panel p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/50">
              Start a new thread
            </p>
            <p className="mt-1 text-xs text-white/35">
              Posting as <span className="font-mono text-acid">{guest}</span> · saved to this
              browser, and a regular usually answers within a minute or two.
            </p>
            <input
              ref={newTitleRef}
              aria-label="Thread title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Thread title. Be specific: genre + the actual question"
              className="mt-3 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-[15px] text-white placeholder:text-white/30 focus:border-acid/60 focus:outline-none"
            />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORIES) as ThreadCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCat(c)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    newCat === c
                      ? "border-acid bg-acid text-ink"
                      : "border-white/15 text-white/55 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {CATEGORIES[c].label}
                </button>
              ))}
            </div>
            <textarea
              aria-label="Thread body"
              rows={5}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="What's the situation? Genre, region, what you've tried, what you're stuck on…"
              className="mt-2.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-[15px] leading-relaxed text-white placeholder:text-white/30 focus:border-acid/60 focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-white/30">
                Blank lines separate paragraphs. Quote lines start with "&gt; ".
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposerOpen(false);
                    setNewTitle("");
                    setNewBody("");
                    setNewCat("start");
                  }}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitThread}
                  disabled={!newTitle.trim() || !newBody.trim()}
                  className="cta rounded-lg bg-acid px-5 py-2.5 text-sm font-black uppercase tracking-wide text-ink disabled:opacity-40"
                >
                  Post thread
                </button>
              </div>
            </div>
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-panel p-10 text-center">
            <p className="font-display text-xl">NO THREADS MATCH.</p>
            <p className="mt-2 text-sm text-white/45">
              The answer is probably in here somewhere. Try different words.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCat("all");
              }}
              className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/70 hover:text-white"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((t) => {
              const category = CATEGORIES[t.category];
              const last = lastPoster(t);
              const hasSolved = t.posts.some((p) => p.solved);
              const hasStaff = t.posts.some((p) => p.staffAnswer);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPostOrder("chrono");
                      setOpenThreadId(t.id);
                    }}
                    className="group w-full rounded-xl border border-white/10 bg-panel p-3.5 text-left transition-colors hover:border-white/25 sm:p-4"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* vote pill */}
                      <div className="hidden w-14 shrink-0 flex-col items-center rounded-lg border border-white/10 bg-black/30 py-2 sm:flex">
                        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden className="fill-white/30">
                          <path d="M6 1.2 11 8.4H1z" />
                        </svg>
                        <span className="tnum mt-1 text-sm font-bold text-white/75">
                          {formatCount(threadVotes(t))}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-white/30">
                          votes
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {t.pinned && <Tag kind="pinned" />}
                          {t.locked && <Tag kind="locked" />}
                          {hasSolved && <Tag kind="solved" />}
                          {hasStaff && !hasSolved && <Tag kind="staff" />}
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              background: `hsl(${category.hue} 45% 18%)`,
                              color: `hsl(${category.hue} 70% 72%)`,
                            }}
                          >
                            {category.label}
                          </span>
                          {t.posts[0].author === "guest" && (
                            <span className="rounded-full bg-acid/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-acid">
                              Yours
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 font-serif text-[16px] font-bold leading-snug text-white group-hover:text-acid sm:text-[17px]">
                          {t.title}
                        </p>
                        <p className="mt-1.5 line-clamp-1 text-[13px] text-white/40">
                          {t.posts[0].body.replace(/\n/g, " ").slice(0, 160)}
                          {t.posts[0].body.length > 160 ? "…" : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/35">
                          <span className="font-bold text-white/55">
                            {t.posts[0].author === "guest" ? guest : t.posts[0].author}
                          </span>
                          <span>{formatForumDate(threadCreated(t))}</span>
                          <span aria-hidden>·</span>
                          <span>
                            <b className="text-white/60">{threadReplies(t)}</b> replies
                          </span>
                          <span aria-hidden>·</span>
                          <span>
                            <b className="text-white/60">{formatCount(t.views)}</b> views
                          </span>
                          <span className="ml-auto flex items-center gap-1.5">
                            {USERS[last] && <Avatar user={USERS[last]} size={18} />}
                            <span className="font-bold text-white/50">
                              {last === "guest" ? guest : last}
                            </span>
                            <span aria-hidden>·</span>
                            <span>{formatForumDate(threadActivity(t))}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ForumFooter onBack={onBack} />
    </div>
  );
}

/* ── shared chrome ───────────────────────────────────────── */

function ForumHeader({
  onBack,
  query,
  setQuery,
}: {
  onBack: () => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-5xl items-center gap-3 px-3 sm:h-14 sm:px-4">
        <a
          href="#top"
          onClick={onBack}
          className="tap-target min-w-0 justify-start font-display text-[0.95rem] tracking-wide text-white sm:text-lg"
        >
          RADIO REACH <span className="text-acid">/ COMMUNITY</span>
        </a>
        <div className="ml-auto flex items-center gap-2">
          <label className="relative ml-auto block">
            <span className="sr-only">Search the archive</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the archive…"
              className="w-36 rounded-lg border border-white/15 bg-black/40 py-2 pl-8 pr-3 text-[13px] text-white placeholder:text-white/30 focus:border-acid/60 focus:outline-none sm:w-64"
            />
            <svg
              viewBox="0 0 16 16"
              width="13"
              height="13"
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 fill-none stroke-white/35"
              strokeWidth="1.6"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3.5 3.5" />
            </svg>
          </label>
          <a
            href="#top"
            onClick={onBack}
            className="cta hidden rounded-lg bg-acid px-3.5 py-2 text-[12px] font-black uppercase tracking-wide text-ink sm:inline-flex"
          >
            Back to the Vault
          </a>
        </div>
      </div>
    </header>
  );
}

function ForumFooter({ onBack }: { onBack: () => void }) {
  return (
    <footer className="border-t border-white/10 bg-black/60 px-3 py-8 sm:px-4">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <a
          href="#top"
          onClick={onBack}
          className="font-display text-lg tracking-wide text-white hover:text-acid"
        >
          ← Back to the RadioReach Vault
        </a>
            <p className="max-w-xl text-[12px] leading-relaxed text-white/35">
              The community archive is moderated by volunteers and kept read-only where it
              matters. Rules are simple: numbers welcome, no blasting, no promo services in
              help threads.
            </p>
            <p className="max-w-xl text-[11px] leading-relaxed text-white/25">
              Concept build: this community archive is a simulated demonstration environment.
              The threads, members, and moderation history are illustrative.
            </p>
      </div>
    </footer>
  );
}
