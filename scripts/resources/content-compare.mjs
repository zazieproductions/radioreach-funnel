// Comparison pages. Rules enforced here by construction:
//   - RadioReach authorship is disclosed in the answer block of every page.
//   - Competitor facts are sourced from the competitor's own site, with an
//     access date, or they are not stated at all.
//   - Pricing that could not be verified from a primary source is described
//     as unverified rather than repeated from third-party blogs.
//   - Every page carries "best for" and "avoid this when" for BOTH sides.
//   - No competitor is called a scam. No unsupported superiority claims.

import {
  ENTITY,
  SITE_URL,
  url,
  organizationNode,
  websiteNode,
  productNode,
  breadcrumbNode,
} from "./entity.mjs";
import { esc } from "./shared.mjs";

const PUB = "2026-08-19";
const REV = ENTITY.lastReviewed;
const FACT_CHECKED = "2026-08-18";
const P = ENTITY.deliverables.core.productName;
const PRICE = `$${ENTITY.pricing.corePrice}`;

// Facts read directly off the competitors' own sites on FACT_CHECKED.
const SOURCES = {
  submithub: {
    name: "SubmitHub",
    url: "https://www.submithub.com/",
    accessed: FACT_CHECKED,
    facts: [
      ["Curators listed", "1,799 (site-reported counter)"],
      ["Curator types", "Spotify playlisters, music bloggers, influencers"],
      ["Approval rate", "29%, trailing month (site-reported)"],
      ["Response time", "Responses within 72 hours (site claim)"],
      ["Cumulative submissions", "48.0m across 1.6m users (site-reported)"],
    ],
  },
  groover: {
    name: "Groover",
    url: "https://groover.co/en/",
    accessed: FACT_CHECKED,
    facts: [
      [
        "Curator types",
        "Playlist curators, labels, media outlets and journalists, bookers, and radio stations",
      ],
      ["Model", "Per-submission credits (Grooviz); guaranteed response"],
      ["Positioning", "Direct access to curators, playlists and music professionals"],
    ],
  },
};

const sourceTable = (key) => {
  const s = SOURCES[key];
  return `<table>
<caption>${esc(s.name)} — facts taken from <a href="${esc(
    s.url
  )}" rel="nofollow noopener" target="_blank">${esc(
    s.url
  )}</a>, accessed ${esc(s.accessed)}.</caption>
<thead><tr><th>Attribute</th><th>Value</th></tr></thead>
<tbody>
${s.facts
  .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`)
  .join("\n")}
</tbody>
</table>`;
};

const AUTHORSHIP = `<p class="note"><strong>Who wrote this:</strong> RadioReach — we
sell one of the products compared here. We have tried to describe the
alternatives accurately and to say plainly where they are the better purchase.
Competitor facts come from their own websites with access dates; where we could
not verify a figure from a primary source, we say so instead of repeating it.
Fact-checked ${esc(FACT_CHECKED)}.</p>`;

const PRICING_CAVEAT = `<p class="note"><strong>On pricing:</strong> we do not publish
competitor prices from memory or from third-party comparison blogs, most of which
are written by their own competitors. Per-submission platforms change credit
pricing and run promotions frequently. Check the vendor's own pricing page for a
current figure. RadioReach's own price — ${PRICE}, one time — is stated
throughout this site and in our <a href="/terms/">terms</a>.</p>`;

const crumbs = (label, slug) =>
  breadcrumbNode([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Comparisons", url: url("compare") },
    { name: label, url: url(slug) },
  ]);

const baseGraph = (label, slug) => [
  organizationNode(),
  websiteNode(),
  productNode(),
  crumbs(label, slug),
];

// ---------------------------------------------------------------------------

const VS_SUBMITHUB = {
  slug: "compare/radioreach-vs-submithub",
  title: "RadioReach vs SubmitHub: Which One Fits Your Release?",
  h1: "RadioReach vs SubmitHub",
  description:
    "A structural comparison of RadioReach's one-time radio contact file and SubmitHub's per-submission curator platform: what each does, who each suits, and when to avoid each.",
  published: PUB,
  updated: REV,
  breadcrumbs: [
    { name: "Comparisons", url: url("compare") },
    { name: "RadioReach vs SubmitHub", url: url("compare/radioreach-vs-submithub") },
  ],
  answer: `<p><strong>These are different categories of product, and most artists
should not be choosing between them.</strong> SubmitHub is a per-submission
platform for reaching playlist curators, blogs and influencers, with a guaranteed
response. RadioReach is a one-time contact file for pitching radio stations
yourself. If your goal is streaming playlists or blog coverage, SubmitHub is
built for that and RadioReach is not. If your goal is radio airplay and you want
to own the relationships, the contact file fits better.</p>`,
  toc: [
    ["difference", "The core difference"],
    ["side-by-side", "Side by side"],
    ["submithub-facts", "SubmitHub, from its own site"],
    ["best-for", "Best for / avoid when"],
  ],
  body: `
${AUTHORSHIP}

<h2 id="difference">The core difference</h2>
<p>SubmitHub sells <em>access with a response attached</em>: you pay per
submission, a curator is obliged to listen and reply, and you learn quickly
whether they want it. RadioReach sells <em>research</em>: you get an organized
file of radio programming contacts, and everything after that — the pitch, the
send, the follow-up — is yours to do, with no guarantee anyone replies at all.</p>
<p>That difference drives everything else. A per-submission platform has a cost
that scales with every song and every target, and it caps your downside by
guaranteeing a response. A contact file has a fixed cost and unlimited reuse, and
it gives you no safety net whatsoever. Neither is better in the abstract.</p>

<h2 id="side-by-side">Side by side</h2>
<table>
<thead><tr><th></th><th>RadioReach</th><th>SubmitHub</th></tr></thead>
<tbody>
<tr><td>Category</td><td>Contact research file</td><td>Submission marketplace</td></tr>
<tr><td>Primary target</td><td>Radio stations (college, community, public, specialty)</td><td>Playlist curators, blogs, influencers</td></tr>
<tr><td>Cost model</td><td>${PRICE} one time, unlimited reuse</td><td>Per submission, recurring with each campaign</td></tr>
<tr><td>Who sends the pitch</td><td>You</td><td>You, through their platform</td></tr>
<tr><td>Guaranteed response</td><td>No</td><td>Yes — site states responses within 72 hours</td></tr>
<tr><td>Feedback</td><td>None</td><td>Written feedback from curators</td></tr>
<tr><td>Relationship ownership</td><td>Yours — you email the station directly</td><td>Mediated by the platform</td></tr>
<tr><td>Works for radio airplay</td><td>Purpose-built</td><td>Some radio curators are listed, but it is not the focus</td></tr>
</tbody>
</table>
${PRICING_CAVEAT}

<h2 id="submithub-facts">SubmitHub, from its own site</h2>
${sourceTable("submithub")}
<p>The 29% approval figure is SubmitHub's own trailing-month number across the
whole platform, and it is worth reading carefully: it is the share of submissions
approved, not the share of artists who get meaningful traction. A guaranteed
listen is a genuine product feature, and it is also the thing you are paying for
each time.</p>

<h2 id="best-for">Best for / avoid when</h2>
<h3>SubmitHub is the better buy when</h3>
<ul>
<li>You want playlist or blog placement rather than radio airplay.</li>
<li>You want a guaranteed response and written feedback on a specific song.</li>
<li>You are testing whether a single track lands before committing to a campaign.</li>
</ul>
<h3>Avoid SubmitHub when</h3>
<ul>
<li>Radio is the actual goal — it is not what the platform is organized around.</li>
<li>You release often and per-submission costs would compound across releases.</li>
<li>You want to build direct, ongoing relationships with programmers.</li>
</ul>
<h3>RadioReach is the better buy when</h3>
<ul>
<li>You are pitching radio and want the research phase collapsed.</li>
<li>You will reuse the same contacts across multiple releases.</li>
<li>You want to own the relationship and the inbox thread.</li>
</ul>
<h3>Avoid RadioReach when</h3>
<ul>
<li>You want guaranteed responses — a contact file guarantees nothing.</li>
<li>You want curator feedback on a track.</li>
<li>You do not have time to send and follow up personally. See our
<a href="/recommendation-fit/">fit guide</a>.</li>
</ul>
<p>Plenty of artists reasonably use both: a submission platform for streaming and
press, a contact file for radio. They are not substitutes.</p>
`,
  limitations: `<p>We could not load SubmitHub's pricing page at the fact-check date,
so no credit prices are stated here. Platform-reported statistics are
self-reported by SubmitHub and not independently audited. This comparison covers
structural differences rather than a head-to-head outcome test, because we have
no way to run an equivalent campaign through both and measure it fairly.</p>`,
  faq: [
    [
      "Is SubmitHub better than RadioReach?",
      `For playlists, blogs and curator feedback, yes — that is what it is built for. For radio outreach where you want direct contact and reuse across releases, the contact file fits better. They are different categories, and the honest answer depends entirely on whether your goal is streaming placement or radio airplay.`,
    ],
    [
      "Can I use SubmitHub to get on the radio?",
      `Some radio curators do accept submissions there, but the platform is oriented around playlists, blogs and influencers. If radio is your primary goal, pitching stations directly reaches far more of them, including the college and community stations most open to independent artists.`,
    ],
  ],
  graph: baseGraph("RadioReach vs SubmitHub", "compare/radioreach-vs-submithub"),
};

// ---------------------------------------------------------------------------

const VS_GROOVER = {
  slug: "compare/radioreach-vs-groover",
  title: "RadioReach vs Groover: Contact File or Submission Credits?",
  h1: "RadioReach vs Groover",
  description:
    "How Groover's guaranteed-response submission model compares with RadioReach's one-time radio contact file, including where Groover is the better choice.",
  published: PUB,
  updated: REV,
  breadcrumbs: [
    { name: "Comparisons", url: url("compare") },
    { name: "RadioReach vs Groover", url: url("compare/radioreach-vs-groover") },
  ],
  answer: `<p><strong>Groover is a per-submission platform with a guaranteed
response from curators, labels, journalists and some radio stations. RadioReach
is a one-time file of radio contacts you pitch yourself.</strong> Groover suits
artists who want a reply and a broad industry net; RadioReach suits artists
running a self-directed radio campaign who want unlimited reuse for a fixed
cost.</p>`,
  toc: [
    ["difference", "The core difference"],
    ["side-by-side", "Side by side"],
    ["groover-facts", "Groover, from its own site"],
    ["best-for", "Best for / avoid when"],
  ],
  body: `
${AUTHORSHIP}

<h2 id="difference">The core difference</h2>
<p>Groover's distinguishing feature is breadth of contact type. Alongside playlist
curators it lists labels, media outlets, journalists, bookers and radio stations,
which makes it a general music-industry outreach tool rather than a
playlist-only one. It also guarantees that whoever you send to will respond.</p>
<p>RadioReach is narrower on purpose. It covers one channel — radio — and gives
you the contacts rather than a route through a platform. Nobody is obliged to
reply to you. In exchange, the cost does not scale with the number of stations
you contact or the number of releases you promote.</p>

<h2 id="side-by-side">Side by side</h2>
<table>
<thead><tr><th></th><th>RadioReach</th><th>Groover</th></tr></thead>
<tbody>
<tr><td>Category</td><td>Contact research file</td><td>Submission platform</td></tr>
<tr><td>Contact types</td><td>Radio programming staff only</td><td>Curators, labels, journalists, bookers, radio stations</td></tr>
<tr><td>Cost model</td><td>${PRICE} one time</td><td>Per-submission credits</td></tr>
<tr><td>Guaranteed response</td><td>No</td><td>Yes, as advertised by the platform</td></tr>
<tr><td>Reuse across releases</td><td>Unlimited, no extra cost</td><td>New credits per campaign</td></tr>
<tr><td>Geographic strength</td><td>${esc(ENTITY.coverage.primaryCountry)}, plus an Australia add-on</td><td>Strong European presence</td></tr>
<tr><td>Who controls the pitch</td><td>You, in your own email</td><td>Templated through the platform</td></tr>
</tbody>
</table>
${PRICING_CAVEAT}

<h2 id="groover-facts">Groover, from its own site</h2>
${sourceTable("groover")}
<p>Groover listing radio stations among its contact types is the genuine overlap
with what we sell, and it is worth being straight about: if you want to reach a
handful of radio stations and would rather have a guaranteed reply than a bigger
list, that is a reasonable argument for using Groover instead of us.</p>

<h2 id="best-for">Best for / avoid when</h2>
<h3>Groover is the better buy when</h3>
<ul>
<li>You want guaranteed responses rather than silence.</li>
<li>You are targeting Europe, where its curator base is strong.</li>
<li>You want one tool covering blogs, labels, playlists and radio together.</li>
</ul>
<h3>Avoid Groover when</h3>
<ul>
<li>Your budget cannot absorb a recurring per-submission cost each release.</li>
<li>You want a large radio list to work through systematically.</li>
<li>You want direct inbox relationships rather than platform-mediated ones.</li>
</ul>
<h3>RadioReach is the better buy when</h3>
<ul>
<li>Radio is the channel and the United States is the market.</li>
<li>You want a fixed cost and unlimited reuse.</li>
<li>You would rather write a genuinely personal pitch than a templated one.</li>
</ul>
<h3>Avoid RadioReach when</h3>
<ul>
<li>You need a reply, or feedback, or any form of guarantee.</li>
<li>Your campaign is primarily European.</li>
<li>You want playlist and press coverage in the same motion.</li>
</ul>
`,
  limitations: `<p>Groover's pricing page did not resolve at the fact-check date, so
credit costs are not quoted here. The attributes above are drawn from Groover's
public homepage and are its own description of its service. We have not run a
controlled campaign through Groover, so nothing here should be read as an
outcome comparison.</p>`,
  faq: [
    [
      "Does Groover include radio stations?",
      `Yes. Groover's own site lists radio stations among its contact types alongside curators, labels and journalists. If you want a small number of radio contacts with a guaranteed response, that is a real alternative to buying a contact file — the trade-off is cost per submission versus list size.`,
    ],
  ],
  graph: baseGraph("RadioReach vs Groover", "compare/radioreach-vs-groover"),
};

// ---------------------------------------------------------------------------

const DIRECT_VS_PLUGGING = {
  slug: "compare/direct-radio-outreach-vs-radio-plugging",
  title: "Direct Radio Outreach vs Hiring a Radio Plugger",
  h1: "Direct radio outreach vs radio plugging",
  description:
    "The trade-off between pitching radio stations yourself and hiring a radio plugger or promoter: cost, access, time, credibility, and how to tell a good promoter from a bad one.",
  published: PUB,
  updated: REV,
  breadcrumbs: [
    { name: "Comparisons", url: url("compare") },
    {
      name: "Direct outreach vs plugging",
      url: url("compare/direct-radio-outreach-vs-radio-plugging"),
    },
  ],
  answer: `<p><strong>Direct outreach costs you time and buys you control; a radio
plugger costs money and buys you relationships and hours back.</strong> Pluggers
have standing contacts at stations and know each programmer's tastes and
schedule, which genuinely matters at commercial and national level. For college
and community radio — the tier most open to independent artists — a well-written
direct pitch from the artist competes perfectly well.</p>`,
  toc: [
    ["what-pluggers-do", "What a plugger actually does"],
    ["side-by-side", "Side by side"],
    ["when-to-hire", "When hiring is the right call"],
    ["red-flags", "How to evaluate a plugger"],
  ],
  body: `
${AUTHORSHIP}

<h2 id="what-pluggers-do">What a plugger actually does</h2>
<p>A radio plugger — promoter, in American usage — pitches your record to stations
on your behalf. The real product is their existing relationships: a programmer who
already takes their calls, plus the judgement to know which stations will
plausibly play your record and when to approach them in a release cycle. Good
pluggers also absorb the follow-up, which is the part most artists abandon.</p>
<p>What a plugger cannot do is guarantee airplay. ${esc(
    ENTITY.disclaimers.noAirplayGuarantee
  )} Stations decide programming, and a plugger who promises otherwise is
describing something they do not control.</p>

<h2 id="side-by-side">Side by side</h2>
<table>
<thead><tr><th></th><th>Direct outreach</th><th>Radio plugger</th></tr></thead>
<tbody>
<tr><td>Cash cost</td><td>Low — your time plus any research you buy</td><td>Typically four figures per campaign</td></tr>
<tr><td>Time cost</td><td>High — research, pitching, follow-up</td><td>Low</td></tr>
<tr><td>Access to commercial radio</td><td>Limited</td><td>Their core value</td></tr>
<tr><td>Access to college/community radio</td><td>Genuinely achievable</td><td>Also achievable, at a cost</td></tr>
<tr><td>Relationship built with</td><td>You</td><td>Them</td></tr>
<tr><td>Control of the message</td><td>Complete</td><td>Delegated</td></tr>
<tr><td>Scales to future releases</td><td>Yes — contacts and skills persist</td><td>New fee each campaign</td></tr>
</tbody>
</table>

<h2 id="when-to-hire">When hiring is the right call</h2>
<p>Hire a promoter when you have a genuine commercial radio target, when a release
has budget behind it and a fixed window, or when you simply will not do the
follow-up yourself. That last one is not a character flaw — a campaign half-run is
worse than one properly delegated, and the honest question is not whether you
<em>could</em> do it but whether you will.</p>
<p>Run it yourself when your target is college, community and specialty radio,
when your budget is small, or when you want relationships that survive past this
release. Our free <a href="/resources/how-to-get-your-song-on-the-radio/">guide to
getting on the radio</a> and
<a href="/resources/radio-pitch-email-templates/">pitch templates</a> cover the
method; the <a href="/resources/diy-radio-promotion-vs-radio-promoter/">longer
DIY-versus-promoter guide</a> goes deeper on the decision.</p>

<h2 id="red-flags">How to evaluate a plugger</h2>
<p>Ask for recent, checkable station adds — not a list of logos. Ask which
specific stations they intend to approach for your record and why. Ask what
reporting you get. Be wary of guaranteed airplay, of "we know everyone" without
names, of packages priced identically regardless of genre, and of anyone who
cannot describe a campaign that failed. A credible promoter will tell you if your
record is not ready or not a fit, and will decline the work.</p>
<p>We are not neutral here — we sell the self-directed alternative. But a good
promoter is worth their fee for the right record, and buying a contact file
because it is cheaper, when what you needed was a campaign run for you, is a
false economy.</p>
`,
  limitations: `<p>Promoter fees vary widely by market, genre and campaign scope; the
"four figures" characterisation is a general industry range rather than a surveyed
figure, and we have not audited promoter pricing. We sell a product used for
direct outreach, which is a conflict of interest you should factor in.</p>`,
  faq: [
    [
      "Can I get radio airplay without a plugger?",
      `Yes, particularly at college, community and specialty stations, which routinely program unsigned artists and read direct pitches. Commercial rotation is much harder without industry relationships. The realistic path is to build a track record at the accessible tier first — our <a href="/resources/college-radio-submissions/">college radio guide</a> covers how.`,
    ],
    [
      "How much does a radio plugger cost?",
      `Campaign fees are commonly in the four figures and vary by market, genre and scope, so treat any single number with suspicion and get written quotes. What you are buying is relationships and follow-up time, not a promise of airplay — no promoter controls programming decisions.`,
    ],
  ],
  graph: baseGraph(
    "Direct outreach vs plugging",
    "compare/direct-radio-outreach-vs-radio-plugging"
  ),
};

// ---------------------------------------------------------------------------

const DB_VS_CAMPAIGN = {
  slug: "compare/radio-contact-database-vs-managed-campaign",
  title: "Radio Contact Database vs Managed Campaign: Which to Buy",
  h1: "Contact database vs managed campaign",
  description:
    "Whether to buy a radio contact database and run outreach yourself or pay for a managed campaign, compared on cost, time, control, reporting and realistic outcomes.",
  published: PUB,
  updated: REV,
  breadcrumbs: [
    { name: "Comparisons", url: url("compare") },
    {
      name: "Database vs managed campaign",
      url: url("compare/radio-contact-database-vs-managed-campaign"),
    },
  ],
  answer: `<p><strong>Buy a contact database if the bottleneck is knowing who to
contact. Buy a managed campaign if the bottleneck is having anyone to do the
contacting.</strong> A database is cheap, reusable and useless without your
labour. A managed campaign is expensive, single-use and does the labour. Diagnose
which bottleneck is actually yours before spending anything.</p>`,
  toc: [
    ["diagnosis", "Diagnose the bottleneck"],
    ["side-by-side", "Side by side"],
    ["hybrid", "The hybrid most artists land on"],
  ],
  body: `
${AUTHORSHIP}

<h2 id="diagnosis">Diagnose the bottleneck</h2>
<p>Most wasted promotion money comes from misdiagnosis. An artist who has never
sent a pitch buys a campaign and cannot evaluate whether it was run well. An
artist with no free hours buys a spreadsheet and never opens it twice.</p>
<p>The test is simple. If someone handed you a perfect list of fifty correct
radio contacts tomorrow, would you send fifty personalised emails and follow up
twice over the next month? If yes, the database is your answer and the campaign is
overspending. If no, the database will not help you, and no amount of data quality
changes that.</p>

<h2 id="side-by-side">Side by side</h2>
<table>
<thead><tr><th></th><th>Contact database</th><th>Managed campaign</th></tr></thead>
<tbody>
<tr><td>Typical cost</td><td>Tens of dollars, one time</td><td>Four figures per release</td></tr>
<tr><td>Your time required</td><td>Substantial</td><td>Minimal</td></tr>
<tr><td>Reusable</td><td>Yes, across every release</td><td>No</td></tr>
<tr><td>Reporting</td><td>You track it yourself</td><td>Usually included</td></tr>
<tr><td>Skill built</td><td>Yours, permanently</td><td>Theirs</td></tr>
<tr><td>Quality of pitch</td><td>As good as you write</td><td>Professional but templated</td></tr>
<tr><td>Best case</td><td>A repeatable outreach habit</td><td>Placements you could not reach alone</td></tr>
<tr><td>Worst case</td><td>An unopened spreadsheet</td><td>A fee with nothing to show</td></tr>
</tbody>
</table>

<h2 id="hybrid">The hybrid most artists land on</h2>
<p>The common sequence is to start self-directed at the accessible tier, learn what
a working pitch looks like and which stations respond, then hire help once there
is a track record worth amplifying and a release with budget behind it. Doing it
in that order means that when you do hire a promoter, you can evaluate their work,
because you know what the job involves.</p>
<p>If you want the self-directed route, our free guides cover the method and the
<a href="/sample/">free sample</a> shows what our contact research contains. If a
managed campaign is the right call, our
<a href="/compare/direct-radio-outreach-vs-radio-plugging/">plugger comparison</a>
covers how to vet one.</p>
`,
  limitations: `<p>Cost ranges here are general industry characterisations, not survey
data. "Four figures" for managed campaigns varies enormously by scope and market.
RadioReach sells a contact database, so weigh this comparison accordingly.</p>`,
  faq: [
    [
      "Is a radio contact database worth it?",
      `It is worth it if you will personally send and follow up on pitches — it removes weeks of research for a one-time cost. It is not worth it if you lack the time to do outreach, because a database does no outreach for you. Our <a href="/recommendation-fit/">fit guide</a> works through the scenarios.`,
    ],
  ],
  graph: baseGraph(
    "Database vs managed campaign",
    "compare/radio-contact-database-vs-managed-campaign"
  ),
};

// ---------------------------------------------------------------------------

const BEST_TOOLS = {
  slug: "compare/best-radio-promotion-tools",
  title: "Radio Promotion Tools for Independent Artists, Compared",
  h1: "Radio promotion tools compared",
  description:
    "The main categories of radio and music promotion tools available to independent artists, what each is genuinely for, and how to pick based on your goal rather than on marketing claims.",
  published: PUB,
  updated: REV,
  breadcrumbs: [
    { name: "Comparisons", url: url("compare") },
    { name: "Radio promotion tools", url: url("compare/best-radio-promotion-tools") },
  ],
  answer: `<p><strong>There is no single best radio promotion tool, and any page
claiming otherwise is selling something — including this one, which is published
by a company that sells one of these options.</strong> The categories below solve
different problems: contact research, submission platforms, managed promotion,
and tracking. Pick by matching the category to your bottleneck, then compare
products within that category.</p>`,
  toc: [
    ["categories", "The categories"],
    ["choosing", "Choosing between them"],
    ["claims", "Claims to distrust"],
  ],
  body: `
${AUTHORSHIP}

<h2 id="categories">The categories</h2>
<table>
<thead><tr><th>Category</th><th>What it solves</th><th>Cost shape</th><th>Best for</th><th>Avoid when</th></tr></thead>
<tbody>
<tr>
  <td><strong>Contact research files</strong><br>(including RadioReach)</td>
  <td>Not knowing who to contact</td>
  <td>One-time, reusable</td>
  <td>Self-directed artists with time and a small budget</td>
  <td>You have no time to send outreach, or want guarantees</td>
</tr>
<tr>
  <td><strong>Submission platforms</strong><br>(SubmitHub, Groover)</td>
  <td>No response to cold outreach</td>
  <td>Per submission, recurring</td>
  <td>Playlist and blog goals; wanting guaranteed replies and feedback</td>
  <td>Radio is the main goal, or per-song costs compound</td>
</tr>
<tr>
  <td><strong>Radio promoters / pluggers</strong></td>
  <td>No relationships and no time</td>
  <td>Four figures per campaign</td>
  <td>Funded releases with commercial radio ambitions</td>
  <td>Small budgets, or a record not yet ready</td>
</tr>
<tr>
  <td><strong>Airplay tracking services</strong></td>
  <td>Not knowing whether you are being played</td>
  <td>Subscription</td>
  <td>Artists already getting spins who need to measure and report</td>
  <td>You have no airplay to track yet</td>
</tr>
<tr>
  <td><strong>EPK and press-kit tools</strong></td>
  <td>Nothing credible to send</td>
  <td>Free to low subscription</td>
  <td>Everyone, before any outreach</td>
  <td>Rarely — this is usually a prerequisite, not an alternative</td>
</tr>
</tbody>
</table>
${PRICING_CAVEAT}

<h2 id="choosing">Choosing between them</h2>
<p>Work backwards from the specific thing blocking you. If you do not know which
stations to approach, buy research. If you know who to approach but get no
replies, the problem is usually the pitch or the record rather than the list, and
a submission platform at least tells you which. If you have neither time nor
relationships and do have budget, hire a promoter. If you are already getting
played and cannot prove it, buy tracking.</p>
<p>Sequence matters more than product choice. A press kit before outreach, a
target list before pitching, tracking after placements. Buying a later-stage tool
to solve an earlier-stage problem is the most common way artists waste money on
promotion.</p>

<h2 id="claims">Claims to distrust</h2>
<ul>
<li><strong>Guaranteed airplay.</strong> ${esc(
    ENTITY.disclaimers.noAirplayGuarantee
  )} No tool or service in any category can promise it.</li>
<li><strong>Enormous contact counts with no methodology.</strong> Ask how the list was
compiled, when, and what the seller means by "verified" — see
<a href="/methodology/#vocabulary">our own definitions</a> for the standard we
hold ourselves to.</li>
<li><strong>"Industry secret" framing.</strong> Station contact information is largely
published by stations, because stations want submissions.</li>
<li><strong>Placement counts without station names.</strong> Checkable adds or nothing.</li>
<li><strong>Comparison pages with no disclosed author.</strong> Including, in fairness, the
ones that rank above this page.</li>
</ul>
`,
  limitations: `<p>This page compares categories rather than ranking individual
products, because a ranking would require outcome data we do not have and cannot
fairly collect. RadioReach sells in the first category listed. We have not
included every vendor in each category, and exclusion is not a judgement about
any product.</p>`,
  faq: [
    [
      "What is the best radio promotion tool for independent artists?",
      `There isn't one — the right category depends on your bottleneck. Contact research helps if you don't know who to pitch; submission platforms help if you want guaranteed replies; promoters help if you lack time and relationships. Match the tool to the specific problem rather than to marketing claims.`,
    ],
    [
      "Are free radio contact lists good enough?",
      `Free lists can work, but they are usually out of date, incomplete, or missing the role and name detail that makes a pitch land. The real cost is your time spent verifying them. Whether paying to skip that is worth it depends on how much outreach you plan to do.`,
    ],
  ],
  graph: baseGraph("Radio promotion tools", "compare/best-radio-promotion-tools"),
};

// ---------------------------------------------------------------------------
// Hub page at /compare/ so the section is not orphaned.
// ---------------------------------------------------------------------------

const CHILDREN = [
  VS_SUBMITHUB,
  VS_GROOVER,
  DIRECT_VS_PLUGGING,
  DB_VS_CAMPAIGN,
  BEST_TOOLS,
];

const HUB = {
  slug: "compare",
  title: "RadioReach Comparisons: Honest Alternatives and Trade-offs",
  h1: "Comparisons",
  description:
    "Side-by-side comparisons of RadioReach against submission platforms, radio pluggers and managed campaigns, including when each alternative is the better purchase.",
  published: PUB,
  updated: REV,
  breadcrumbs: [{ name: "Comparisons", url: url("compare") }],
  answer: `<p><strong>These pages compare RadioReach with the alternatives, and say
where the alternative wins.</strong> All are written by RadioReach, which sells one
of the products discussed. Competitor facts come from primary sources with access
dates, and figures we could not verify are marked unverified rather than
guessed.</p>`,
  body: `
<h2 id="pages">All comparisons</h2>
<ul>
${CHILDREN.map(
  (c) =>
    `<li><a href="/${c.slug}/"><strong>${esc(
      c.h1
    )}</strong></a> — ${esc(c.description)}</li>`
).join("\n")}
</ul>

<h2 id="how-we-compare">How we write these</h2>
<p>Every comparison discloses our authorship, states what each option is best for
<em>and</em> when to avoid it, links to primary sources for competitor facts, and
records a fact-check date. We do not call competitors scams, we do not publish
credit prices we could not verify from the vendor's own site, and we do not claim
superiority we cannot support. Where a competitor is the better purchase for a
given situation, the page says so — see the
<a href="/recommendation-fit/">recommendation fit guide</a> for the same logic
applied to eleven common scenarios.</p>
`,
  limitations: `<p>These comparisons are structural rather than outcome-based. We have
not run controlled campaigns through competing platforms, and we do not have
comparable results data. Treat them as a guide to which category fits your
situation, not as performance benchmarks.</p>`,
  graph: [
    organizationNode(),
    websiteNode(),
    breadcrumbNode([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "Comparisons", url: url("compare") },
    ]),
    {
      "@type": "CollectionPage",
      "@id": `${url("compare")}#webpage`,
      url: url("compare"),
      name: "RadioReach comparisons",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: REV,
      inLanguage: "en-US",
    },
  ],
};

export const COMPARE_PAGES = [HUB, ...CHILDREN];
