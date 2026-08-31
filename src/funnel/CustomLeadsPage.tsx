import { useState, type FormEvent } from "react";

const OUTREACH_EMAIL = "zaziediya@gmail.com";
const OUTREACH_SUBJECT = "Custom music industry outreach inquiry";

const deliverables = [
  ["A hand-built prospect map", "We find the people who can actually move your release: indie playlist curators, blogs, tastemakers, sync contacts, promoters, and radio programmers."],
  ["A list that sounds like you", "Every lead is filtered around your genre, city, references, release story, and goals. No bloated spreadsheet of random emails."],
  ["Personalized outreach angles", "Get a short, human opening angle for every priority contact, so your message feels like an introduction—not a blast."],
];

function field(data: FormData, name: string) {
  return String(data.get(name) ?? "").trim();
}

function buildBrief(data: FormData) {
  return [
    "Hi Zazie,",
    "",
    "I'm interested in a personalized music industry contact list and lead-generation plan.",
    "",
    `Name: ${field(data, "name")}`,
    `Email: ${field(data, "email")}`,
    `Artist / project: ${field(data, "artist")}`,
    "",
    "My release and outreach goals:",
    field(data, "goals"),
    "",
    "Please send me the next steps and a quote.",
    "",
    "Thanks!",
  ].join("\r\n");
}

function mailtoHref(subject: string, body: string) {
  return `mailto:${OUTREACH_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function gmailHref(subject: string, body: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(OUTREACH_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function openPrefillEmail(href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function CustomLeadsPage({ onBack }: { onBack: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [composeHref, setComposeHref] = useState("");
  const [gmailComposeHref, setGmailComposeHref] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = buildBrief(data);
    const mail = mailtoHref(OUTREACH_SUBJECT, body);
    const gmail = gmailHref(OUTREACH_SUBJECT, body);
    setComposeHref(mail);
    setGmailComposeHref(gmail);
    openPrefillEmail(mail);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="border-b border-acid/20 bg-acid px-4 py-2 text-center text-[10px] font-black uppercase tracking-[.18em] text-ink sm:text-xs">
        Built for independent artists who are done shouting into the void
      </div>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/95 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button onClick={onBack} className="font-display text-lg tracking-wide">RADIO REACH <span className="text-acid">/ CUSTOM</span></button>
          <button onClick={() => document.getElementById("brief")?.scrollIntoView()} className="cta rounded-lg bg-acid px-4 py-2 text-xs font-black uppercase tracking-wide text-ink">Build my list →</button>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-4 pb-16 pt-14 sm:pb-24 sm:pt-24">
          <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blood/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[.22em] text-acid">The personalized outreach desk</p>
              <h1 className="font-display text-5xl leading-[.94] sm:text-7xl">YOUR NEXT<br /><span className="text-blood">YES</span> ISN’T<br />IN A GENERIC LIST.</h1>
              <p className="mt-6 max-w-xl font-serif text-lg leading-relaxed text-white/70 sm:text-xl">Get a custom music industry contact list and lead-generation plan built around your sound, your story, and the people you actually want to reach.</p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-white/75"><span>✓ Research, not scraping</span><span>✓ Human-first angles</span><span>✓ One-time project</span></div>
              <button onClick={() => document.getElementById("brief")?.scrollIntoView()} className="cta mt-9 rounded-lg bg-acid px-7 py-4 font-display text-lg uppercase tracking-wide text-ink">Get my custom outreach plan <span aria-hidden>→</span></button>
              <p className="mt-3 text-xs text-white/40">Tell us what you’re working on. We’ll reply with fit, scope, and a clear quote.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[.04] p-5 shadow-2xl shadow-black sm:p-7">
              <p className="text-xs font-black uppercase tracking-[.18em] text-white/40">What you receive</p>
              <div className="mt-6 space-y-6">{deliverables.map(([title, body], i) => <div key={title} className="flex gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-acid font-display text-ink">0{i + 1}</span><div><h2 className="font-display text-xl">{title}</h2><p className="mt-1 text-sm leading-relaxed text-white/55">{body}</p></div></div>)}</div>
              <div className="mt-7 border-t border-white/10 pt-5 text-sm text-white/55"><span className="text-acid">→</span> Best for a single, important release—not mass outreach.</div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0e0e12] px-4 py-16 sm:py-20"><div className="mx-auto max-w-5xl"><p className="text-xs font-black uppercase tracking-[.2em] text-blood">A better way to reach people</p><h2 className="mt-3 max-w-3xl font-display text-4xl leading-none sm:text-6xl">MORE RELEVANT CONTACTS.<br /><span className="text-acid">BETTER CONVERSATIONS.</span></h2><div className="mt-10 grid gap-5 md:grid-cols-3">{[["01", "You give us the context", "Genre, location, influences, release date, and the outcome you want."], ["02", "We find the fit", "We research relevant decision-makers and prioritize the people most likely to care."], ["03", "You show up human", "You get a focused list and practical angles for starting the conversation." ]].map(([n,t,b]) => <article key={n} className="border-t-2 border-acid pt-4"><p className="font-mono text-xs text-acid">{n}</p><h3 className="mt-3 font-display text-2xl">{t}</h3><p className="mt-2 text-sm leading-relaxed text-white/55">{b}</p></article>)}</div></div></section>

        <section id="brief" className="px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <p className="text-center text-xs font-black uppercase tracking-[.2em] text-acid">Start with a quick brief</p>
            <h2 className="mt-3 text-center font-display text-4xl sm:text-5xl">LET’S FIND YOUR PEOPLE.</h2>
            {submitted ? (
              <div className="mt-8 rounded-xl border border-acid/50 bg-acid/10 p-8 text-center">
                <p className="font-display text-2xl text-acid">YOUR EMAIL SHOULD BE OPEN.</p>
                <p className="mt-2 text-white/70">
                  We pre-filled a message to {OUTREACH_EMAIL} with your brief. Send it from your email app to start the conversation.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  {composeHref && (
                    <a href={composeHref} className="cta rounded-lg bg-acid px-5 py-3 text-sm font-black uppercase tracking-wide text-ink">
                      Open email app again
                    </a>
                  )}
                  {gmailComposeHref && (
                    <a href={gmailComposeHref} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/20 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:border-acid hover:text-acid">
                      Open in Gmail
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <input name="name" required aria-label="Your name" placeholder="Your name" className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35" />
                <input name="email" required type="email" aria-label="Email address" placeholder="Best email address" className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35" />
                <input name="artist" required aria-label="Artist or project name" placeholder="Artist / project name" className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35" />
                <textarea name="goals" required aria-label="Your goals" rows={4} placeholder="What are you releasing, and who do you want to reach?" className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35" />
                <button type="submit" className="cta w-full rounded-lg bg-acid px-6 py-4 font-display text-lg uppercase tracking-wide text-ink">
                  Send
                </button>
                <p className="text-center text-xs text-white/35">
                  Send opens your email with this brief already addressed to {OUTREACH_EMAIL}.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-white/35"><button onClick={onBack} className="underline hover:text-white">Back to the Radio Reach Vault</button></footer>
    </div>
  );
}
