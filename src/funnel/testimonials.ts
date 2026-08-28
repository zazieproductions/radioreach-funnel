const P = (id: number, w = 160) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=${w}&h=${w}`;

export type Testimonial = {
  name: string;
  role: string;
  photo: string;
  text: string;
  stat: string;
  verified?: string;
};

/* ── Main sales page ── */
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marcus Delane",
    role: "Producer / DJ · Detroit, MI",
    photo: P(33136738),
    text:
      "I sent 40 emails from the Detroit tab on a Sunday night. Two program directors replied by Monday lunch. One of them put my single into weekend rotation. Forty emails. I'd burned six months on submission platforms before this and got nothing but auto-replies.",
    stat: "2 spins in 9 days",
    verified: "Verified buyer · Mar 2026",
  },
  {
    name: "Aiyana Ross-Whitfield",
    role: "Indie Folk · Portland, OR",
    photo: P(35367077),
    text:
      "The city-by-city structure is the whole trick. I pitched every station in the towns on my tour route three weeks before each date. Two stations booked me for on-air interviews. Ticket sales in those two markets literally doubled versus the rest of the run.",
    stat: "2 on-air interviews",
    verified: "Verified buyer · Feb 2026",
  },
  {
    name: "Tomás Vega Arriaga",
    role: "Latin Alt · Austin, TX",
    photo: P(29881401),
    text:
      "I'm not a marketer. I genuinely hate emailing strangers. But having the actual music director's name instead of a generic inbox changed the entire tone of every conversation. People answer when you use their name. That's the whole product, and it works.",
    stat: "17 replies / 120 sent",
    verified: "Verified buyer · Jan 2026",
  },
  {
    name: "Keisha Bramwell",
    role: "R&B / Neo-Soul · Atlanta, GA",
    photo: P(590479),
    text:
      "$25 for something enterprise vendors quoted me $400/yr for. I spot-checked 30 emails at random against my own research before I trusted it. 28 were live and current. After that I stopped checking and just started sending.",
    stat: "Verified 28 of 30",
    verified: "Verified buyer · Mar 2026",
  },
  {
    name: "Dev Ramanathan",
    role: "Electronic / Ambient · Brooklyn, NY",
    photo: P(31420959),
    text:
      "College and community radio was a total blind spot for me. I found 60 stations in the Northeast that program exactly my genre, pitched them over two weeks, and ended up with a recurring slot on a Tuesday night show. That show is now my biggest referral source.",
    stat: "Recurring weekly slot",
    verified: "Verified buyer · Feb 2026",
  },
  {
    name: "Siobhán Mulqueen",
    role: "Alt-Country · Nashville, TN",
    photo: P(38652628),
    text:
      "I bought the Australian add-on on a whim and it paid for the entire order twice over. Got picked up by two community stations in Melbourne and Brisbane within a month. I have never set foot in Australia. My monthly listeners there are now higher than in Tennessee.",
    stat: "AU airplay in 4 weeks",
    verified: "Verified buyer · Mar 2026",
  },
];

/* ── OTO 1 · Airplay Accelerator ── */
export const T_ACCELERATOR: Testimonial = {
  name: "Aiyana Ross-Whitfield",
  role: "Indie Folk · Portland, OR",
  photo: P(35367077),
  text:
    "I almost skipped this page. The subject line swipe file alone took me from 2 replies out of 80 to 14 replies out of 60. Same list. Same songs. Different words.",
  stat: "2 → 14 replies",
};

/* ── OTO 2 · Upwork course ── */
export const T_UPWORK: Testimonial[] = [
  {
    name: "Jordan Meacham",
    role: "Composer · Chicago, IL",
    photo: P(18535939),
    text:
      "First proposal I sent using the P.A.I.D. framework landed a $2,400 sync deal for a Netflix docuseries. Part 2 alone is worth ten times the fifty bucks I paid.",
    stat: "$2,400 first deal",
  },
  {
    name: "Priya Sundaram",
    role: "Music Producer · London, UK",
    photo: P(38366748),
    text:
      "I went from a 3% response rate to 31% in three weeks. I was charging $150 a track, now I charge $900. Same skills, different words. I've since run Part 3 on my design clients too.",
    stat: "3% → 31% reply rate",
  },
];

/* ── OTO 3 · Font bundle ── */
export const T_FONTS: Testimonial[] = [
  {
    name: "Ola Sandvik",
    role: "Art Director · Oslo, NO",
    photo: P(33148742),
    text:
      "I design every cover, poster and merch drop for my label myself. I was paying $30–$80 per licensed display face. This bundle replaced my entire type budget in one download.",
    stat: "Killed a $600/yr budget",
  },
  {
    name: "Renata Balboa",
    role: "Singer + Designer · São Paulo, BR",
    photo: P(29345644),
    text:
      "Found my whole visual identity in the occult/blackletter folder in about twenty minutes. My last three single covers all came out of this pack and they finally look like a real label put them out.",
    stat: "3 covers, 20 minutes",
  },
];
