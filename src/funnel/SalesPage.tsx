import { useState } from "react";
import {
  Check,
  Cross,
  ExitIntent,
  FlipClock,
  LiveViewers,
  SectionLabel,
  Stars,
  StickyBar,
  StockBar,
  Ticker,
  TopNav,
} from "./ui";
import TerminalPreview from "./TerminalPreview";

import { TESTIMONIALS } from "./testimonials";

const FAQS = [
  [
    "Is this just a scraped list off Google?",
    "No. 10,372 of the emails are individually verified deliverable addresses tied to a real human — program directors, music directors, and station decision-makers. The remaining entries include station lines and city data. If it were scraped you'd be paying $0 and getting bounces.",
  ],
  [
    "What format do I get?",
    "Instant download: a 400+ page organized PDF plus the city-sorted contact tables. Works on any device. No software, no subscription, no monthly fee that quietly renews.",
  ],
  [
    "Will this get me played on the radio?",
    "The database gets you in the room. Your music and your pitch close it. This is meant for targeted, relevant, human outreach — not spam. Be personal. Be respectful. That's what works.",
  ],
  [
    "Why is it $20 when competitors charge $400?",
    "Because enterprise data vendors sell to corporate marketing teams on annual contracts with a sales call attached. I'm an independent artist. I built this because I had to do the research myself and refuse to gatekeep it. $20 is the launch rate — it goes to $49 once the founder slots are gone.",
  ],
  [
    "What if it's not for me?",
    "You get 30 days. Email me, tell me it didn't help, and I'll refund you. I'd rather have your respect than your $20.",
  ],
];

export default function SalesPage({ onCta }: { onCta: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div id="top" className="min-h-screen bg-ink pb-32">
      <ExitIntent onTake={onCta} />
      <StickyBar onCta={onCta} />

      {/* alert bar */}
      <div className="bg-blood">
        <p className="mx-auto max-w-5xl px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.16em]">
          Founder pricing ends when the timer hits zero
        </p>
      </div>

      <TopNav onCta={onCta} />
      <Ticker />

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src="/images/studio-1280.jpg"
          srcSet="/images/studio-640.jpg 640w, /images/studio-1280.jpg 1280w"
          sizes="100vw"
          alt=""
          aria-hidden
          width={1280}
          height={853}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          onError={(e) => (e.currentTarget.style.display = "none")}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
        <div className="relative mx-auto max-w-4xl px-4 pt-8 pb-12 text-center sm:pt-10 sm:pb-14">
          <p className="mx-auto mb-5 inline-block border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
            For unsigned artists, producers &amp; podcasters who are done being ignored
          </p>

          <h1 className="font-display text-4xl leading-[0.95] sm:text-6xl md:text-7xl">
            "WHO DO I EVEN <span className="text-blood">SEND</span> IT TO?"
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-serif text-lg leading-relaxed text-white/80 sm:text-2xl">
            You finished the record. You mixed it, mastered it, bled on it — and then it died in a{" "}
            <span className="font-semibold text-white">generic submission form</span>. Here are{" "}
            <span className="text-acid font-bold">18,000+ radio station contacts</span> organized by station, location, role, phone, and email to skip the form entirely.
          </p>

          {/* CTA box */}
          <div className="mt-8 mx-auto max-w-md rounded-xl border-2 border-acid/50 bg-black/60 p-5 text-left backdrop-blur">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blood">
              Founder price locks in for:
            </p>
            <div className="mt-2 flex justify-center">
              <FlipClock seconds={897} />
            </div>
            <div className="mt-4">
              <StockBar />
            </div>
            <button
              onClick={onCta}
              className="cta mt-5 w-full rounded-lg bg-acid px-5 py-4 font-display text-xl uppercase leading-tight tracking-wide text-ink"
            >
              Yes — Give Me The Contacts
              <span className="mt-0.5 block text-[11px] font-sans font-bold tracking-normal">
                Instant download · <span className="line-through opacity-60">$49</span> $20 today
              </span>
            </button>
            <div className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-white/45">
              🔒 Secure checkout via Stripe · Instant digital access · No account required
            </div>
            <p className="mt-1 text-center text-[10px] text-white/30">
              30-day refund guarantee · One-time payment
            </p>
          </div>

          {/* Terminal preview */}
          <div className="mt-10 w-full">
            <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
              ↓ live sample — 7 of 18,020 entries
            </p>
            <TerminalPreview onCta={onCta} />
          </div>

          <div className="mt-7 flex flex-col items-center gap-2">
            <LiveViewers />
            <p className="text-[12px] text-white/45">
              <Stars /> 4.9 average from <b className="text-white/70">1,940+</b> independent artists
            </p>
          </div>
        </div>
      </section>

      {/* THE PROBLEM — agitation */}
      <section className="border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-14">
          <SectionLabel>Let's be honest about what's happening</SectionLabel>
          <h2 className="font-display text-3xl leading-tight sm:text-5xl">
            THE GAP ISN'T TALENT. <br />
            <span className="text-blood">IT'S THE CONTACT LIST.</span>
          </h2>
          <div className="mt-6 space-y-4 font-serif text-lg leading-relaxed text-white/75">
            <p>
              Somewhere tonight, an artist with half your ability is getting spun on a station in a city
              they've never visited. Not because their song is better. Because someone{" "}
              <span className="hl font-semibold text-white">handed them a phone number.</span>
            </p>
            <p>
              Meanwhile you're on page 6 of Google at 2am, copying station names into a spreadsheet,
              guessing at email formats, firing your life's work into <code className="rounded bg-black/60 px-1.5 py-0.5 text-acid">info@</code>{" "}
              inboxes that a 19-year-old intern clears every Friday without opening.
            </p>
            <p className="text-white/90">
              That's not a marketing problem. That's an <b>access</b> problem. And access is the one thing
              that can be handed to you.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-blood/40 bg-blood/5 p-5">
              <p className="mb-3 font-display text-xl text-blood">WITHOUT THE VAULT</p>
              <ul className="space-y-2.5 text-[15px]">
                <Cross>6+ months of manual research per campaign</Cross>
                <Cross>$29–$79/mo submission platforms that "forward" your track</Cross>
                <Cross>Generic info@ inboxes, zero names, zero replies</Cross>
                <Cross>Bouncing emails from lists nobody ever verified</Cross>
                <Cross>Watching your release cycle die in 3 weeks</Cross>
              </ul>
            </div>
            <div className="rounded-lg border border-acid/50 bg-acid/5 p-5">
              <p className="mb-3 font-display text-xl text-acid">WITH THE VAULT</p>
              <ul className="space-y-2.5 text-[15px]">
                <Check>18,000+ entries, ready in the next 90 seconds</Check>
                <Check>Organized by station, location, role, phone, and email</Check>
                <Check>Program &amp; music directors — the people who decide</Check>
                <Check>Sorted city by city so you start where you're strongest</Check>
                <Check>Named decision-makers, so your email starts with "Hi [name]"</Check>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MECHANISM */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <SectionLabel>The mechanism</SectionLabel>
        <h2 className="font-display text-3xl leading-tight sm:text-5xl">
          WHY <span className="hl">CITY-BY-CITY</span> BEATS SPRAY-AND-PRAY
        </h2>
        <p className="mt-4 max-w-2xl font-serif text-lg text-white/70">
          Major-market stations are drowning in label submissions. Local stations are actively looking for
          local talent to champion. Sorting the database by city turns a cold list into a warm ladder:
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["01", "START LOCAL", "Pitch your hometown stations first. You're not a stranger — you're the local act. Warmest leads on earth."],
            ["02", "PITCH YOUR ROUTE", "Email every station in a tour city 3 weeks before the date. Spins + interviews + ticket sales, stacked."],
            ["03", "STACK CREDITS", "Regional airplay is proof. Proof opens bigger markets. Bigger markets open doors labels pretend are locked."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-lg border border-white/10 bg-panel p-5">
              <span className="font-display text-4xl text-acid/30">{n}</span>
              <p className="mt-2 font-display text-xl">{t}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT'S INSIDE / STACK */}
      <section id="inside" className="border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <SectionLabel>Everything you get today</SectionLabel>
          <h2 className="font-display text-3xl leading-tight sm:text-5xl">
            THE RADIO REACH VAULT
          </h2>
          <div className="mt-8 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {[
              ["18,000+ radio station entries", "Program directors, music directors, decision-makers.", "$297"],
              ["Detailed contact information", "Organized by station, location, role, phone, and email.", "$149"],
              ["400+ page organized document", "Direct access to the gatekeepers, in one file.", "$97"],
              ["City-by-city organization", "Start local, expand along your tour route.", "$79"],
              ["Lifetime file access", "No subscription. No renewal. No monthly bleed.", "$120"],
            ].map(([t, d, v]) => (
              <div key={t} className="flex items-start gap-4 p-4">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-acid text-[13px] font-black text-ink">
                  ✓
                </span>
                <div className="flex-1">
                  <p className="font-bold">{t}</p>
                  <p className="text-[14px] text-white/55">{d}</p>
                </div>
                <span className="shrink-0 font-display text-lg text-white/45 line-through decoration-blood">{v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-acid/10 p-4">
              <span className="font-display text-lg uppercase">Total real value</span>
              <span className="font-display text-2xl text-white/50 line-through decoration-blood decoration-2">$742</span>
            </div>
            <div className="flex items-center justify-between bg-acid p-4 text-ink">
              <span className="font-display text-lg uppercase">Your price right now</span>
              <span className="font-display text-3xl">$20</span>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-black/40 p-5 text-[15px] leading-relaxed text-white/70">
            <b className="text-white">The math nobody wants you to do:</b> professional radio databases from
            enterprise data providers run <span className="text-blood font-bold">$300–$500/year</span> and are
            built for corporate marketing departments. This is the same caliber of data — 18,000+ contacts,
            10K+ verified emails — for <span className="text-acid font-bold">$20</span>. That's{" "}
            <b className="text-white">0.11¢ per contact.</b> Priced for someone currently deciding between a
            mastering session and groceries. I know, because I was.
          </div>

          <button
            onClick={onCta}
            className="cta mt-7 w-full rounded-lg bg-acid px-5 py-5 font-display text-xl uppercase tracking-wide text-ink sm:text-2xl"
          >
            Claim The Radio Reach Vault For $20 →
          </button>
          <p className="mt-2 text-center text-[12px] text-white/40">
            73% off · price returns to $49 when the timer expires · instant download
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="proof" className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <SectionLabel>Receipts</SectionLabel>
        <h2 className="font-display text-3xl leading-tight sm:text-5xl">
          ARTISTS WHO STOPPED WAITING
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-xl border border-white/10 bg-panel p-6">
              <div className="flex items-center justify-between gap-3">
                <Stars />
                {t.verified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400/80">
                    <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-green-500 text-[8px] text-black">
                      ✓
                    </span>
                    {t.verified}
                  </span>
                )}
              </div>
              <blockquote className="mt-3 font-serif text-[16px] leading-relaxed text-white/80">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
                <img
                  src={t.photo}
                  alt=""
                  aria-hidden
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                  className="h-11 w-11 shrink-0 rounded-full bg-white/5 object-cover ring-2 ring-acid/40"
                />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold">{t.name}</p>
                  <p className="truncate text-[12px] text-white/50">{t.role}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-acid/15 px-3 py-1 text-[11px] font-bold text-acid">
                  {t.stat}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="font-display text-3xl sm:text-4xl">THIS IS FOR YOU IF…</h2>
          <ul className="mt-6 grid gap-3 text-[16px] sm:grid-cols-2">
            <Check>You're an independent musician with a release to pitch</Check>
            <Check>You're a podcaster chasing syndication or features</Check>
            <Check>You're sick of monthly platforms that deliver nothing</Check>
            <Check>You want to start outreach today, not in six months</Check>
          </ul>
          <p className="mt-8 border-l-2 border-blood pl-4 text-[15px] text-white/55">
            <b className="text-white">This is NOT for you if</b> you plan to blast 18,000 identical emails.
            That's spam, it burns the wells for everyone, and it won't work. Targeted. Relevant. Human.
            Personal. Respectful. That's the deal.
          </p>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border-2 border-acid/40 bg-gradient-to-b from-acid/10 to-transparent p-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-acid font-display text-2xl text-acid">
            30
          </div>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">THE "I'LL EAT THE COST" GUARANTEE</h2>
          <p className="mt-3 font-serif text-lg text-white/75">
            Download it. Open it. Check the emails against your own research. If you decide it wasn't worth
            $20, email me inside 30 days and I'll refund you — and you can keep the file. I'm an independent
            artist too. I'd rather you make it than hold your money hostage.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pb-12 sm:pb-16">
        <SectionLabel>Objections, handled</SectionLabel>
        <h2 className="font-display text-3xl sm:text-4xl">QUESTIONS YOU'RE ABOUT TO ASK</h2>
        <div className="mt-6 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-panel">
          {FAQS.map(([q, a], i) => {
            const isOpen = openFaq === i;
            return (
              <div key={q}>
                <h3>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-btn-${i}`}
                    className="pressable flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-white/5"
                  >
                    <span className="font-bold">{q}</span>
                    <span aria-hidden className="shrink-0 font-display text-xl leading-none text-acid">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-btn-${i}`}
                  hidden={!isOpen}
                >
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-white/65">{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-white/10 bg-gradient-to-b from-blood/20 to-ink">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-display text-4xl leading-[0.95] sm:text-6xl">
            TWO ROADS. <span className="text-acid">PICK ONE.</span>
          </h2>
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/40 p-5">
              <p className="font-display text-xl text-white/50">ROAD A</p>
              <p className="mt-2 text-[15px] text-white/55">
                Close this tab. Go back to Google. Spend the next six months building a worse list by hand
                while your release gets colder. Pay $49 if you come back.
              </p>
            </div>
            <div className="rounded-lg border-2 border-acid bg-acid/10 p-5">
              <p className="font-display text-xl text-acid">ROAD B</p>
              <p className="mt-2 text-[15px] text-white/80">
                Pay $20 — less than a streaming subscription. Open the file in 90 seconds. Email 20
                real music directors in your city tonight. Wake up to replies.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <FlipClock seconds={897} />
          </div>
          <button
            onClick={onCta}
            className="cta mt-6 w-full rounded-lg bg-acid px-6 py-5 font-display text-2xl uppercase tracking-wide text-ink sm:text-3xl"
          >
            Give Me Instant Access — $20
          </button>
          <p className="mt-3 text-[12px] text-white/40">
            Secure checkout · Instant download · 30-day refund · No subscription, ever
          </p>
        </div>
      </section>

      {/* FTC DISCLAIMER */}
      <section className="border-t border-white/10 bg-black/60 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-panel p-6 text-[12px] leading-relaxed text-white/40">
          <p className="mb-2 font-bold uppercase tracking-widest text-white/60">
            FTC Disclaimer &amp; Legal Notice
          </p>
          <p className="mb-3">
            <b className="text-white/55">Results are not guaranteed or typical.</b> The testimonials, case
            studies, and examples shown on this page are individual experiences of real customers. They are
            not intended to represent or guarantee that anyone will achieve the same or similar results.
            Individual outcomes will vary based on your music, your pitch quality, your genre, your target
            market, and many other factors entirely outside our control.
          </p>
          <p className="mb-3">
            <b className="text-white/55">Contact data accuracy &amp; changes over time.</b> This database
            was compiled and verified at a point in time. Radio station contacts, program directors, music
            directors, and email addresses change regularly due to staff turnover, station ownership
            changes, format shifts, and station closures. We cannot guarantee that every contact or email
            in this database is currently accurate, active, or deliverable at the time of your purchase or
            use. You are purchasing a research resource, not a live-updated service. We strongly recommend
            verifying contacts before outreach and using the data as a starting point, not a guaranteed
            deliverable list.
          </p>
          <p className="mb-3">
            <b className="text-white/55">No income or airplay guarantee.</b> Purchasing this product does
            not guarantee radio airplay, interviews, playlist placements, increased streams, ticket sales,
            record deals, or income of any kind. Any reference to earning potential or airplay outcomes is
            illustrative only.
          </p>
          <p>
            <b className="text-white/55">Spam &amp; CAN-SPAM compliance.</b> This database is intended
            solely for personal, targeted, relevant outreach. You are solely responsible for ensuring your
            use of this data complies with the CAN-SPAM Act, GDPR, CASL, and any other applicable laws in
            your jurisdiction. Mass automated emailing is expressly prohibited.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-[11px] leading-relaxed text-white/30">
        <p className="mx-auto max-w-2xl">
          This product is a contact database intended for targeted, relevant, human outreach.
          Do not use this data for automated spam.
        </p>
        <p className="mt-3">© {new Date().getFullYear()} Radio Reach Vault. All rights reserved.</p>
      </footer>
    </div>
  );
}
