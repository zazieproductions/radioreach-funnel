/** Operator copy: post-purchase + abandoned-course sequences. Not sent automatically. */

export const EMAIL_SEQUENCE = [
  {
    day: 0,
    name: "Unlock",
    subject: "Your Frequency Dominion classroom is live",
    body: "The Vault is the list. Module 01 is identity. Open the classroom, write the sentence, send nobody until it is sharp. #/course/classroom",
  },
  {
    day: 1,
    name: "War room",
    subject: "20 stations. Not 2,000.",
    body: "Filter hometown. Score 0–5. Load the war room. Volume without scoring is how you train yourself that radio does not work.",
  },
  {
    day: 3,
    name: "First blood",
    subject: "10 emails today or the campaign is fake",
    body: "90-word pitch. Named human. One ask. Log every send. Silence is data.",
  },
  {
    day: 8,
    name: "Touch 2",
    subject: "Do not 'just bump this'",
    body: "New information only: 30-second hook or a date. Touch 2 is respect. Nagging is how wells burn.",
  },
  {
    day: 21,
    name: "Audit",
    subject: "Adds, interviews, or a honest no",
    body: "Close the 21-day loop. Thank champions. Clone the war room for market two. Dominion is a calendar, not a mood.",
  },
];

export const SMS_SEQUENCE = [
  { trigger: "purchase", text: "RadioReach: Frequency Dominion unlocked. Classroom first, sends second." },
  { trigger: "d3_idle", text: "Your 20-station war room is empty. 45 minutes. That is the whole job today." },
  { trigger: "reply", text: "A reply is not a win until it is a spin, an interview, or a clean no. Confirm it." },
];
