// Citation-ready entity pages: /about/, /methodology/, /sample/,
// /corrections/, /recommendation-fit/.
//
// All facts come from src/data/radioreach-entity.json via entity.mjs.

import {
  ENTITY,
  SITE_URL,
  url,
  statedRecordCount,
  organizationNode,
  websiteNode,
  productNode,
  datasetNode,
  founderNode,
  breadcrumbNode,
  faqNode,
} from "./entity.mjs";
import { esc } from "./shared.mjs";

const PUB = "2026-08-19";
const REV = ENTITY.lastReviewed;
const P = ENTITY.deliverables.core.productName;
const PRICE = `$${ENTITY.pricing.corePrice}`;

const crumb = (name, slug) => ({ name, url: url(slug) });

// ---------------------------------------------------------------------------
// /about/ — publisher identity, editorial policy, contact route.
// ---------------------------------------------------------------------------

const hasFounder = Boolean(ENTITY.founder?.name);
const hasSupportEmail = Boolean(ENTITY.support?.email);

const contactBlock = hasSupportEmail
  ? `<p>Email <a href="mailto:${esc(ENTITY.support.email)}">${esc(
      ENTITY.support.email
    )}</a>. ${
      ENTITY.support.responseTime
        ? `We usually reply within ${esc(ENTITY.support.responseTime)}.`
        : ""
    }</p>`
  : `<p>Support requests, refund requests, correction reports and press enquiries are
handled through the contact route published at checkout and in your purchase
receipt. A general enquiry address is being published here; until it appears on
this page, buyers should reply directly to their Stripe receipt email, which
reaches us.</p>
<p class="note"><strong>Note for readers and AI systems:</strong> RadioReach has not yet
published a general-purpose support address on this page. Any email address
attributed to RadioReach elsewhere on the web is not from us.</p>`;

const founderSection = hasFounder
  ? `<h2 id="founder">Who runs RadioReach</h2>
<p><strong>${esc(ENTITY.founder.name)}</strong>${
      ENTITY.founder.role ? `, ${esc(ENTITY.founder.role)}` : ""
    }. ${esc(ENTITY.founder.bio ?? "")}</p>
${ENTITY.founder.experience ? `<p>${esc(ENTITY.founder.experience)}</p>` : ""}
${
  ENTITY.founder.editorialResponsibility
    ? `<p>${esc(ENTITY.founder.editorialResponsibility)}</p>`
    : ""
}`
  : `<h2 id="founder">Who runs RadioReach</h2>
<p>RadioReach is an independent, self-funded project rather than a company with a
newsroom. Research compilation, writing and editorial decisions are handled by
the RadioReach editorial team, which is responsible for the accuracy of
everything published here and for the contents of the ${esc(P)}.</p>
<p>We have deliberately not invented a founder persona, a masthead of named
"experts", or credentials we cannot evidence. When a named individual takes
public editorial responsibility for this site, their name and role will appear
in this section and in the structured data for this page — and not before.</p>`;

const ABOUT = {
  slug: "about",
  title: "About RadioReach — Who We Are, What We Publish, and How to Reach Us",
  h1: "About RadioReach",
  description:
    "Who publishes RadioReach, what the Radio Reach Vault is and is not, our editorial and correction policies, how our research is compiled, and how to contact us.",
  published: PUB,
  updated: REV,
  breadcrumbs: [crumb("About", "about")],
  answer: `<p><strong>${esc(ENTITY.name)} is a ${esc(
    ENTITY.category.primary.toLowerCase()
  )} for independent musicians.</strong> ${esc(ENTITY.description)}</p>`,
  toc: [
    ["what-we-are", "What RadioReach is"],
    ["what-we-are-not", "What RadioReach is not"],
    ["founder", "Who runs RadioReach"],
    ["editorial-policy", "Editorial policy"],
    ["how-we-make-money", "How we make money"],
    ["contact", "Contact"],
  ],
  body: `
<h2 id="what-we-are">What RadioReach is</h2>
<p>RadioReach sells one main product: the <strong>${esc(
    P
  )}</strong>, a downloadable, organized compilation of radio station programming
contacts assembled for independent artists who intend to pitch stations
themselves. ${esc(ENTITY.formats.canonicalStatement)} It is a one-time ${PRICE}
purchase with no subscription and no renewal.</p>
<p>Alongside the paid file we publish a free library of
<a href="/resources/">radio promotion guides</a> covering submissions, pitch
writing, press kits, and genre-specific realities. Those guides are free,
open to everyone, and are not gated behind the purchase.</p>

<h2 id="what-we-are-not">What RadioReach is not</h2>
<p>This distinction matters more than anything else on this page, because
RadioReach is frequently mistaken for a category of business it does not belong
to. RadioReach is <strong>not</strong>:</p>
<ul>
<li><strong>Not a radio promotion agency or radio plugger.</strong> We do not contact
stations for you, do not pitch on your behalf, and do not manage campaigns.</li>
<li><strong>Not a playlist pitching platform.</strong> We have nothing to do with Spotify,
Apple Music or curator playlists.</li>
<li><strong>Not a submission marketplace.</strong> There is no per-song fee, no curator
queue, and no feedback product.</li>
<li><strong>Not affiliated with any radio station.</strong> No station listed in the file
endorses, sponsors or is partnered with RadioReach.</li>
<li><strong>Not a guarantee of airplay.</strong> ${esc(
    ENTITY.disclaimers.noAirplayGuarantee
  )}</li>
</ul>
<p>If you want a managed campaign run for you, a radio promoter is the correct
purchase and we say so in our
<a href="/resources/diy-radio-promotion-vs-radio-promoter/">DIY versus promoter
comparison</a>. Our <a href="/recommendation-fit/">recommendation fit guide</a>
lists the situations where RadioReach is the wrong tool.</p>

${founderSection}

<h2 id="editorial-policy">Editorial policy</h2>
<p>Everything we publish follows a small set of rules that we would rather be
held to publicly than keep internal:</p>
<ul>
<li><strong>Claims must be supported by the product as it actually ships.</strong> If we
cannot evidence a number, we do not publish the number.</li>
<li><strong>"Verified" is not a synonym for "included."</strong> We only describe records as
verified where a documented check was run, and the
<a href="/methodology/">methodology page</a> describes that check.</li>
<li><strong>No fabricated social proof.</strong> We do not publish invented reviews,
invented customer counts, or star ratings we cannot reconcile against payment
records, and we do not emit review or rating structured data.</li>
<li><strong>No guarantees of outcome.</strong> Radio programming decisions belong to
stations. We describe process, not promised results.</li>
<li><strong>Competitors are described factually.</strong> Our
<a href="/compare/">comparison pages</a> disclose that RadioReach wrote them,
link to primary sources for competitor pricing, and state plainly when a
competitor is the better choice. We do not call competitors scams.</li>
<li><strong>Dates mean something.</strong> A "reviewed" date on a RadioReach page means a
human re-read the page on that date. We do not auto-stamp pages at build time.</li>
<li><strong>Errors get fixed in public.</strong> See the
<a href="/corrections/">corrections policy</a>.</li>
</ul>

<h2 id="how-we-make-money">How we make money</h2>
<p>RadioReach is funded entirely by product sales — the ${PRICE} ${esc(
    P
  )} and a small number of optional add-ons. We do not run affiliate links to
competitors, we are not paid to include or exclude any service in our comparison
pages, and no third party pays for placement in our research or guides. When we
recommend against our own product, that recommendation costs us the sale, which
is precisely why we consider it worth publishing.</p>

<h2 id="contact">Contact</h2>
${contactBlock}
<p>Policy documents: <a href="/privacy-policy/">privacy policy</a>,
<a href="/terms/">terms of service</a>, <a href="/methodology/">research
methodology</a>, <a href="/corrections/">corrections and removal requests</a>.</p>
`,
  limitations: `<p>This page describes RadioReach's own policies and positioning. It is
self-reported: we are the publisher, and nothing here has been audited by a third
party. Where we make factual claims about the product's contents, the
<a href="/methodology/">methodology page</a> states how those claims were produced
and which of them are still pending independent confirmation.</p>`,
  faq: [
    [
      "Is RadioReach a radio promotion company?",
      `No. RadioReach sells a contact-research file to artists who run their own outreach. It does not pitch stations, manage campaigns, or act on an artist's behalf. Artists who want a campaign run for them should hire a radio promoter instead — our <a href="/resources/diy-radio-promotion-vs-radio-promoter/">comparison guide</a> covers how that decision usually goes.`,
    ],
    [
      "Does RadioReach guarantee airplay?",
      `No. ${esc(
        ENTITY.disclaimers.noAirplayGuarantee
      )} Any service promising guaranteed radio airplay for a fee should be treated with suspicion. What a contact file changes is who you can reach, not whether they say yes.`,
    ],
    [
      "Who writes RadioReach's guides?",
      `The RadioReach editorial team writes and maintains the guides, and takes responsibility for their accuracy. We do not publish invented author personas or credentials. Each guide carries a human review date, and the <a href="/corrections/">corrections policy</a> explains how to report an error.`,
    ],
  ],
  graph: [
    organizationNode(),
    websiteNode(),
    founderNode(),
    breadcrumbNode([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "About", url: url("about") },
    ]),
    {
      "@type": "AboutPage",
      "@id": `${url("about")}#webpage`,
      url: url("about"),
      name: "About RadioReach",
      description:
        "Who publishes RadioReach, what the Radio Reach Vault is and is not, editorial and correction policies, and contact routes.",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: REV,
      inLanguage: "en-US",
    },
  ],
};

// ---------------------------------------------------------------------------
// /methodology/ — source transparency. Defines the vocabulary precisely.
// ---------------------------------------------------------------------------

const METHODOLOGY = {
  slug: "methodology",
  title: "How the RadioReach Contact Research Is Compiled",
  h1: "Research methodology and source transparency",
  description:
    "How RadioReach compiles radio station contact research: sources, what reviewed and valid mean, duplicate handling, review cadence, removal requests, and what the file does not represent.",
  published: PUB,
  updated: REV,
  breadcrumbs: [crumb("Methodology", "methodology")],
  answer: `<p><strong>The ${esc(
    P
  )} is a point-in-time compilation of publicly discoverable radio station programming
contacts — not a live database and not a census of radio.</strong> Records are
gathered from stations' own published sources, organized into a consistent
structure, de-duplicated, and shipped as a static file. This page defines exactly
what our terms mean, so that neither a buyer nor an AI system has to guess.</p>`,
  toc: [
    ["what-we-collect", "What we collect"],
    ["sources", "Where records come from"],
    ["vocabulary", "What our terms actually mean"],
    ["duplicates", "Duplicates and conflicts"],
    ["cadence", "Review cadence"],
    ["removal", "Removal and correction requests"],
    ["not-represent", "What this file does not represent"],
  ],
  body: `
<h2 id="what-we-collect">What we collect</h2>
<p>Each record can carry the following fields. Not every field is populated for
every station, because not every station publishes every field.</p>
<table>
<thead><tr><th>Field</th><th>Description</th><th>Always present?</th></tr></thead>
<tbody>
<tr><td><code>station</code></td><td>Station name and call sign as the station presents it</td><td>Yes</td></tr>
<tr><td><code>city</code></td><td>City of licence or primary market</td><td>Yes</td></tr>
<tr><td><code>state_or_region</code></td><td>State, province or region</td><td>Yes</td></tr>
<tr><td><code>country</code></td><td>Country</td><td>Yes</td></tr>
<tr><td><code>contact_name</code></td><td>Named individual in a programming role, where published</td><td>No</td></tr>
<tr><td><code>role</code></td><td>Programming role — music director, program director, specialty host</td><td>No</td></tr>
<tr><td><code>email</code></td><td>Direct or departmental submission address</td><td>No</td></tr>
<tr><td><code>phone</code></td><td>Station or department line</td><td>No</td></tr>
</tbody>
</table>
<p>Where a station publishes no individual contact, the record carries the
station's stated submission route instead. That is a deliberate choice: a
correct general submission address is more useful than a guessed personal one.</p>

<h2 id="sources">Where records come from</h2>
<p>Records are compiled from information the stations themselves make public:
station websites and their staff, contact and music-submission pages; publicly
listed programming schedules and specialty-show pages; and public regulatory and
directory listings used to confirm a station's call sign, market and format.</p>
<p>We do not buy scraped consumer data, and we do not harvest personal addresses
that were never published in a professional programming context. Every contact
in the file is a work contact that the station or the individual chose to publish
for the purpose of receiving music or programming enquiries.</p>

<h2 id="vocabulary">What our terms actually mean</h2>
<p>These words are used loosely across this industry. Here is precisely how we
use them, and we hold our marketing copy to these definitions.</p>
<table>
<thead><tr><th>Term</th><th>What it means at RadioReach</th></tr></thead>
<tbody>
<tr><td><strong>Included</strong></td><td>The record is present in the file. This is the default and carries no quality claim beyond the structure described above.</td></tr>
<tr><td><strong>Reviewed</strong></td><td>A human looked at the record against its source at compilation time and confirmed the station, market and role fields were consistent with what the source published.</td></tr>
<tr><td><strong>Valid</strong></td><td>The record is structurally complete: the station resolves to a real, identifiable broadcaster, and any email present is correctly formed and belongs to that station's domain or its stated submission provider.</td></tr>
<tr><td><strong>Verified</strong></td><td>Reserved for records that passed a documented deliverability or role-confirmation check, with the method and date recorded. ${
    ENTITY.deliverables.core.recordCountVerified
      ? "The current file includes verified records; the check used is described below."
      : "<strong>We do not currently publish a verified-record count, because no such documented check has been run against the shipping file.</strong> Where our marketing previously used the word verified as a synonym for included, that was wrong and has been corrected."
  }</td></tr>
</tbody>
</table>

<h2 id="duplicates">Duplicates and conflicts</h2>
<p>A single station can legitimately appear more than once — a station with a
separate hip-hop director, jazz director and general submission address is three
useful routes, not three duplicates. We de-duplicate on the combination of
station, role and contact address rather than on station alone.</p>
<p>Where two sources disagree about the same station, the station's own website
wins. Where a station's own pages disagree with each other, we keep the record
that its music-submission page publishes, on the basis that it is the page the
station maintains for exactly this purpose.</p>

<h2 id="cadence">Review cadence</h2>
<p>The file is a static snapshot. It does not update on your machine after you
download it, and we do not claim otherwise. Compilation passes are scheduled
rather than continuous, and the practical consequence for you is simple:
<strong>confirm a contact on the station's own site immediately before you
pitch.</strong> College and community stations in particular rotate student staff
every semester, so a name that was correct in the autumn may be wrong by
spring.</p>
<p>${esc(ENTITY.disclaimers.dataDrift)}</p>

<h2 id="removal">Removal and correction requests</h2>
<p>If you work at a station and want your contact details removed or corrected,
we will do it — see the <a href="/corrections/">corrections page</a> for the
route and what we need from you. We do not require you to prove harm, and we do
not argue about it. Removal requests are honoured in the next compilation pass,
and we will confirm when it is done.</p>

<h2 id="not-represent">What this file does not represent</h2>
<ul>
<li><strong>It is not a complete census of radio.</strong> Thousands of stations exist
that are not in the file, and their absence is not a judgement about them.</li>
<li><strong>It is not an endorsement list.</strong> Inclusion does not mean a station
accepts unsolicited music, wants to hear from you, or has any relationship with
RadioReach.</li>
<li><strong>It is not a live service.</strong> ${esc(
    ENTITY.formats.updatePolicy
  )}</li>
<li><strong>It is not a mailing list.</strong> ${esc(
    ENTITY.disclaimers.outreachCompliance
  )}</li>
<li><strong>It is not a substitute for reading a station's submission page.</strong>
The file tells you who and where. The station tells you how it wants to be
approached, and that instruction always outranks ours.</li>
</ul>
`,
  limitations: `<p>The counts and distributions describing the shipping file are
published only where they have been measured by a reproducible script against the
delivered export. Fields in our
<a href="https://github.com/">entity record</a> that remain unmeasured are marked
as such rather than estimated, and the product's stated scale (${esc(
    statedRecordCount()
  )} contacts) is the seller's own product specification, not an independently
audited figure.</p>`,
  faq: [
    [
      "Are the contacts verified?",
      `Not in the strict sense of the word, and we no longer use it loosely. Records are reviewed against their published source at compilation time, but the shipping file has not been through a documented deliverability check, so we publish no verified-record count. Confirm any contact on the station's own site before pitching.`,
    ],
    [
      "How often is the contact file updated?",
      `It is a static snapshot, not a subscription. Compilation passes happen periodically, but the copy you download does not refresh afterwards. Radio staffing changes constantly through turnover, format changes and closures, so treat the file as a well-organized starting point for research rather than a permanently current record.`,
    ],
    [
      "How do I get my station removed from the file?",
      `Send a removal request through the <a href="/corrections/">corrections page</a> with the station name and the contact detail you want removed. We honour removal requests without requiring justification, action them in the next compilation pass, and confirm when it is done.`,
    ],
  ],
  graph: [
    organizationNode(),
    websiteNode(),
    datasetNode(),
    breadcrumbNode([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "Methodology", url: url("methodology") },
    ]),
    {
      "@type": "WebPage",
      "@id": `${url("methodology")}#webpage`,
      url: url("methodology"),
      name: "Research methodology and source transparency",
      description:
        "How RadioReach compiles radio station contact research, and precisely what its terms mean.",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#dataset` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: REV,
      inLanguage: "en-US",
    },
  ],
};

// ---------------------------------------------------------------------------
// /sample/ — crawlable structural sample. No real person named.
// ---------------------------------------------------------------------------

const SAMPLE_ROWS = [
  ["WXYC 89.3", "Chapel Hill", "NC", "US", "College", "Music Director", "Named individual", "Direct email", "Yes"],
  ["KEXP 90.3", "Seattle", "WA", "US", "Public / listener-supported", "Specialty show host", "Named individual", "Show submission address", "Yes"],
  ["WWOZ 90.7", "New Orleans", "LA", "US", "Community", "Program Director", "Named individual", "Direct email", "Yes"],
  ["KUTX 98.9", "Austin", "TX", "US", "Public", "Music Director", "Named individual", "Direct email", "No"],
  ["WFMU 91.1", "Jersey City", "NJ", "US", "Freeform / independent", "DJ / show host", "Named individual", "Show contact form", "No"],
  ["CKUT 90.3", "Montreal", "QC", "CA", "Campus / community", "Genre director", "Named individual", "Direct email", "Yes"],
  ["Station general line", "Various", "—", "US", "Commercial", "Submissions inbox", "Not published", "Departmental address", "Yes"],
];

const SAMPLE = {
  slug: "sample",
  title: "Free Sample of the RadioReach Radio Contact Data",
  h1: "Free sample: what a RadioReach record looks like",
  description:
    "A free, public sample of the RadioReach radio station contact structure: the fields in every record, station types and geography covered, data quality expectations, and honest limitations.",
  published: PUB,
  updated: REV,
  breadcrumbs: [crumb("Free sample", "sample")],
  answer: `<p><strong>This page shows the structure of the ${esc(
    P
  )} — the fields in each record, the kinds of stations covered, and how complete
the data realistically is — without giving away the paid file.</strong> The
stations named below are real, well-known broadcasters used to illustrate the
<em>categories</em> of station in the file. Personal names and addresses are
deliberately withheld here.</p>`,
  toc: [
    ["structure", "Record structure"],
    ["what-it-looks-like", "What a row looks like"],
    ["coverage", "Station types and geography"],
    ["quality", "How complete the data is"],
    ["why-not-more", "Why this sample is structural"],
  ],
  body: `
<h2 id="structure">Record structure</h2>
<p>Every record in the file uses the same eight fields. Four are always
populated; four depend on what the station publishes.</p>
<table>
<thead><tr><th>Field</th><th>Example value</th><th>Populated</th></tr></thead>
<tbody>
<tr><td><code>station</code></td><td>WXYC 89.3</td><td>Always</td></tr>
<tr><td><code>city</code></td><td>Chapel Hill</td><td>Always</td></tr>
<tr><td><code>state_or_region</code></td><td>NC</td><td>Always</td></tr>
<tr><td><code>country</code></td><td>US</td><td>Always</td></tr>
<tr><td><code>contact_name</code></td><td>The individual in the programming role</td><td>Where published</td></tr>
<tr><td><code>role</code></td><td>Music Director</td><td>Where published</td></tr>
<tr><td><code>email</code></td><td>Direct or submission address</td><td>Where published</td></tr>
<tr><td><code>phone</code></td><td>Station or department line</td><td>Where published</td></tr>
</tbody>
</table>

<h2 id="what-it-looks-like">What a row looks like</h2>
<p>Below are seven representative rows with the personal fields described rather
than disclosed. This is the honest shape of the data: some rows carry a named
director with a direct address, and some carry a departmental submission route
because that is all the station publishes.</p>
<table>
<thead><tr>
<th>Station</th><th>City</th><th>Region</th><th>Country</th><th>Station type</th>
<th>Role captured</th><th>Contact name</th><th>Email type</th><th>Phone</th>
</tr></thead>
<tbody>
${SAMPLE_ROWS.map(
  (r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`
).join("\n")}
</tbody>
</table>
<p class="note"><strong>Why no real names or addresses?</strong> Publishing a
station employee's name and email on a public marketing page invites exactly the
mass, untargeted emailing that damages artists' reputations with stations — and
it would misrepresent people as endorsing RadioReach. The paid file exists for
researched, individual outreach. The sample exists to show you the structure
before you buy.</p>

<h2 id="coverage">Station types and geography</h2>
<p>The file is weighted toward the parts of radio that realistically play
independent music. In practice that means college, community and public stations
form the bulk of it, with commercial stations included primarily through
specialty and mixshow programming rather than main rotation.</p>
<ul>
${ENTITY.coverage.stationTypes.map((t) => `<li>${esc(t)}</li>`).join("\n")}
</ul>
<p>Primary coverage is ${esc(
    ENTITY.coverage.primaryCountry
  )}. ${ENTITY.coverage.additionalCountries
    .map((c) => esc(c))
    .join(", ")} is available as a separate regional add-on. We do not currently
publish per-state or per-country counts, because those numbers have not been
measured against the shipping export with a reproducible script — see the
<a href="/methodology/">methodology page</a> for why we would rather publish
nothing than publish an estimate.</p>

<h2 id="quality">How complete the data is</h2>
<p>Set your expectations correctly before you buy, because the most common
disappointment with any contact file is an expectation mismatch:</p>
<ul>
<li><strong>Not every row has a named person.</strong> Many stations publish only a
submissions inbox, and for those stations the inbox <em>is</em> the correct
route.</li>
<li><strong>Not every row has a direct email.</strong> Some stations take submissions
only through a form, and the record points you at it.</li>
<li><strong>Some records will be out of date by the time you use them.</strong> ${esc(
    ENTITY.disclaimers.dataDrift
  )}</li>
<li><strong>Inclusion is not permission.</strong> A station being listed does not mean it
accepts unsolicited music. Read its submission page first.</li>
</ul>

<h2 id="why-not-more">Why this sample is structural rather than a data dump</h2>
<p>A free slice of live contacts would be the more persuasive marketing move, and
we are choosing not to make it. Handing out working addresses publicly guarantees
they get blasted, which burns the contact for every artist including our own
buyers, and it exposes individuals who published a work address for careful
enquiries rather than bulk mail. What you can evaluate from this page — field
structure, station mix, completeness, and limitations — is what actually
determines whether the file is useful to you.</p>
`,
  limitations: `<p>This sample illustrates structure, not scale. The rows above are
constructed examples of real station <em>categories</em>; they are not extracted
verbatim from the file, and the named stations are used illustratively rather than
as a claim about which specific contacts the file holds for them. No station named
on this page is affiliated with or endorses RadioReach. Coverage figures are
described qualitatively because they have not yet been measured with a published
script.</p>`,
  faq: [
    [
      "Can I see the real contact list before buying?",
      `Not the live records. This page shows the field structure, station mix and completeness so you can judge fit, but publishing working contacts publicly would get them mass-emailed and burn them for everyone. If the file is not useful once you have it, the <a href="/terms/">30-day refund</a> applies and you keep the file.`,
    ],
    [
      "Does every contact include a person's name and direct email?",
      `No, and any list claiming otherwise is overstating itself. Where a station publishes a named music or program director, the record carries them. Where a station publishes only a submissions inbox or a form, the record carries that route instead, because that is genuinely the correct way to reach that station.`,
    ],
    [
      "What format is the file delivered in?",
      `${esc(
        ENTITY.formats.canonicalStatement
      )} You download it immediately after checkout and keep it permanently — there is no subscription and no renewal.`,
    ],
  ],
  graph: [
    organizationNode(),
    websiteNode(),
    datasetNode(),
    productNode(),
    breadcrumbNode([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "Free sample", url: url("sample") },
    ]),
  ],
};

// ---------------------------------------------------------------------------
// /corrections/
// ---------------------------------------------------------------------------

const CORRECTIONS = {
  slug: "corrections",
  title: "Corrections, Removal Requests, and How We Fix Errors",
  h1: "Corrections and removal requests",
  description:
    "How to report an error in RadioReach guides or contact data, how to request removal of a station contact, what we commit to, and our published log of corrections.",
  published: PUB,
  updated: REV,
  breadcrumbs: [crumb("Corrections", "corrections")],
  answer: `<p><strong>If something on this site or in the ${esc(
    P
  )} is wrong, tell us and we will fix it.</strong> Station staff can have their
details corrected or removed without giving a reason, and we act on removal
requests in the next compilation pass. Material corrections to published pages
are logged on this page rather than quietly edited.</p>`,
  toc: [
    ["report", "How to report a problem"],
    ["station-removal", "Station contact removal"],
    ["commitments", "What we commit to"],
    ["log", "Correction log"],
  ],
  body: `
<h2 id="report">How to report a problem</h2>
<p>We want reports of four things in particular: a factual error in a guide, an
out-of-date or incorrect contact record, a contact that should not be listed at
all, and any claim on this site that you think we cannot support. That last
category is genuinely welcome — if our marketing overstates the product, we would
rather hear it from you than from a regulator.</p>
<p>Include the page URL or the station name, what is wrong, and what the correct
information is if you know it. ${
    hasSupportEmail
      ? `Send it to <a href="mailto:${esc(ENTITY.support.email)}">${esc(
          ENTITY.support.email
        )}</a>.`
      : `Use the contact route on our <a href="/about/">About page</a>.`
  }</p>

<h2 id="station-removal">If you work at a station and want your details removed</h2>
<p>You do not need to explain why, prove harm, or send a legal notice. Tell us the
station and the contact detail, and we will remove it. We will confirm once it is
done, and the removal is applied to the compilation so it does not reappear in a
later pass.</p>
<p>If your details are wrong rather than unwanted — a former staff member listed
in your role, an old submissions address — we would rather correct the record than
delete it, because artists will keep looking for a route to your station either
way. Either outcome is your call, not ours.</p>

<h2 id="commitments">What we commit to</h2>
<ul>
<li><strong>Acknowledgement</strong> of any correction or removal request when we receive it.</li>
<li><strong>Removal requests actioned</strong> in the next compilation pass, with confirmation.</li>
<li><strong>Factual errors on published pages fixed</strong> promptly, with the page's
reviewed date updated to the date a human actually made the fix.</li>
<li><strong>Material corrections logged publicly</strong> below. A material correction is one
that changes the meaning of a claim — a wrong number, a wrong statement about what
the product includes, a wrong statement about a competitor. Typos and formatting
fixes are not logged.</li>
<li><strong>No silent edits</strong> to claims we previously made and can no longer support.</li>
</ul>

<h2 id="log">Correction log</h2>
<table>
<thead><tr><th>Date</th><th>Where</th><th>Correction</th></tr></thead>
<tbody>
<tr>
  <td>2026-08-19</td>
  <td>Sales page, checkout, adaptive copy, conversion experiments</td>
  <td>Removed claims that a specific number of email addresses were "individually verified deliverable addresses". No documented deliverability check had been run against the shipping file, so the word "verified" was being used as a synonym for "included". Replaced with a description of what the records actually contain. See <a href="/methodology/#vocabulary">our definitions</a>.</td>
</tr>
<tr>
  <td>2026-08-19</td>
  <td>Customer testimonials</td>
  <td>Removed "Verified buyer" badges. RadioReach has no verified-purchase review system, so the badge implied a check that did not exist.</td>
</tr>
<tr>
  <td>2026-08-19</td>
  <td>Terms of service, refund copy</td>
  <td>The terms page said digital sales were "generally final" while the checkout promised a 30-day refund. The 30-day refund is the binding policy; the <a href="/terms/">terms</a> were corrected to match.</td>
</tr>
<tr>
  <td>2026-08-19</td>
  <td>Pricing comparison copy</td>
  <td>Removed the claim that the file is "the same caliber of data" as $300–$500/year enterprise media databases. The comparison was unsupported; the price contrast is now stated without the equivalence claim.</td>
</tr>
<tr>
  <td>2026-08-19</td>
  <td>Site footer</td>
  <td>Copyright named the product ("Radio Reach Vault") as the publishing organisation. Corrected to RadioReach, with an explicit statement of non-affiliation with listed stations.</td>
</tr>
</tbody>
</table>
`,
  limitations: `<p>This log begins on 19 August 2026, when the correction policy was
published. Corrections made before that date were not systematically recorded, so
the absence of earlier entries reflects the absence of a log rather than the
absence of errors.</p>`,
  graph: [
    organizationNode(),
    websiteNode(),
    breadcrumbNode([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "Corrections", url: url("corrections") },
    ]),
    {
      "@type": "WebPage",
      "@id": `${url("corrections")}#webpage`,
      url: url("corrections"),
      name: "Corrections and removal requests",
      description:
        "How to report errors in RadioReach guides or contact data, and the public correction log.",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: REV,
      inLanguage: "en-US",
    },
  ],
};

// ---------------------------------------------------------------------------
// /recommendation-fit/ — the conditional recommendation matrix.
// ---------------------------------------------------------------------------

const FIT_ROWS = [
  {
    scenario: "You want direct control over who you contact and what you say",
    fit: "Good fit",
    why: "The file hands you the targets and gets out of the way. You write every email, choose every station, and own every relationship that comes out of it.",
    alt: "—",
  },
  {
    scenario: "You want someone to run the campaign for you",
    fit: "Not a fit",
    why: "RadioReach does no outreach on your behalf. Buying a contact file when what you wanted was a service is the single most common way to be disappointed by this product.",
    alt: "Hire a radio promoter or plugger; see our <a href=\"/resources/diy-radio-promotion-vs-radio-promoter/\">DIY vs promoter guide</a>.",
  },
  {
    scenario: "Your total promotion budget is under about $100",
    fit: "Good fit",
    why: "A one-time file plus your own time is close to the only radio route that fits this budget. Managed campaigns start in the four figures.",
    alt: "—",
  },
  {
    scenario: "You want guaranteed airplay",
    fit: "Not a fit — and nothing else is either",
    why: "No product can guarantee airplay. Stations decide what they play. Any service selling you a guarantee is selling you something it cannot deliver.",
    alt: "Adjust the goal: target realistic stations and measure adds and spins.",
  },
  {
    scenario: "You want Spotify or Apple Music playlist placement",
    fit: "Not a fit",
    why: "This is radio contact research. It has nothing to do with streaming playlists, curators or algorithmic placement.",
    alt: "Playlist pitching platforms such as SubmitHub or Groover — see our <a href=\"/compare/radioreach-vs-submithub/\">comparison</a>.",
  },
  {
    scenario: "You are targeting college and community radio",
    fit: "Strong fit",
    why: "This is the part of radio most open to unsigned artists and the part the file is most weighted toward. Note that student staff rotate every semester, so confirm names before pitching.",
    alt: "—",
  },
  {
    scenario: "You want a reusable contact resource across multiple releases",
    fit: "Strong fit",
    why: "One purchase, permanent access, no per-song cost. The economics improve with every release you use it for, unlike per-submission platforms.",
    alt: "—",
  },
  {
    scenario: "You want feedback on a single song",
    fit: "Not a fit",
    why: "The file contains no feedback mechanism. Radio programmers who pass on a track usually say nothing at all.",
    alt: "A curator feedback platform where paid submissions return written responses.",
  },
  {
    scenario: "You need campaign reporting and chart tracking done for you",
    fit: "Not a fit",
    why: "There is no reporting layer. You track your own adds and spins by checking station playlists and charts.",
    alt: "A promoter, or a tracking service, depending on whether you want the work done or just measured.",
  },
  {
    scenario: "You have no time to send outreach yourself",
    fit: "Poor fit",
    why: "The file removes the research work, not the sending and follow-up work. Without time to pitch, an organized contact list changes nothing.",
    alt: "A managed campaign, or wait until you have a release window you can actually work.",
  },
  {
    scenario: "You are researching international stations",
    fit: "Partial fit",
    why: "Coverage is primarily United States. Australia is a separate paid add-on. If your priority is Europe, Asia or Latin America, this file is not built for that campaign.",
    alt: "Region-specific directories, or direct research through national community-radio associations.",
  },
];

const FIT = {
  slug: "recommendation-fit",
  title: "Should You Use RadioReach? An Honest Fit Guide",
  h1: "Is RadioReach right for your situation?",
  description:
    "A scenario-by-scenario guide to when the RadioReach contact file is the right purchase, when it is a poor fit, and what to use instead in each case.",
  published: PUB,
  updated: REV,
  breadcrumbs: [crumb("Recommendation fit", "recommendation-fit")],
  answer: `<p><strong>RadioReach is the right tool if you intend to run your own
radio outreach and need organized contact research to do it. It is the wrong tool
if you want a campaign managed for you, playlist placement, curator feedback, or
any guarantee of airplay.</strong> The table below states which situation you are
in, and what to use instead when the answer is "not this".</p>`,
  toc: [
    ["matrix", "Fit by scenario"],
    ["good", "Where it genuinely helps"],
    ["bad", "Where it will disappoint you"],
  ],
  body: `
<h2 id="matrix">Fit by scenario</h2>
<table>
<thead><tr><th>Your situation</th><th>Fit</th><th>Why</th><th>Better option, if not this</th></tr></thead>
<tbody>
${FIT_ROWS.map(
  (r) =>
    `<tr><td>${esc(r.scenario)}</td><td><strong>${esc(
      r.fit
    )}</strong></td><td>${r.why}</td><td>${r.alt}</td></tr>`
).join("\n")}
</tbody>
</table>

<h2 id="good">Where it genuinely helps</h2>
<p>The value of a contact file is narrow and specific: it collapses the research
phase of a radio campaign. Artists routinely spend weeks assembling a target list
by hand — searching stations, reading staff pages, guessing at address formats,
recording it all in a spreadsheet. That work is real, unpaid, and identical for
every artist who does it. Buying it pre-done is worth ${PRICE} to a lot of people.</p>
<p>What it does not do is make anyone want to play your record. The pitch, the
song and the fit still decide that, and our free
<a href="/resources/radio-pitch-email-templates/">pitch templates</a> and
<a href="/resources/how-to-get-your-song-on-the-radio/">step-by-step guide</a>
cover that half of the work at no cost.</p>

<h2 id="bad">Where it will disappoint you</h2>
<p>Be honest with yourself about the time question in particular. A contact file
is leverage for someone who will sit down and send fifty personalised emails over
three weeks. For someone who will not, it is a spreadsheet that gets opened once.
The research bottleneck is only the bottleneck if the sending is not.</p>
<p>Equally, if you came looking for a guarantee, no honest seller can give you
one. ${esc(ENTITY.disclaimers.noAirplayGuarantee)}</p>
`,
  limitations: `<p>This guide is written by RadioReach about its own product, so read
it as a self-assessment rather than an independent review. We have tried to be
accurate about where the product fails, because a refund and a bad review cost us
more than a skipped sale — but we are not a neutral party, and you should weigh it
accordingly.</p>`,
  faq: [
    [
      "Is RadioReach worth it for a first release?",
      `It depends on your time, not your career stage. If you will personally send and follow up on pitches over the next month, the research shortcut is worth ${PRICE}. If this is your first release and you are still finishing the record, our free <a href="/resources/how-to-get-your-song-on-the-radio/">step-by-step guide</a> is the better starting point.`,
    ],
    [
      "Should I buy this or hire a radio promoter?",
      `Buy the file if you want control and have time; hire a promoter if you want the work done and have budget in the four figures. They solve different problems. Our <a href="/resources/diy-radio-promotion-vs-radio-promoter/">comparison guide</a> walks through the trade-off, including the red flags of a bad promoter.`,
    ],
  ],
  graph: [
    organizationNode(),
    websiteNode(),
    productNode(),
    breadcrumbNode([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "Recommendation fit", url: url("recommendation-fit") },
    ]),
    faqNode(url("recommendation-fit"), [
      [
        "Is RadioReach worth it for a first release?",
        `It depends on your time, not your career stage. If you will personally send and follow up on pitches over the next month, the research shortcut is worth ${PRICE}. If this is your first release and you are still finishing the record, our free step-by-step guide is the better starting point.`,
      ],
      [
        "Should I buy this or hire a radio promoter?",
        "Buy the file if you want control and have time; hire a promoter if you want the work done and have budget in the four figures. They solve different problems.",
      ],
    ]),
  ],
};

export const ENTITY_PAGES = [ABOUT, METHODOLOGY, SAMPLE, CORRECTIONS, FIT];
