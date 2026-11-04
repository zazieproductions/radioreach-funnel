// Sync licensing and film-scoring path for independent artists.
// Sits next to the radio playbooks: same audience, adjacent revenue.
//
// Every outbound editorial URL comes from src/config/sister-sites.json via
// SISTER — see docs/backlink-strategy.md before adding another one.

import { SISTER } from "./shared.mjs";

export const SYNC_PAGES = [
  {
    slug: "sync-licensing-for-independent-artists",
    category: "strategy",
    title: "Sync Licensing and Film Scoring for Independent Artists",
    h1: "Sync licensing and film scoring for independent artists",
    breadcrumbLabel: "Sync & scoring",
    cardTitle: "Sync Licensing and Film Scoring",
    card: "Cue libraries, composer reels, deliverables, and metadata — how instrumental artists get paid outside airplay.",
    description:
      "How independent artists get music into film, TV, and games: cue libraries, composer portfolios, deliverables, metadata, and where horror and art-house fits.",
    published: "2026-11-04",
    updated: "2026-11-04",
    ctaContext: "your sync pitch",
    related: [
      "electronic-press-kit-radio",
      "how-to-get-your-song-on-the-radio",
      "diy-radio-promotion-vs-radio-promoter",
    ],
    mentions: [
      {
        "@type": "CreativeWork",
        name: "Zazie Productions — horror and art-house score archive",
        url: SISTER.url,
      },
    ],
    faq: [
      [
        "Do I need a publisher or sync agent to license my music?",
        "No — plenty of independent placements happen directly between an artist and a filmmaker or a small production company. What you do need is clean paperwork: a one-page license agreement, confirmation that you control both the master and the publishing share, and a walk-away price. Agents and libraries earn their percentage by bringing repeat buyers and handling the back-and-forth, which matters more once you have a catalog worth representing.",
      ],
      [
        "What does a sync license usually pay an independent artist?",
        "For independent film, student projects, and small-brand work, fees commonly land anywhere from a few hundred dollars to a few thousand for a festival-and-festival-only license — and plenty of micro-budget placements pay little or nothing in cash for the exposure and the credit. Broadcast, national advertising, and theatrical releases sit in a different range entirely. Price the term, territory, and media you are actually granting, and put an expiration on any discount.",
      ],
      [
        "Can I license a song that samples another record?",
        "Not cleanly. A sample requires clearance from both the master owner and the publisher of the underlying composition, and most music supervisors will not run that risk on a tight schedule. Keep a sample-free version of any track you intend to pitch for sync — it doubles as the safest thing to send when a supervisor asks for an alternate.",
      ],
      [
        "Does sync work replace radio promotion?",
        "No, they do different jobs. Radio builds a story in a market and puts your name in front of listeners; sync puts your recording into a scene that travels to festivals, streaming, and broadcast. Artists who do both can cite one in the pitch for the other — airplay is credibility on a one-sheet, and a placement is a fact a radio host can read into a microphone.",
      ],
    ],
    body: `
<p>Radio and sync are the two halves of the same sentence: someone with a slot to fill and a decision to make about your music. The difference is that a radio programmer needs a track that works between two songs, while a music supervisor or director needs a feeling that works under a scene. For independent artists writing instrumental, atmospheric, or experimental music — the artists who often find radio formats least hospitable — that second ask is frequently the more open door.</p>
<p>This guide covers how the sync side actually works: what to build, what to send, what the paperwork looks like, and how to start without an agent.</p>

<h2 id="why-sync-is-different">Why sync is a different business from airplay</h2>
<p>Airplay promotes a recording; sync licenses it. Three consequences follow, and they change everything about how you prepare:</p>
<ul>
<li><strong>Nobody is listening for a hit.</strong> A supervisor is matching texture to picture. A cue that would be "too repetitive" for radio is often exactly right under a dialogue scene.</li>
<li><strong>The terms are negotiable.</strong> Airplay is a yes-or-no. A license has a fee, a term, a territory, a media list, and a credit. You can say yes to a festival run and no to a national ad.</li>
<li><strong>The buyer needs files, not vibes.</strong> Deliverables, metadata, and a clean rights chain decide whether a deal closes on Friday or dies in an inbox.</li>
</ul>

<h2 id="two-paths">Two paths: license a finished track, or score to picture</h2>
<p>Independent artists usually end up doing both, but they are different jobs:</p>
<ul>
<li><strong>Licensing an existing recording</strong> — the track already exists, a production wants to use it, and you grant rights. The work is administrative: rights confirmation, a short agreement, stems and instrumentals on request.</li>
<li><strong>Scoring to picture</strong> — the music is made for the scene, to a locked cut, to a temp track that the director has already fallen in love with. The work is collaborative and iterative: spotting sessions, revisions, and versions timed to the frame.</li>
</ul>
<p>If you have never scored, start with licensing what you already own. It is a real placement, it puts a credit on your page, and it teaches you the paperwork in a low-stakes way.</p>

<h2 id="cue-library">Build a cue library, not just a track list</h2>
<p>A "cue" is a short, self-contained piece of music written for a specific job — tension, dread, drift, release. Supervisors and editors search by function, not by title, so a catalog organized as songs with three-minute structures is hard to use. Build cues instead:</p>
<ul>
<li><strong>Short and loopable.</strong> 30 seconds to two minutes, with clean edit points at bar lines.</li>
<li><strong>Named for what they do.</strong> "Slow dread, low strings" beats "Untitled 4" every time.</li>
<li><strong>Delivered in versions.</strong> Full, underscore (thin), no-percussion, and a 15-second button — four files per cue is normal.</li>
<li><strong>Registered.</strong> Every cue gets a title, an ISRC, and a writer split before anyone licenses it.</li>
</ul>
<p>Twenty good cues beat a hundred songs. Twenty is also enough to fill a page a director can browse in three minutes.</p>

<h2 id="portfolio">What a scoring portfolio has to prove</h2>
<p>A director or producer evaluating an unknown composer is asking four silent questions: does this sound like the film, can this person hit a deadline, do they understand picture, and are they easy to work with. A portfolio that answers those questions out loud gets far more inquiries than a homepage full of moody photography.</p>
<p>Practically, that means: cues grouped by emotional register rather than by album; a short reel cut to picture (not a slideshow of stills); a credits list with the format and year of each project; and an inquiry path that asks the producer for the things you actually need to quote — format, scored minutes, and a deadline. One public example of that shape is the <a href="${SISTER.url}" rel="noopener">${SISTER.name} horror and art-house score archive</a>, where cues are filed by emotional register — atmosphere, dissonance, psychological tension — beside the film credits and a quote request that asks for scored minutes and picture lock. It is worth a look purely as a layout to borrow from.</p>

<h2 id="deliverables">Deliverables and metadata close deals</h2>
<p>The unglamorous layer is where independent placements are won and lost:</p>
<ul>
<li><strong>Rights confirmation.</strong> You must control the master and the writer's share — or know exactly who does. A sample-free version of every pitch-ready track is the fastest way to stay safe.</li>
<li><strong>Stems.</strong> Dialogue-safe and mixable. If a supervisor has to ask twice, you have lost momentum.</li>
<li><strong>One-page agreement.</strong> Fee, term, territory, media, credit, and who handles cue sheet submission. Keep a template ready and never license on a handshake and a DM.</li>
<li><strong>Cue sheet data.</strong> Title, writers, publisher, duration, and usage — so the back-end royalties actually reach you when the film airs.</li>
</ul>
<p>Have this folder assembled before anyone asks. The composer who replies within an hour with a named file and a rate is the composer who gets the second film.</p>

<h2 id="where-to-pitch">Where to pitch when you have no agent</h2>
<ul>
<li><strong>Filmmakers you already know.</strong> Film school students, local directors, and editors you have worked with are the warmest possible leads — and their early features become your credits.</li>
<li><strong>Film festivals and markets.</strong> Festivals are where directors and producers are briefly in one place and unusually willing to talk about their next project.</li>
<li><strong>Music libraries.</strong> Non-exclusive libraries are a legitimate volume play. Read the reversion clause and the re-titling terms before you sign anything exclusive.</li>
<li><strong>Micro-budget and genre productions.</strong> Horror, thriller, and documentary are consistently the most music-hungry corners of independent film, and the ones most open to a composer with a distinct voice.</li>
<li><strong>Direct outreach with a specific ask.</strong> Send one cue that matches the project, a two-line note about the film you just watched, and a link. Not a catalog dump.</li>
</ul>

<h2 id="radio-and-sync">How radio and sync feed each other</h2>
<p>These channels are not rivals. A confirmed airplay list is credibility on a composer inquiry; a festival credit is a fact a radio host can read into a microphone. Artists working both sides get to reuse every win twice:</p>
<ul>
<li>Use your <a href="/resources/electronic-press-kit-radio/">EPK and one-sheet</a> as the base document, then add a cue page for the film audience.</li>
<li>When a placement lands, treat it like a spin: add it to the sheet, post it, and cite it in the next <a href="/resources/radio-pitch-email-templates/">radio pitch</a>.</li>
<li>Keep the do-it-yourself economics honest — <a href="/resources/diy-radio-promotion-vs-radio-promoter/">the same trade-off</a> applies to whether you pitch supervisors yourself or pay an agent.</li>
</ul>

<h2 id="first-30-days">Your first 30 days</h2>
<ol>
<li><strong>Week 1:</strong> Cut twenty existing tracks into cues, name them for function, and export the four standard versions of each.</li>
<li><strong>Week 2:</strong> Assemble the folder — one-page agreement, rights list, stems, ISRCs, writer splits.</li>
<li><strong>Week 3:</strong> Publish a single page for the catalog, grouped by emotional register, with a hook to listen and a form that asks for format, scored minutes, and deadline.</li>
<li><strong>Week 4:</strong> Pitch ten specific filmmakers or productions with one matched cue each — and keep the radio campaign running in parallel.</li>
</ol>
<p>Both channels reward the same behavior: a catalog that is easy to use, and a reply that arrives fast with everything attached.</p>
`,
  },
];
