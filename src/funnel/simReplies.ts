/* ─────────────────────────────────────────────────────────────
   Simulated forum replies (concept build)

   When a guest posts a thread or reply, a "regular" answers after a
   short typing delay. Replies are keyword-matched to the topic and
   written in the answering persona's established voice. No em dashes,
   each voice keeps its register from forumData.
────────────────────────────────────────────────────────────── */

export type SimReply = { author: string; body: string };

type Rule = { keys: string[]; replies: SimReply[] };

const RULES: Rule[] = [
  {
    keys: ["thank"],
    replies: [
      {
        author: "zazie",
        body: `glad it helped. post the numbers when they land, good or bad. the receipts help the next person more than you'd think.`,
      },
      {
        author: "PedroLagosta",
        body: `Friends!! Yes!! Come back with the numbers!! We will be here!!`,
      },
      {
        author: "808sNoHeartbreak",
        body: `AYY 🙏 we've all been the person staring at the send button. you got this. batches of 20!!`,
      },
    ],
  },
  {
    keys: ["subject"],
    replies: [
      {
        author: "vinylghost",
        body: `genre in the subject. always.

"alt-country, 2:41, for the saturday roots block" gets read at lunch. "new single out now!!" gets deleted at lunch.`,
      },
      {
        author: "BeccaNoncomm",
        body: `MD desk here. Put the genre in the subject line and you are already ahead of most of my week. Add the show name if you know it. "For the Saturday roots block" is the most beautiful phrase in my inbox.`,
      },
    ],
  },
  {
    keys: ["follow up", "follow-up", "followup", "nudge", "reminder", "second email"],
    replies: [
      {
        author: "quietframe",
        body: `One follow-up, roughly ten days out, one line. Then stop.

The stations that wanted you answered by then. Silence past that is an answer with excellent manners.

qf`,
      },
      {
        author: "vinylghost",
        body: `one nudge, ten days, one line. then stop. seriously.

the second nudge has never once added a record. it has ended a few friendships though (with inboxes).`,
      },
    ],
  },
  {
    keys: ["attach", "mp3", "wav", "zip", "stem", "file"],
    replies: [
      {
        author: "BeccaNoncomm",
        body: `Whatever you do, no attachments. One streaming link, that's the whole cargo. I will not open "FINAL_master_v3(2).mp3" from a stranger, and honestly I like you already.`,
      },
      {
        author: "808sNoHeartbreak",
        body: `NO FILES 😭 learn from my shame thread on this. i sent a 12MB zip of stems to like 40 stations in 2019. one link. ONE LINK. it's in my post history, it's called a shame thread for a reason`,
      },
    ],
  },
  {
    keys: ["nacc", "chart"],
    replies: [
      {
        author: "quietframe",
        body: `Chart math, no vibes:

1. Pitch stations that actually report, not just any station in the state.
2. Sort by your tour route, even if the tour is hypothetical.
3. One link, one follow-up, log everything.

My playbook thread has the full breakdown. Start there before you spend money anywhere else.

qf`,
      },
    ],
  },
  {
    keys: ["college", "campus", "university station"],
    replies: [
      {
        author: "night_shift_nd",
        body: `college radio person here lol (2am to 6am, god help me). we're volunteers with inboxes older than some of our listeners.

the move: name the actual show, not the station. the specialty show hosts read their own email and are perpetually starving for music that fits. also the late-night slots need tracks desperately. ask me how i know`,
      },
    ],
  },
  {
    keys: ["gospel", "church", "worship"],
    replies: [
      {
        author: "PastorMike_KTLW",
        body: `Good evening. On the church side of the dial, please read the block descriptions before you send. We program more than worship, and the Sunday blues hour is perpetually hungry for the right record.

Blessings on your outreach.`,
      },
    ],
  },
  {
    keys: ["country", "americana", "bluegrass", "nashville"],
    replies: [
      {
        author: "dial_turner",
        body: `For the country and Americana side: the 1kW daytimers and the AM hybrids are the overlooked ground. Pitch the Friday and Saturday blocks, ask which block you are being added to, and offer to call the request line. The corporate clusters are mostly a waste of postage.`,
      },
    ],
  },
  {
    keys: ["hip hop", "trap", "rap", "drill"],
    replies: [
      {
        author: "808sNoHeartbreak",
        body: `AYY trap representative checking in 😭 the mixshow DJs are the move and their names are in the directory.

one link, genre + city in the subject, and do NOT attach files (see my shame thread). mixshow adds compound. one spin becomes a recurring slot if the DJ likes you. that's literally what happened to me`,
      },
    ],
  },
  {
    keys: ["ambient", "classical", "instrumental", "electronic", "synth"],
    replies: [
      {
        author: "quietframe",
        body: `For instrumental work, the specialty shows are your entire market. Ambient does not belong in drive time, and the hosts who play it say so in their block descriptions.

Sort by format, then by show. Numbers over vibes.

qf`,
      },
    ],
  },
  {
    keys: ["australia", "aussie", " nz", "melbourne", "sydney", "brisbane"],
    replies: [
      {
        author: "sydney_syd",
        body: `hey mate. if you've got the AU add-on, check the local-content quota markers. half the community stations are legally required to play aussie originals, which means your pitch is doing them a favour.

sunday arvo send works a treat. and cheers to whoever replies, they're punctual over here`,
      },
    ],
  },
  {
    keys: ["bounce", "bounced", "undeliver", "outdated", "old data", "verified"],
    replies: [
      {
        author: "zazie",
        body: `if you hit a bounce, send it to me and i'll replace or strike the entry, usually inside a week. every entry also ships its own last-verified date, so you can judge staleness yourself instead of trusting me.

the number is the number.`,
      },
    ],
  },
  {
    keys: ["merge", "blast", "batch", "all at once", "everyone at", "spam"],
    replies: [
      {
        author: "JurgenDE",
        body: `Please check the following:

1. Batches of 20 to 30 per day. Never more.
2. Personalize the first line. Actually personalize it.
3. Send a test to yourself first. Always.

This is not difficult, but it is necessary. Ask the tourvan how it goes otherwise.`,
      },
      {
        author: "vinylghost",
        body: `batches of 20. warm domain. test send to yourself first.

that's the whole spell. the 900-in-one-morning thread is required reading and it is called a sequence of regrettable events for a reason.`,
      },
    ],
  },
  {
    keys: ["epk", "bio", "press kit", "presskit", "photo"],
    replies: [
      {
        author: "clare_mont",
        body: `Minimum viable kit: one link that works, one landscape photo, two sentences that sound like a person. Build the fancy PDF later, when someone actually asks for it.

The outreach teaches you what belongs in the bio. Polishing first is just procrastination with fonts.`,
      },
    ],
  },
  {
    keys: ["price", "cost", "$20", "refund", "money back", "guarantee"],
    replies: [
      {
        author: "zazie",
        body: `$20 once. and the 30-day put-it-to-work guarantee is real: contact five relevant stations, keep a simple record, and if it isn't for you, email me within 30 days with your receipt and a short note. no airplay required. just an honest attempt.`,
      },
    ],
  },
  {
    keys: [" ai ", "chatgpt", "gpt", "written by ai", "ai pitch"],
    replies: [
      {
        author: "BeccaNoncomm",
        body: `Whatever you draft with, keep the one expensive sentence: something that could only have been written to my station. The warm fog ("I hope this finds you well") competes only with itself at my inbox.`,
      },
    ],
  },
  {
    keys: ["they replied", "got a reply", "pd replied", "answered back", "what now", "what do i do"],
    replies: [
      {
        author: "vinylghost",
        body: `answer within a day. send exactly what they asked for. nothing else.

you're not negotiating a treaty. you're emailing a person about songs.`,
      },
      {
        author: "808sNoHeartbreak",
        body: `CONGRATS?? okay do not spiral 😭 send exactly what they asked for, same day if you can. two tracks not three. short bio. thank them once.

then come back and post the update because this board demands receipts and i am living vicariously`,
      },
    ],
  },
  {
    keys: ["how many", "should i send", "how much to send", "how many emails"],
    replies: [
      {
        author: "vinylghost",
        body: `fewer than you think. 20 good ones beat 200 lazy ones every time.

quality over volume. every time. it's the whole board's religion at this point.`,
      },
    ],
  },
  {
    keys: ["new here", "first post", "just bought", "getting started", "where do i start", "beginner"],
    replies: [
      {
        author: "the_q_factor",
        body: `hey!! welcome 😭 i asked probably your exact question a while back. check my solved threads, might save you an evening.

short version: read the pinned one-pitch rule thread, then batches of 20. that's genuinely most of it`,
      },
      {
        author: "BASSLINEBENJI",
        body: `RIGHT welcome in mate. short version: one link, their name, genre in the subject. long version: this entire forum, it's all here

big up yourself for actually posting instead of lurking. the water's warm`,
      },
    ],
  },
];

const QUESTION_FALLBACK: SimReply[] = [
  {
    author: "quietframe",
    body: `Need a bit more detail to answer well: genre, region, and what you have sent so far. Post the numbers and the regulars can actually help.

qf`,
  },
  {
    author: "the_q_factor",
    body: `ooh good question. what genre and where are you based? the answer changes a LOT depending on which board you're pitching (ask me how i know 😭)`,
  },
  {
    author: "dial_turner",
    body: `A fair question. Give us the format and the market and someone here will have lived through it. The specific answer is always better than the general one.`,
  },
];

const GENERIC_FALLBACK: SimReply[] = [
  {
    author: "vinylghost",
    body: `welcome in. read the whole thread before sending, most of the answer is usually upthread.

batches of 20.`,
  },
  {
    author: "sadgirlsynth",
    body: `no notes honestly. this thread is the documentation at this point (said with love)`,
  },
  {
    author: "clare_mont",
    body: `Welcome. One small thing that helped me: write the sentence about the station first, before anything else. If you can't write it, you're pitching the wrong station.`,
  },
  {
    author: "zazie",
        body: `thanks for posting. keep a simple log of what you send and what comes back, good or bad. the receipts are the whole game around here.`,
  },
  {
    author: "PedroLagosta",
    body: `Friends!! Welcome!! The regulars will help you, they helped me also and now i have radio in Goiás. Come back with the numbers!!`,
  },
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Pick a persona + reply that matches what the guest wrote. */
export function generateSimReply(userText: string, threadTitle = ""): SimReply {
  const haystack = ` ${userText.toLowerCase()} ${threadTitle.toLowerCase()} `;

  for (const rule of RULES) {
    if (rule.keys.some((k) => haystack.includes(k))) {
      return pick(rule.replies);
    }
  }
  if (userText.includes("?") || threadTitle.includes("?")) {
    return pick(QUESTION_FALLBACK);
  }
  return pick(GENERIC_FALLBACK);
}
