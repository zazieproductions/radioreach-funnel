// Search-led landing pages for station types, markets, genres, and artist goals.
// These are intentionally limited to dimensions where we can provide a distinct
// workflow. They are not inventories of stations and never imply that a station
// currently accepts a submission without the artist checking its own policy.

const DATE = "2026-08-19";

function stationTypePage(d) {
  return {
    slug: d.slug,
    category: "station-type",
    title: d.title,
    h1: d.h1,
    breadcrumbLabel: d.label,
    description: d.description,
    published: DATE,
    updated: DATE,
    ctaContext: `your ${d.short} outreach`,
    related: d.related,
    faq: [
      [`Do ${d.short} stations accept independent music?`, d.acceptance],
      [`Who should I contact at a ${d.short} station?`, d.contact],
      ["How often should I follow up?", "Follow up once, seven to ten days after the first message, unless the station publishes a different process. Do not add the address to an automated sequence. If there is no reply after one relevant follow-up, record the outcome and move on."],
    ],
    body: `
<p>${d.intro}</p>

<h2 id="how-this-radio-works">How ${d.short} programming works</h2>
<p>${d.how}</p>
<p>${d.context}</p>

<h2 id="best-fit">Which releases are a realistic fit?</h2>
<ul>${d.fit.map((x) => `<li>${x}</li>`).join("\n")}</ul>
<p>A station type is only the first filter. Confirm the format, recent playlist, service area, and individual show before collecting a contact. A relevant list of 40 prospects is a stronger campaign asset than 4,000 addresses selected only because they contain the word “radio.”</p>

<h2 id="find-contact">Find the right submission contact</h2>
<p>${d.contactDetail}</p>
<ol>
<li>Read the station's current music or submission page and follow it over any general advice.</li>
<li>Check the schedule and recent playlists for the show or format that matches the release.</li>
<li>Confirm the named person still holds the role on the station's own site.</li>
<li>Record the source URL and date checked beside the contact, so your list can be maintained.</li>
</ol>

<h2 id="pitch">What to put in the pitch</h2>
<p>${d.pitch}</p>
<ul>
<li>A specific subject line: artist, track, genre, release date</li>
<li>One sentence showing why this station or show is relevant</li>
<li>One stable streaming link, with a clean edit available where needed</li>
<li>Your city and any truthful local, tour, or audience connection</li>
<li>A direct ask to consider the track, followed by a polite sign-off</li>
</ul>
<p>Use the <a href="/resources/radio-pitch-email-templates/">radio pitch email templates</a> as a framework, then rewrite the opening for every recipient.</p>

<h2 id="campaign-workflow">A safe campaign workflow</h2>
<p>Work in small waves. Research ten to twenty stations, send individual messages, then review replies and bounces before expanding. Suppress opt-outs immediately. Never scrape personal addresses, conceal the sender, or imply a prior relationship. Relevant one-to-one outreach protects your reputation and produces better learning than an indiscriminate blast.</p>
<p>${d.measure}</p>

<h2 id="checklist">Pre-send checklist</h2>
<ul>
<li>The station and show still operate, and the page was checked recently.</li>
<li>The release appears next to plausible peers in the current programming.</li>
<li>The recipient's role is relevant to music selection.</li>
<li>The email identifies you, contains an accurate subject, and offers an easy opt-out.</li>
<li>The campaign log has fields for sent date, response, follow-up, spin, and suppression.</li>
</ul>
`,
  };
}

function marketPage(d) {
  return {
    slug: d.slug,
    category: "market",
    title: d.title,
    h1: d.h1,
    breadcrumbLabel: d.label,
    description: d.description,
    published: DATE,
    updated: DATE,
    ctaContext: `your ${d.market} radio campaign`,
    related: d.related,
    faq: [
      [`Can an overseas artist submit music to radio in ${d.market}?`, d.overseas],
      [`What kind of radio should I target first in ${d.market}?`, d.firstTarget],
      ["Can I send one bulk email to every station?", "No. Station policies, applicable marketing laws, and basic professional etiquette all favor relevant, identified outreach. Build a small list, use the station's published route, personalize each message, and honor opt-outs immediately."],
    ],
    body: `
<p>${d.intro}</p>

<h2 id="market-map">The ${d.market} radio map</h2>
<p>${d.map}</p>
<ul>${d.tiers.map((x) => `<li>${x}</li>`).join("\n")}</ul>

<h2 id="where-independent-artists-fit">Where independent artists fit</h2>
<p>${d.fit}</p>
<p>The useful unit of research is often the individual show, not the parent network. Search schedules and recent playlists for genre programs, local-music blocks, emerging-artist features, and presenters who demonstrably play releases like yours.</p>

<h2 id="build-list">Build a qualified ${d.market} submission list</h2>
<ol>
<li>Choose one release, one genre lane, and the regions where you have a credible audience or live plan.</li>
<li>Separate national networks, local broadcasters, student/community stations, and online shows; they have different decision paths.</li>
<li>Read each official submission policy and capture the required format, current contact, source URL, and verification date.</li>
<li>Listen to or inspect a current playlist before deciding the station is a fit.</li>
<li>Start with twenty to forty highly qualified prospects and expand only when the response data supports it.</li>
</ol>
<p>A contact database is a research starting point, not proof of current acceptance. Staff and policies change; verify every priority contact against the station's own website before sending.</p>

<h2 id="pitch-local-context">Pitch with market context</h2>
<p>${d.pitch}</p>
<p>Keep the first email under about 150 words. Include one stream, release date, concise genre description, and the exact program fit. Do not attach large audio files unless requested. If you have no genuine connection to a locality, lead with programming fit rather than inventing one.</p>

<h2 id="rights-and-rules">Rights, privacy, and outreach rules</h2>
<p>${d.rules}</p>
<p>This is general campaign guidance, not legal advice. Use truthful sender details, identify the purpose of the email, retain suppression records, and follow the recipient's published process. Never buy guaranteed spins: legitimate programmers retain editorial control, and undisclosed payment for airplay can create serious legal and reputational risk.</p>

<h2 id="timeline">A six-week campaign rhythm</h2>
<ul>
<li><strong>Weeks −3 to −2:</strong> verify contacts, finalize the radio edit and one-sheet, and begin priority pitches.</li>
<li><strong>Week −1:</strong> send the second researched wave; answer asset requests promptly.</li>
<li><strong>Release week:</strong> notify relevant presenters once and monitor public playlists.</li>
<li><strong>Week +1:</strong> send one concise follow-up where permitted.</li>
<li><strong>Weeks +2 to +3:</strong> thank confirmed supporters, log results, and stop contacting nonresponders.</li>
</ul>
`,
  };
}

function genrePage(d) {
  return {
    slug: d.slug,
    category: "genre",
    title: d.title,
    h1: d.h1,
    breadcrumbLabel: d.label,
    description: d.description,
    published: DATE,
    updated: DATE,
    ctaContext: `your ${d.genre} campaign`,
    related: d.related,
    faq: [
      [`What radio stations play independent ${d.genre}?`, d.where],
      [`What should I send with a ${d.genre} radio pitch?`, d.assets],
      ["How many stations should a first campaign target?", "Begin with 40 to 80 genuinely matched stations or shows, not every station that uses a broad genre label. Send in waves so playlist and response data can improve the next group."],
    ],
    body: `
<p>${d.intro}</p>
<h2 id="radio-map">The ${d.genre} radio map</h2>
<p>${d.map}</p>
<ul>${d.channels.map((x) => `<li>${x}</li>`).join("\n")}</ul>

<h2 id="programming-fit">Define the programming fit</h2>
<p>${d.fit}</p>
<p>Use recent playlists rather than a station's decade-old format description. Write down two or three comparable artists the show actually aired, the program name, and the contact responsible. Those notes become both your qualification record and the first sentence of a human pitch.</p>

<h2 id="prepare-assets">Prepare the radio assets</h2>
<ul>${d.assetList.map((x) => `<li>${x}</li>`).join("\n")}</ul>
<p>Place everything behind one stable link. The first email should remain light: no large attachments and no maze of social profiles. A programmer should be able to hear the track in one click and find a download only if they want it.</p>

<h2 id="pitch-angle">Choose a pitch angle that belongs to the genre</h2>
<p>${d.pitch}</p>
<p>Claims such as “next big artist” are unusable. Replace them with specific evidence: a sold-out local date, a named producer, support from a relevant show, a chart week, or a genuine connection to the market. If there is no evidence yet, a precise description of the song is enough.</p>

<h2 id="campaign-plan">A practical campaign plan</h2>
<ol>
<li>Build a first wave of twenty shows where the subgenre match is obvious.</li>
<li>Send two to three weeks before release, unless a station specifies another window.</li>
<li>Follow up once after seven to ten days and stop if there is no response.</li>
<li>Check public playlists and chart reports; thank confirmed supporters.</li>
<li>Use real results to qualify a second wave, then preserve the relationships for the next release.</li>
</ol>
<p>${d.measure}</p>

<h2 id="avoid">Mistakes to avoid</h2>
<ul>
<li>Calling a broad format match “research” without checking the actual show</li>
<li>Sending the wrong version, missing metadata, or an expiring private link</li>
<li>Pitching multiple unrelated tracks in one first email</li>
<li>Automating repeated follow-ups or ignoring a station's submission policy</li>
<li>Paying anyone who promises undisclosed or guaranteed airplay</li>
</ul>
`,
  };
}

const stationPages = [
  stationTypePage({
    slug: "community-radio-music-submissions", short: "community radio", label: "Community radio submissions",
    title: "Community Radio Music Submissions: Artist Guide", h1: "How to submit music to community radio stations",
    description: "Submit music to community radio with a station-fit workflow: find volunteer programmers, follow submission policies, prepare radio assets, and track outreach safely.",
    intro: "Community radio is one of the most reachable broadcast paths for independent artists because programming is local, eclectic, and frequently chosen by volunteer hosts. That openness is not a license to mass-email the staff list: the winning unit is a release matched to a specific show and a current submission route.",
    how: "Most community stations combine a small permanent staff with volunteer presenters. A music director may screen general releases, while specialty hosts select every track for their own programs. Schedules can span dozens of genres, so a station-level label tells you less than a show playlist.",
    context: "Community broadcasters are mission-led and accountable to listeners. Local culture, underrepresented music, public service, and participation often matter alongside sound. A truthful local or tour connection can therefore be more useful than streaming numbers.",
    fit: ["Local and regional releases with a clear community connection", "Niche genres served by a named specialty program", "Independent music that complements recent public playlists", "Artists available for a concise interview, station ID, or local session"],
    acceptance: "Many do, but each station and show sets its own process. Some use a central music director; others ask artists to contact a program directly. Check the official site immediately before sending.",
    contact: "Start with the named music director or genre show host. Use a dedicated submissions address when the station publishes one; do not bypass it by guessing personal addresses.",
    contactDetail: "For general rotation, the music director is usually the best first contact. For a narrowly defined style, a specialty-show host may be more relevant. Volunteer schedules change, making role and date verification essential.",
    pitch: "Name the show or recent playlist that establishes fit. Mention a genuine geographic connection where one exists and offer an interview or station ID only if you can deliver it promptly.",
    measure: "Track public playlists, show archives, replies, and interview invitations. Small community spins can become durable relationships; a short thank-you after verified support is more valuable than another promotional blast.",
    related: ["radio-stations-accepting-music", "college-radio-submissions", "radio-pitch-email-templates", "how-to-get-your-song-on-the-radio"],
  }),
  stationTypePage({
    slug: "internet-radio-music-submissions", short: "internet radio", label: "Internet radio submissions",
    title: "Internet Radio Music Submissions: Artist Guide", h1: "How to submit music to internet radio stations",
    description: "Find legitimate internet radio music submission opportunities, qualify active shows, pitch curators, avoid pay-to-play traps, and measure real online airplay.",
    intro: "Internet radio ranges from respected presenter-led networks to unattended streams and pay-for-play schemes. The opportunity is real, especially for niche genres, but so is the need to qualify every outlet. Audience relevance, active programming, and transparent editorial control matter more than a station's claimed reach.",
    how: "Online stations may run a continuous programmed stream, a schedule of live shows, or an on-demand archive. The person choosing music is often the individual presenter. Because there is no shared licensing or staffing model across the category, each outlet needs its own legitimacy and submission check.",
    context: "Look for an active schedule, named hosts, recent tracklists, functioning streams, clear ownership, and ordinary editorial language. Treat guaranteed rotation, mandatory promotional packages, or unverifiable audience claims as warning signs.",
    fit: ["Niche releases matched to an active genre show", "Artists who can offer a remote interview or guest mix", "Tracks with clean metadata and a stable stream/download route", "International artists whose sound fits even without a local connection"],
    acceptance: "Many presenter-led stations do. Acceptance does not mean automatic airplay, and reputable outlets preserve editorial choice. Verify that the station is active and read its current rules.",
    contact: "Pitch the named host or curator for the matching show, or use the official submission form. A generic station inbox is a fallback, not the first choice.",
    contactDetail: "Check whether the show is live, syndicated, or archived and identify who actually builds its playlist. Confirm activity through recent episodes or tracklists before spending time on a pitch.",
    pitch: "Reference a recent episode and explain the sonic fit. For electronic, hip-hop, ambient, or DJ-led shows, offer useful versions such as a clean edit, extended mix, or guest mix without attaching them all.",
    measure: "Save a timestamped playlist, archive URL, or presenter confirmation for every claimed spin. Do not treat a screenshot with no public source as verified airplay, and never pay simply to manufacture a play count.",
    related: ["radio-stations-accepting-music", "electronic-music-radio-promotion", "radio-pitch-email-templates", "radio-promotion-glossary"],
  }),
  stationTypePage({
    slug: "public-radio-music-submissions", short: "public radio", label: "Public radio submissions",
    title: "Public Radio Music Submissions: Artist Guide", h1: "How to submit music to public radio programs",
    description: "A practical guide to public radio music submissions: identify music programs, pitch local and genre shows, prepare interview assets, and set realistic expectations.",
    intro: "“Public radio” is not one national submission desk. It is a network of independently programmed local stations, national distributors, and specific music programs. Independent artists gain traction by targeting the local or genre show that can genuinely use the release—not by pitching a network brand in the abstract.",
    how: "A public station may carry nationally distributed news for most of the day while its local staff programs folk, jazz, classical, Triple A, or regional music blocks. Editorial authority sits with the producer, host, or local music director for that program.",
    context: "Public-radio pitches benefit from more than a track: a strong regional story, cultural context, live-session readiness, or an articulate interview angle can make the release usable as programming.",
    fit: ["Jazz, classical, folk, roots, global, and Triple A releases with program fit", "Artists with a truthful regional story or upcoming local performance", "Projects with an interview, session, or cultural angle beyond a generic release notice", "Professionally documented music with accurate credits and rights information"],
    acceptance: "Some music programs do, while news-led schedules may have no relevant route. Research the local station and program; do not assume affiliation with a public network creates a central music policy.",
    contact: "Find the producer or host of the specific music program. A local music director or arts editor may be appropriate for broader coverage; follow any published form first.",
    contactDetail: "Use the schedule to separate locally produced shows from national carriage. Pitch only the locally controlled program, and address the producer or host by their current role.",
    pitch: "Lead with program relevance and public value: regional connection, composition story, cultural context, or a timely live date. Keep the music link prominent and the story factual.",
    measure: "Track interviews, session requests, playlist mentions, and archive pages as well as spins. A substantive local interview can create more discoverable value than a single unattended play.",
    related: ["jazz-radio-promotion", "country-radio-promotion", "radio-pitch-email-templates", "electronic-press-kit-radio"],
  }),
];

const genrePages = [
  genrePage({
    slug: "indie-rock-radio-promotion", genre: "indie rock", label: "Indie rock radio",
    title: "Indie Rock Radio Promotion for Independent Artists", h1: "Indie rock radio promotion: a practical campaign guide",
    description: "Build an indie rock radio campaign across college, community, Triple A, specialty, and internet shows with better targeting, assets, timing, and follow-up.",
    intro: "Indie rock has one of radio's clearest independent pathways: college and community stations, alternative specialty shows, noncommercial Triple A, and presenter-led online programs. The challenge is not finding outlets that use the label “indie.” It is separating the shows playing current emerging artists from broad alternative formats dominated by established catalogs.",
    map: "Treat college/community adds as the foundation, local and regional programs as the relationship layer, and larger Triple A or alternative specialty shows as earned expansion targets.",
    channels: ["College music directors and weekly alternative charts", "Community shows focused on local, guitar, punk, dream-pop, or experimental releases", "Noncommercial Triple A programs for songwriter-led and crossover tracks", "Internet presenters with current playlists and active archives"],
    fit: "Define the record more tightly than “indie rock”: post-punk, shoegaze, garage, dream-pop, math rock, singer-songwriter, or another useful lane. A precise lane helps the programmer hear where the track belongs.",
    assetList: ["A radio-length focus track and clean version where necessary", "A one-sheet naming the subgenre, city, release date, and comparable artists", "Cover art plus one horizontal press photo", "ISRC, songwriter, label/self-release, and contact metadata", "Tour dates in the station's market, if confirmed"],
    assets: "Send one focus track, a stable stream, a concise one-sheet, accurate metadata, and a clean edit if needed. Keep WAV or download access available behind the same link rather than attaching files.",
    where: "College and community stations, local-music programs, noncommercial Triple A, alternative specialty shows, and active presenter-led internet radio are the most realistic places to start.",
    pitch: "Reference a recent song from the program that reveals the shared lane, then describe your track in concrete production terms. For local markets, add an actual venue or tour date rather than a generic regional claim.",
    measure: "Record adds, individual spins, chart appearances, interviews, and presenter replies separately. An add is not the same as repeated rotation, and accurate reporting makes the next campaign stronger.",
    related: ["college-radio-submissions", "radio-promotion-independent-artists", "radio-pitch-email-templates", "electronic-press-kit-radio"],
  }),
  genrePage({
    slug: "jazz-radio-promotion", genre: "jazz", label: "Jazz radio",
    title: "Jazz Radio Promotion for Independent Artists", h1: "Jazz radio promotion for independent artists",
    description: "Plan a jazz radio campaign: target public, college, community and specialty programmers, prepare personnel and composer metadata, and pitch the right track.",
    intro: "Jazz radio is unusually hospitable to independent releases, but programmers expect detail. Personnel, composers, recording dates, label information, and subgenre are not administrative clutter—they are how hosts build sets and introduce the music accurately.",
    map: "Public-radio jazz blocks, community programs, college jazz directors, syndicated shows, and specialist online stations form the core. Individual hosts often have strong format boundaries, from straight-ahead and vocal jazz to fusion, avant-garde, Latin, and contemporary instrumental.",
    channels: ["Locally produced public-radio jazz programs", "College stations with a jazz director or reporting chart", "Community hosts with deep specialty programs", "Syndicated jazz shows whose single decision can reach affiliates", "Legitimate internet jazz stations with named curators and recent playlists"],
    fit: "Name the ensemble format and subgenre precisely. Review several recent playlists to see whether the host favors new recordings, catalog, vocal sets, regional artists, or a particular tradition.",
    assetList: ["One focus track plus the complete album stream where appropriate", "Full musician, composer, arranger, producer, and label credits", "Track lengths, FCC-safe status, release date, and catalog number", "A concise story about the session or composition", "A high-resolution photo and album artwork with credits"],
    assets: "Provide a stable stream, complete personnel and composer credits, track lengths, release date, artwork, and a one-sheet. Jazz hosts often need enough information to announce every player correctly.",
    where: "Start with locally produced public-radio jazz programs, college jazz directors, community specialty hosts, syndicated shows, and active jazz-focused internet stations.",
    pitch: "Lead with the musical information a host can use on air: ensemble, composer, stylistic lane, notable personnel, and the story of the session. Avoid vague prestige language and list only credits that are accurate.",
    measure: "Monitor show playlists, station archives, chart reports, and host communication. Because jazz shows often announce full credits, save links and timestamps that can be shared with musicians and used as verified campaign history.",
    related: ["public-radio-music-submissions", "college-radio-submissions", "electronic-press-kit-radio", "radio-promotion-glossary"],
  }),
  genrePage({
    slug: "metal-radio-promotion", genre: "metal", label: "Metal radio",
    title: "Metal Radio Promotion for Independent Bands", h1: "Metal radio promotion for independent bands",
    description: "A metal radio promotion workflow for college, community, specialty and internet shows: subgenre targeting, clean edits, assets, premieres, and campaign tracking.",
    intro: "Metal succeeds on radio at the show level. A station that looks broadly alternative may carry one two-hour program where doom, black metal, hardcore, death metal, or progressive releases are selected by a deeply informed host. That specialist—not a generic station inbox—is usually the campaign's real destination.",
    map: "College and community metal shows anchor the campaign, with active internet programs, regional heavy-music shows, and selected syndicated programs extending the reach. Commercial active-rock playlists are a later-stage target for the small subset of releases that fit that format.",
    channels: ["College metal directors and specialty hosts", "Community heavy-music shows with public playlists", "Regional programs tied to venues and scenes", "Presenter-led internet radio and podcasts that publish tracklists", "Syndicated metal shows with transparent submission routes"],
    fit: "Use the actual subgenre and inspect the host's recent range. A traditional-heavy-metal show and an extreme-metal program are not interchangeable even if both pages say metal.",
    assetList: ["A focus track chosen for the target show's lane", "A broadcast-safe edit if lyrics or samples require it", "Accurate band, label, territory, release, and track metadata", "One-sheet with subgenre, comparable artists, and notable tour dates", "Artwork and photos that can be published with proper credits"],
    assets: "Send one focus track, a stream/download route, clear subgenre, release date, full metadata, and a clean edit if required. Include tour dates only when they are confirmed and relevant to the market.",
    where: "College metal directors, community specialty programs, regional heavy-music shows, active internet programs, and selected syndicated shows are the practical first targets.",
    pitch: "Demonstrate scene literacy without writing a review of your own record. Name the exact subgenre, one recent playlist fit, relevant personnel or label facts, and a confirmed date in the market when available.",
    measure: "Separate premieres, interviews, single spins, recurring rotation, and playlist or chart appearances. Screenshots are useful records, but retain a public URL or direct confirmation whenever possible.",
    related: ["college-radio-submissions", "internet-radio-music-submissions", "radio-pitch-email-templates", "how-to-get-your-song-on-the-radio"],
  }),
];

const marketPages = [
  marketPage({
    slug: "submit-music-to-radio-canada", market: "Canada", label: "Canada radio submissions",
    title: "Submit Music to Radio Stations in Canada: Artist Guide", h1: "How to submit music to radio stations in Canada",
    description: "Plan a Canadian radio submission campaign across campus/community, public, commercial, Indigenous and online outlets with better targeting and compliant outreach.",
    intro: "Canada offers independent artists a broad campus/community and public-radio ecosystem alongside commercial networks and locally programmed shows. There is no universal submission route: the campaign must distinguish individual programs, station groups, language, region, and whether programming is locally controlled.",
    map: "Campus/community broadcasters and locally produced music shows are the most accessible entry points. CBC/Radio-Canada services, Indigenous broadcasters, commercial stations, and online programs each have distinct editorial and submission structures.",
    tiers: ["Campus and community stations with music or genre directors", "Locally produced public-radio and regional programs", "Indigenous and community broadcasters where cultural and regional relevance is genuine", "Commercial specialty or local-music programs rather than generic network contacts", "Independent online shows with named Canadian presenters"],
    fit: "Canadian and touring artists can lead with local relevance, but programming fit remains essential. International artists should concentrate on genre shows and regions where they have listeners, collaborators, press, or confirmed dates.",
    pitch: "State the city, province, or tour connection accurately. For French-language programming, pitch in professional French when you can support the relationship in that language; otherwise do not pretend fluency. Mention Canadian personnel or release context only when true.",
    rules: "Canada's anti-spam law (CASL) can apply to commercial electronic messages. Consent, identification, contact details, and an unsubscribe mechanism are important considerations; published submission invitations and one-to-one industry outreach still need careful, documented handling.",
    overseas: "Yes, when a current program fits the music or there is a Canadian tour, collaborator, audience, or scene connection. International origin alone is not a reason to contact every station.",
    firstTarget: "Campus/community stations and named genre or local-music programs are generally the most accessible. Start with shows whose recent playlists demonstrate fit.",
    related: ["college-radio-submissions", "community-radio-music-submissions", "radio-pitch-email-templates", "radio-stations-accepting-music"],
  }),
  marketPage({
    slug: "submit-music-to-radio-uk", market: "the UK", label: "UK radio submissions",
    title: "Submit Music to UK Radio Stations: Artist Guide", h1: "How to submit music to radio stations in the UK",
    description: "Build a UK radio submission campaign across BBC local shows, community, student, commercial, specialist and online radio with relevant, compliant pitches.",
    intro: "The UK radio landscape combines national networks, locally produced BBC programming, commercial groups, community stations, student radio, specialist shows, and influential online broadcasters. For emerging artists, the viable route is usually a named presenter or local/specialist program—not a general national network address.",
    map: "National daytime playlists are tightly programmed, while specialist evening shows, BBC local or regional music programs, community stations, student broadcasters, and presenter-led online outlets create many decentralized decisions.",
    tiers: ["Local and regional new-music programs", "Community stations with specialist schedules", "Student radio music teams and genre shows", "National or regional specialist presenters after evidence of fit", "Independent online broadcasters with editorial tracklists"],
    fit: "UK campaigns work best when organized around region and scene: hometown, a confirmed tour route, collaborators, label activity, or genuine listener traction. Genre specialists remain relevant to overseas artists without a geographic story.",
    pitch: "Use the presenter and program name, write dates in an unambiguous format, and mention the nearest confirmed show when relevant. For local-new-music programs, explain the geographic qualification directly rather than expecting the producer to infer it.",
    rules: "UK data-protection and electronic-marketing rules distinguish individuals and corporate subscribers and require careful handling of personal data. Use published professional routes, identify yourself, document legitimate relevance, minimize retained data, and honor objections or opt-outs immediately.",
    overseas: "Yes, particularly to specialist programs that demonstrably play international releases. Local or regional programs may have eligibility rules, so read them rather than treating them as general submission outlets.",
    firstTarget: "Community and student specialists, local new-music programs for eligible artists, and active online presenters are practical first targets. National playlists are an expansion goal, not the cold-email starting line.",
    related: ["community-radio-music-submissions", "internet-radio-music-submissions", "radio-pitch-email-templates", "electronic-press-kit-radio"],
  }),
  marketPage({
    slug: "submit-music-to-radio-australia", market: "Australia", label: "Australia radio submissions",
    title: "Submit Music to Australian Radio Stations: Artist Guide", h1: "How to submit music to radio stations in Australia",
    description: "Plan an Australian radio submission campaign across community, youth, public, regional, commercial and online outlets with relevant assets and outreach.",
    intro: "Australia's independent-radio pathway is shaped by strong community broadcasting, national youth and public networks, regional stations, specialist presenters, and locally focused programs. Submission portals can be important, but they do not replace program-level research or guarantee that a track fits.",
    map: "Community broadcasters and specialist programs offer decentralized access; national youth and public services use more structured discovery and programming systems; commercial and regional stations vary in how much music is selected locally.",
    tiers: ["Community stations and locally produced specialty shows", "Youth and public-radio discovery routes that publish artist guidance", "Regional programs where an artist has a genuine touring or community tie", "Genre presenters and active online broadcasters", "Commercial music teams only when the format and evidence justify the target"],
    fit: "Australian artists should map hometown, state, tour markets, community language or culture, and genre. Overseas artists need a strong program match, Australian collaborator, label connection, audience evidence, or confirmed dates rather than a generic international pitch.",
    pitch: "Lead with the exact program fit and include city/state or touring context where true. Make Australian release timing and availability clear, because overseas campaigns often create confusion about dates and rights territories.",
    rules: "Australia's Spam Act regulates commercial electronic messages and emphasizes consent, sender identification, and functional unsubscribe processes. Use published submission channels where available, keep a suppression list, and do not harvest addresses or disguise promotional messages.",
    overseas: "Yes, where the genre program accepts international music or there is a real Australian connection. Check eligibility for local and national discovery programs before submitting.",
    firstTarget: "Community and specialist shows with current playlists are the most directly researchable. Follow any official national discovery route exactly, and treat commercial rotation as a later-stage objective.",
    related: ["community-radio-music-submissions", "internet-radio-music-submissions", "radio-stations-accepting-music", "radio-promotion-independent-artists"],
  }),
];

const commercialPages = [
  {
    slug: "radio-station-email-list", category: "tools",
    title: "Radio Station Email List: Safe Buyer's Guide", h1: "Radio station email list for music promotion: buyer's guide",
    breadcrumbLabel: "Radio station email list", description: "Evaluate a radio station email list by source, roles, verification, coverage and update date—then use it for targeted music outreach without spam or false promises.",
    published: DATE, updated: DATE, ctaContext: "your contact-list research",
    related: ["music-director-contact-list", "radio-stations-accepting-music", "radio-pitch-email-templates", "radio-promotion-independent-artists"],
    extraSchema: () => ({
      "@type": "Dataset", "@id": "https://radioreach.us/resources/radio-station-email-list/#dataset",
      name: "Radio Reach Vault radio station contact resource", description: "A downloadable contact research resource organized by station, location and role.",
      url: "https://radioreach.us/", creator: { "@id": "https://radioreach.us/#organization" },
      isAccessibleForFree: false, distribution: [{ "@type": "DataDownload", encodingFormat: "application/pdf", contentUrl: "https://radioreach.us/" }],
      temporalCoverage: "..2026", license: "https://radioreach.us/terms/"
    }),
    faq: [
      ["What should a legitimate radio station email list include?", "At minimum: station name, location, contact role, address, source or provenance, and a meaningful verification or update date. Genre, station type, and submission-policy fields make targeting much safer."],
      ["Can I email every address at once?", "No. A contact list is a research aid, not permission to blast. Verify priority contacts, select only relevant stations, personalize each message, and comply with the laws and station policies that apply."],
      ["Does an email list guarantee radio airplay?", "No. No legitimate contact resource can guarantee editorial decisions. It can reduce research time; the station still decides whether the release fits."],
    ],
    body: `
<p>A useful radio station email list shortens contact research. A bad one creates bounces, complaints, wasted hours, and a damaged sender reputation. The difference is not the largest number printed on the sales page; it is whether the records identify relevant professional roles, show enough context to qualify a station, and can be checked against current first-party sources.</p>
<h2 id="fields">The fields a contact list should contain</h2>
<table><thead><tr><th>Field</th><th>Why it matters</th></tr></thead><tbody>
<tr><td>Station and location</td><td>Lets you verify identity, market, and local relevance.</td></tr><tr><td>Role</td><td>Separates music directors and programmers from irrelevant departments.</td></tr><tr><td>Email or submission route</td><td>Provides a starting point—not proof of perpetual validity.</td></tr><tr><td>Station type and format</td><td>Supports initial filtering before playlist-level research.</td></tr><tr><td>Source / checked date</td><td>Makes freshness auditable and prioritizes re-verification.</td></tr></tbody></table>
<h2 id="quality-test">A seven-point quality test</h2>
<ol><li><strong>Role clarity:</strong> named music roles beat unlabeled addresses.</li><li><strong>First-party provenance:</strong> official station sources are stronger than unexplained aggregation.</li><li><strong>Freshness:</strong> the seller acknowledges staff turnover and states when data was compiled or checked.</li><li><strong>Coverage honesty:</strong> “contact” does not silently mean every record has a personal email.</li><li><strong>Useful segmentation:</strong> location and role are present; genre still needs playlist verification.</li><li><strong>No airplay promise:</strong> contacts do not buy editorial outcomes.</li><li><strong>Clear terms:</strong> usage restrictions, refund terms, and privacy obligations are visible before purchase.</li></ol>
<h2 id="workflow">Turn a list into a qualified campaign</h2>
<ol><li>Filter by territory, station type, and likely format.</li><li>Visit each priority station's official site and current schedule.</li><li>Confirm the role, submission policy, and recent playlist fit.</li><li>Add a source URL and checked date to your working sheet.</li><li>Send individually, in small waves, with one relevant follow-up.</li><li>Suppress opt-outs and hard bounces immediately.</li></ol>
<p>This verification layer matters because radio staffing and programming change constantly. Even a recently checked address can change tomorrow.</p>
<h2 id="legal">Permission, privacy, and deliverability</h2>
<p>Purchasing access to business contact research does not create blanket consent. Applicable rules vary by recipient and country, including CAN-SPAM, CASL, UK privacy and electronic-marketing rules, Australia's Spam Act, and other laws. Use transparent sender information, truthful subjects, relevant one-to-one messages, and a working way to opt out. Never harvest addresses, rotate domains to evade filters, or continue after an objection.</p>
<h2 id="compare">Questions to ask before buying</h2>
<ul><li>Exactly which fields are included in every record?</li><li>How are addresses sourced and what does “verified” mean?</li><li>When was the resource last compiled or checked?</li><li>Are generic and named addresses counted separately?</li><li>Which countries and station types are covered?</li><li>What usage is prohibited by the license?</li><li>Is the format actually usable for the workflow you plan?</li></ul>
<p>The Radio Reach Vault is a downloadable research resource with 18,000+ entries organized by station, location, role, phone, and email. It is not a submission service, live-updated CRM, or promise of airplay. Verify priority records before outreach and use them only for targeted, relevant, human communication.</p>
`,
  },
  {
    slug: "music-director-contact-list", category: "tools",
    title: "Music Director Contact List for Independent Artists", h1: "How to build a music director contact list",
    breadcrumbLabel: "Music director contacts", description: "Build and maintain a music director contact list for radio outreach: identify the right role, verify current staff, segment by format, and pitch without spam.",
    published: DATE, updated: DATE, ctaContext: "your music-director research",
    related: ["radio-station-email-list", "college-radio-submissions", "radio-pitch-email-templates", "radio-stations-accepting-music"],
    faq: [
      ["What does a radio music director do?", "A music director reviews releases, manages adds and rotation, and may report charts. At smaller stations the program director, genre director, or individual show host may perform the same function."],
      ["Where can I find current music director contacts?", "Start with official station staff, contact, submission, and show pages. College and community stations may also publish music office hours or genre-director listings. Verify third-party data against those sources."],
      ["Should I contact the program director instead?", "Use the role closest to the decision. A music or genre director is usually best for new releases; a program director may be right at a small station where roles overlap. Specialty hosts choose their own shows at many stations."],
    ],
    body: `
<p>A music director contact list is valuable only when it maps a release to the person who can evaluate it. Titles vary, staff turns over, and many stations distribute music decisions across genre directors or individual hosts. Building the list therefore means documenting roles and programming fit—not collecting every address attached to a station domain.</p>
<h2 id="roles">Know the decision-making roles</h2>
<table><thead><tr><th>Role</th><th>When to use it</th></tr></thead><tbody><tr><td>Music director</td><td>General new-release review, adds, rotation, and often chart reporting.</td></tr><tr><td>Genre director</td><td>College or community submissions in a defined style such as hip-hop, jazz, or electronic.</td></tr><tr><td>Specialty-show host</td><td>Music that fits one named program more closely than the station's overall format.</td></tr><tr><td>Program director</td><td>Smaller stations with combined roles or broader programming questions.</td></tr><tr><td>Submission inbox/form</td><td>Use first whenever the station explicitly requires it.</td></tr></tbody></table>
<h2 id="research">A repeatable research method</h2>
<ol><li>Open the official station site rather than relying on a search snippet.</li><li>Read the staff, schedule, and submission pages together.</li><li>Check a current playlist for genre fit.</li><li>Capture name, exact role, official route, source URL, and date checked.</li><li>Record any file, timing, clean-edit, or eligibility requirements.</li><li>Flag uncertain records for confirmation rather than guessing an address.</li></ol>
<p>Search results and social profiles can help resolve ambiguity, but the official station page should remain the primary source. Never infer personal email patterns or scrape addresses from unrelated contexts.</p>
<h2 id="segments">Segment the list before outreach</h2>
<p>Create campaign views by station type, country, time zone, genre, local/tour relevance, and decision role. Add a “reason for fit” field that must be completed before send. If that field is blank, the contact is not ready for outreach.</p>
<p>Prioritize named genre and music directors whose playlists demonstrate fit. Place general submission routes in a second tier and program directors in a role-appropriate tier. This order reduces irrelevant email and keeps the strongest prospects from being buried in a giant sheet.</p>
<h2 id="pitch">Pitch a music director professionally</h2>
<p>Use the person's current name and title, reference one credible programming signal, describe the release in a precise genre lane, and provide one stable stream. Keep the first message short. Offer a clean edit, one-sheet, artwork, or WAV behind the link rather than attaching a large package.</p>
<p>Send two to three weeks before release unless the station says otherwise. Follow up once after seven to ten days. A nonresponse is not permission for an automated sequence.</p>
<h2 id="maintenance">Maintain the contact list</h2>
<ul><li>Timestamp every verification and response.</li><li>Remove hard bounces and suppress opt-outs immediately.</li><li>Update roles when an auto-reply or station page identifies a change.</li><li>Recheck priority records before every release.</li><li>Preserve positive relationships and thank confirmed supporters.</li><li>Never overwrite a suppression record with a fresh purchased import.</li></ul>
<h2 id="metrics">Measure list quality, not just volume</h2>
<p>Track verified-role rate, playlist-fit rate, hard-bounce rate, reply rate, adds, spins, and opt-outs. A smaller list with current roles and low bounces is more valuable than a huge file with no provenance. Airplay remains an editorial outcome; the list improves preparation, not certainty.</p>
`,
  },
];

export const GROWTH_PAGES = [...commercialPages, ...stationPages, ...genrePages, ...marketPages];
