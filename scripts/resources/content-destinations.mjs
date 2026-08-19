// Representative state and artist-goal pages. These pages teach a distinct
// targeting workflow; they do not claim to be exhaustive station directories.

const DATE = "2026-08-19";

function statePage(d) {
  return {
    slug: d.slug,
    category: "market",
    title: d.title,
    h1: d.h1,
    breadcrumbLabel: d.label,
    description: d.description,
    published: DATE,
    updated: DATE,
    ctaContext: `your ${d.state} radio research`,
    related: d.related,
    faq: [
      [`What radio stations should an independent artist target in ${d.state}?`, d.target],
      [`Do I need to live in ${d.state} to pitch its radio stations?`, d.residency],
      ["Is this a current list of stations accepting music?", "No. This is a market-planning guide. Submission policies and staff change, so verify every station and contact on the outlet's official website before outreach."],
    ],
    body: `
<p>${d.intro}</p>
<h2 id="market-map">Map the ${d.state} radio markets</h2>
<p>${d.map}</p>
<ul>${d.markets.map((x) => `<li>${x}</li>`).join("\n")}</ul>
<p>Do not treat a state as one format. Separate markets, station types, and individual shows in your working list. A regional connection can improve a pitch, but only after the program actually fits the release.</p>
<h2 id="station-types">Build the station-type layers</h2>
<ol>
<li><strong>College and community:</strong> find current music directors, genre directors, and local or specialty shows.</li>
<li><strong>Public and noncommercial:</strong> identify locally produced music blocks rather than pitching a network identity.</li>
<li><strong>Internet and syndicated shows:</strong> qualify active programming through recent episodes and tracklists.</li>
<li><strong>Commercial specialty:</strong> approach only where the format and current programming make the release plausible.</li>
</ol>
<p>${d.layers}</p>
<h2 id="local-angle">Use a truthful local angle</h2>
<p>${d.angle}</p>
<p>A local angle never substitutes for music fit. Check the show schedule and at least one recent playlist, then name the relevant signal in the first sentence. If you have no genuine tie, pitch a specialist on sound rather than manufacturing a geographic story.</p>
<h2 id="research-workflow">State campaign research workflow</h2>
<ol>
<li>Choose one focus track and define its narrow genre lane.</li>
<li>List the markets connected to your home, audience, collaborators, press, or confirmed tour dates.</li>
<li>Find specific shows in each market and record why each is a fit.</li>
<li>Verify the current contact, official submission route, source URL, and date checked.</li>
<li>Send in market-sized waves, beginning two to three weeks before release or a tour date.</li>
<li>Follow up once, suppress opt-outs and bounces, and thank verified supporters.</li>
</ol>
<h2 id="pitch">What the pitch should contain</h2>
<ul><li>Artist, track, precise genre, and release date in the subject</li><li>The current presenter's name and one program-specific sentence</li><li>One stable stream with clean and downloadable versions available</li><li>A concise, verifiable ${d.state} connection where relevant</li><li>A direct request for consideration—never a claim that airplay is owed</li></ul>
<p>${d.pitch}</p>
<h2 id="measure">Measure market progress</h2>
<p>Track qualified prospects, verified roles, sends, hard bounces, replies, adds, spins, interviews, and opt-outs separately. Save a public playlist or archive URL for every reported result. A campaign succeeds when it creates repeatable station relationships and credible evidence—not when it sends the largest number of emails.</p>
`,
  };
}

function goalPage(d) {
  return {
    slug: d.slug,
    category: "strategy",
    title: d.title,
    h1: d.h1,
    breadcrumbLabel: d.label,
    description: d.description,
    published: DATE,
    updated: DATE,
    ctaContext: d.cta,
    related: d.related,
    faq: d.faq,
    body: `
<p>${d.intro}</p>
<h2 id="define-outcome">Define the outcome before building the list</h2>
<p>${d.outcome}</p>
<ul>${d.outcomes.map((x) => `<li>${x}</li>`).join("\n")}</ul>
<p>Choose one primary outcome per pitch. Asking for rotation, an interview, a premiere, a session, and a ticket giveaway in the same first email makes every option harder to process.</p>
<h2 id="qualify">Qualify stations for this goal</h2>
<p>${d.qualify}</p>
<ol><li>Confirm the station or show is active through a current schedule or playlist.</li><li>Identify the person who controls the desired outcome.</li><li>Read the published submission or booking instructions.</li><li>Record a specific reason the release and goal fit.</li><li>Verify the contact against the official site before sending.</li></ol>
<h2 id="assets">Prepare the assets</h2>
<ul>${d.assets.map((x) => `<li>${x}</li>`).join("\n")}</ul>
<p>Keep assets behind one stable link and make the relevant item obvious. Do not attach large audio or video files unless requested.</p>
<h2 id="timeline">Campaign timeline</h2>
<p>${d.timeline}</p>
<table><thead><tr><th>Window</th><th>Action</th></tr></thead><tbody><tr><td>Planning</td><td>Research shows, verify contacts, prepare versions and the one-sheet.</td></tr><tr><td>First wave</td><td>Send a small group of individually addressed, high-fit pitches.</td></tr><tr><td>Follow-up</td><td>Reply to requests quickly; follow up once after seven to ten days.</td></tr><tr><td>Result</td><td>Confirm public evidence, thank supporters, and update the next wave.</td></tr></tbody></table>
<h2 id="pitch">Pitch structure</h2>
<p>${d.pitch}</p>
<p>Use truthful sender details, a descriptive subject, one clear link, and an easy way to decline future contact. Never buy guaranteed editorial outcomes or continue contacting someone who objects.</p>
<h2 id="scorecard">Goal-specific scorecard</h2>
<ul>${d.metrics.map((x) => `<li>${x}</li>`).join("\n")}</ul>
<p>${d.close}</p>
`,
  };
}

export const DESTINATION_PAGES = [
  statePage({
    slug: "submit-music-to-radio-stations-california", state: "California", label: "California radio submissions",
    title: "Submit Music to California Radio: Artist Guide", h1: "How to submit music to radio stations in California",
    description: "Build a California radio submission campaign across Los Angeles, the Bay Area, San Diego, Sacramento and regional markets with verified, relevant outreach.",
    intro: "California is not one radio market. Los Angeles, the Bay Area, San Diego, Sacramento, the Central Valley, and college towns each have separate scenes, schedules, and local stories. Independent artists get more from a market-by-market plan than a statewide email blast.",
    map: "Start with the places where you can prove relevance, then expand along realistic tour and audience routes.",
    markets: ["Los Angeles: dense commercial, public, college, community, and specialist programming; competition is equally dense.", "Bay Area: community and college traditions plus eclectic, electronic, jazz, hip-hop, and independent specialty shows.", "San Diego: a distinct cross-border and regional scene with college, public, community, and online outlets.", "Sacramento, Central Valley, Central Coast, and inland markets: fewer targets per city, often with clearer local and tour relevance."],
    layers: "California's scale makes show-level filtering essential. “Alternative,” “urban,” or “college” is not enough: recent playlists determine whether a contact belongs in the campaign.",
    angle: "Useful California connections include a hometown, current residence, named collaborator, confirmed venue, regional press, campus relationship, or audience concentration. Name the city, not just the state.",
    pitch: "Time tour pitches to the actual city: contact relevant shows roughly three weeks before a confirmed date, provide the venue and date, and offer an interview only if your schedule can support it.",
    target: "Begin with college, community, local-music, public specialty, and active internet shows in markets where your genre and geographic story overlap.",
    residency: "No. A genre specialist may play artists from anywhere. Local-music shows can have eligibility rules, and a confirmed California date or collaborator is useful only when stated accurately.",
    related: ["community-radio-music-submissions", "college-radio-submissions", "internet-radio-music-submissions", "radio-pitch-email-templates"],
  }),
  statePage({
    slug: "submit-music-to-radio-stations-texas", state: "Texas", label: "Texas radio submissions",
    title: "Submit Music to Radio Stations in Texas: Artist Guide", h1: "How to submit music to radio stations in Texas",
    description: "Plan a Texas radio submission campaign across Austin, Dallas–Fort Worth, Houston, San Antonio and regional markets, from community shows to Texas country.",
    intro: "Texas radio is geographically large and musically regional. Austin, Dallas–Fort Worth, Houston, San Antonio, El Paso, college towns, and smaller markets have distinct scenes. Country and Red Dirt are important, but Texas targets also span hip-hop, Tejano, Americana, metal, jazz, electronic, and independent rock.",
    map: "Organize the state around metro areas, touring corridors, and genre ecosystems rather than one statewide list.",
    markets: ["Austin and Central Texas: strong live-music context, community/public programming, college links, and roots/independent shows.", "Dallas–Fort Worth: a large multi-format market with college, community, public, online, country, hip-hop, and specialty outlets.", "Houston and Gulf Coast: major hip-hop, Latin, jazz, community, college, and genre-specific opportunities.", "San Antonio, El Paso, West Texas, and college markets: local identity and confirmed tour context can carry unusual weight."],
    layers: "Texas country and Red Dirt have regional charts and specialist programmers, while other genres depend more on community, college, public, and show-host decisions. Do not pitch the country ecosystem simply because the station is in Texas.",
    angle: "A Texas pitch can cite a hometown, regional touring history, a Texas songwriter or producer, a campus tie, or a confirmed venue. Use the exact city and fact; broad claims about being “big in Texas” invite skepticism.",
    pitch: "For regional country, provide radio-ready edits, accurate songwriter and label details, and real tour evidence. For every other genre, let the show's current playlist define the language of the pitch.",
    target: "Target genre-matched community, college, public, internet, and local shows first. Texas/Red Dirt programmers are relevant only to releases that genuinely belong in that ecosystem.",
    residency: "No. Touring and specialist programs create legitimate entry points, but local-only shows may require Texas residency or another stated connection. Read the eligibility rules.",
    related: ["country-radio-promotion", "community-radio-music-submissions", "college-radio-submissions", "radio-stations-accepting-music"],
  }),
  statePage({
    slug: "submit-music-to-radio-stations-new-york", state: "New York", label: "New York radio submissions",
    title: "Submit Music to New York Radio: Artist Guide", h1: "How to submit music to radio stations in New York",
    description: "Research New York radio submissions across NYC, Long Island, Hudson Valley, Albany, Syracuse, Rochester, Buffalo and college markets without mass outreach.",
    intro: "New York State contains several different radio ecosystems. New York City is a global media market with intense competition, while the Hudson Valley, Capital Region, Central New York, Finger Lakes, Western New York, Long Island, and college towns create more regional programming paths.",
    map: "Separate New York City from the rest of the state at the start; their contact density, local angles, and realistic first targets are different.",
    markets: ["New York City: community, college, public, online, and specialty programs are more realistic than major commercial daytime rotation.", "Long Island and Hudson Valley: local shows and tour context can distinguish a relevant pitch.", "Albany, Syracuse, Ithaca, and college markets: campus/community schedules often create direct genre routes.", "Rochester, Buffalo, and Western New York: distinct scenes, public/community outlets, colleges, and cross-border touring context."],
    layers: "Upstate and regional targets should not be treated as overflow from an NYC campaign. Research their own venues, scenes, show schedules, and public playlists.",
    angle: "Name the borough, city, county, campus, collaborator, press outlet, or confirmed date that creates relevance. “New York artist” is too broad when the station serves a specific upstate community.",
    pitch: "For NYC specialists, lead with precise genre fit and evidence. For regional programs, combine that fit with a local or tour fact and make interview availability realistic for the station's time zone and format.",
    target: "Start with current college, community, public specialty, local-music, and internet programs. Match the city and show before moving toward highly centralized commercial playlists.",
    residency: "No. Genre shows can program national and international artists, while local showcases may define a borough, city, region, or state eligibility rule. Follow that rule exactly.",
    related: ["college-radio-submissions", "public-radio-music-submissions", "community-radio-music-submissions", "indie-rock-radio-promotion"],
  }),
  goalPage({
    slug: "radio-promotion-for-a-tour", label: "Radio promotion for a tour",
    title: "Radio Promotion for a Tour: Market-by-Market Checklist", h1: "How to use radio promotion to support a tour",
    description: "Turn a tour route into a focused radio campaign: prioritize markets, time pitches, offer interviews and ticket giveaways, prepare assets, and track results.",
    cta: "your tour-support campaign",
    intro: "Tour support gives a radio pitch a concrete reason to exist now. Instead of asking a programmer to care about a release in the abstract, you can connect the music to a date, venue, local audience, and possible interview. The campaign still starts with programming fit; the tour date adds timeliness.",
    outcome: "Decide whether each market pitch primarily seeks airplay, an interview, a session, a calendar mention, or a ticket giveaway. The right contact changes with the outcome.",
    outcomes: ["Airplay before the date from a genre or local-music host", "A short remote or in-studio interview", "A calendar listing or event mention from an appropriate local program", "A ticket giveaway arranged with the venue and station", "A live session when travel, setup, and station capacity genuinely align"],
    qualify: "Start with confirmed dates. For each city, find shows that play the genre and have enough lead time to use the story. A small relevant community show is a better target than a major station with no matching program.",
    assets: ["Confirmed date, venue, ticket URL, age restriction, and billing", "One focus track plus a clean radio edit", "A 50-word tour bio and a market-specific sentence", "Interview availability with time zone and contact number", "Approved ticket quantity and terms if proposing a giveaway"],
    timeline: "Begin research four to six weeks before the date and send the first priority pitches about three weeks out. National tours can be worked in route order so imminent markets receive attention first.",
    pitch: "Subject: “[Artist] in [City] on [date] — [genre] for [show].” Open with the program fit, state the date and venue, link one track, and make one realistic offer. Never announce a giveaway before the venue and station agree.",
    metrics: ["Qualified shows per tour market", "Interview, session, and giveaway confirmations", "Verified spins in the three weeks before each show", "Referral traffic or ticket activity where trackable", "New presenter relationships preserved for the next visit"],
    close: "After the date, thank the presenter and share a concise outcome only if useful. The long-term value is becoming a known, reliable artist when the route returns.",
    related: ["radio-pitch-email-templates", "how-to-get-your-song-on-the-radio", "electronic-press-kit-radio", "radio-promotion-independent-artists"],
    faq: [["How far before a tour date should I pitch radio?", "Research four to six weeks out and send priority pitches about three weeks before the show. Some interview and session programs need more lead time, so follow their published guidance."], ["Should I offer free tickets?", "Only after the venue, promoter, and station approve the quantity and process. A giveaway can create useful programming, but never promise inventory you do not control."], ["Can a first tour get radio support?", "Yes, especially from local, college, community, and specialty shows when the music fits. Keep the ask realistic and make remote interviews easy."]],
  }),
  goalPage({
    slug: "how-to-get-radio-interviews", label: "Get radio interviews",
    title: "How to Get Radio Interviews as an Independent Artist", h1: "How to get radio interviews for your music",
    description: "Pitch better radio interviews with a clear story angle, qualified shows, concise outreach, broadcast-ready assets, preparation, and a professional follow-up plan.",
    cta: "your radio-interview outreach",
    intro: "A radio interview is programming, not a favor added to an airplay pitch. Hosts need a clear reason the conversation will interest their audience, a guest who can answer well, and a format that fits the available segment. A strong song gets attention; a usable story gets the booking.",
    outcome: "Define the interview type and the audience value. A five-minute release conversation, a local tour preview, a long-form career interview, and a production breakdown require different shows and preparation.",
    outcomes: ["A short release or tour interview tied to a timely event", "A genre conversation with a specialist host", "A local-scene segment with a genuine community connection", "A live or prerecorded performance-and-interview session", "A remote interview that can be recorded across time zones"],
    qualify: "Listen to at least one recent episode. Note interview length, tone, recurring segments, whether guests are local, and how music is incorporated. Pitch the producer or host responsible for that exact program.",
    assets: ["A two-sentence interview angle, not just a biography", "Three suggested talking points with concrete stories", "A pronunciation guide for artist and song names", "One clean track, stable EPK, and accurate credits", "Reliable remote audio, quiet room, headphones, and backup phone contact"],
    timeline: "Pitch timely interviews three to four weeks before the release, tour date, or event. Longer public-radio or session formats may plan further ahead. Offer several windows in the station's time zone.",
    pitch: "Lead with the audience-facing story: why this conversation belongs on this show now. Add one sentence of credibility, one music link, two or three possible topics, and clear availability. Do not send a list of generic questions for the host to read.",
    metrics: ["Qualified interview programs researched", "Positive replies and bookings", "Completed interviews versus cancellations", "Published archive pages and attributable referral traffic", "Hosts who invite a future release or return visit"],
    close: "Prepare concise answers, avoid speaking over the host, and do not force every response back to a sales message. After publication, thank the producer, share the official link, and preserve the relationship.",
    related: ["electronic-press-kit-radio", "radio-pitch-email-templates", "radio-promotion-for-a-tour", "community-radio-music-submissions"],
    faq: [["Do I need a publicist to get a radio interview?", "No. Independent artists can book interviews directly with local, college, community, public specialty, and internet shows when the story and music fit."], ["What makes a good radio interview pitch?", "A timely, audience-relevant angle; proof you know the show; two or three concrete talking points; one music link; and clear availability."], ["Should I pay for a radio interview?", "Editorial interviews should be clearly distinguished from sponsored content. If a placement is paid, require transparent sponsorship disclosure and evaluate it as advertising—not earned coverage."]],
  }),
];
