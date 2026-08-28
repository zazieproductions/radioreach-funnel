from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "Frequency-Dominion-Upsell"

b3_content = """# BONUS 3 — THE ONE-PAGE EPK COMMAND DECK SPECIFICATION

> **CONFIDENTIAL OPERATOR ASSET — FREQUENCY DOMINION**
> "Your Electronic Press Kit is not a biographical brochure. It is an interactive single-screen Command Deck engineered to give a gatekeeper all critical operational facts in 20 seconds."

---

## 1. ARCHITECTURAL PHILOSOPHY & OBJECTIVE

Traditional independent artist press kits fail because they are designed for vanity rather than rapid gatekeeper evaluation. Music directors, festival booking managers, and sync supervisors receive hundreds of submissions every week. When confronted with a 14-page PDF or a cluttered website with five dropdown navigation menus, they immediately bounce.

The **One-Page EPK Command Deck** solves this by establishing a strict, single-screen responsive visual hierarchy. It answers the five core questions every gatekeeper asks within 20 seconds:
1. *Who is this artist, and what is their visual authority?* (Block 1: Hero Identity)
2. *What is their commercial sonic proposition in plain English?* (Block 2: 80-Word Bio)
3. *What does the record sound like right now without friction?* (Block 3: Audio Deck)
4. *Who else with institutional credibility has already validated them?* (Block 4: Proof Wall)
5. *Where is their active regional ground game?* (Block 5: Tour Dates & Contact)

---

## 2. THE SIX-BLOCK MODULAR SPECIFICATION

| Block Number | Modular Component | Required Elements | Technical Specification | Target Inspection Time |
|---|---|---|---|---|
| **Block 1** | **Hero Identity & Stance** | High-charisma landscape photo, artist title, genre tag, hometown city | 1920x1080 compressed WebP (<250kb); high-contrast typography | 3 seconds |
| **Block 2** | **Executive Commercial Bio** | Exactly 80 words; objective third-person tone; two verifiable career facts | 15px-17px clean sans-serif; 1.5 line height; zero poetic fluff | 6 seconds |
| **Block 3** | **Embedded Audio Engine** | Lead single at top + instant Broadcast Master WAV download button | HTML5 audio player; instantaneous playback; no login or download wall | 4 seconds |
| **Block 4** | **The Proof Wall** | Four verifiable receipt cards: station adds, editorial quotes, ticket counts | High-contrast badge styling; active hyperlinks to external proof | 3 seconds |
| **Block 5** | **Tour Dates & Routing** | Chronological 90-day live schedule: Date, City, Venue, Capacity, Tickets | Tabular format; prominent highlight on upcoming regional dates | 2 seconds |
| **Block 6** | **Direct Commercial Contact** | Direct mobile phone, direct email, booking & management contact | Click-to-call / click-to-email active links; zero generic forms | 2 seconds |

---

## 3. COPYWRITING FORMULA FOR THE 80-WORD BIO

Follow this strict three-sentence template:
- **Sentence 1 (Identity & Sonic Stance):** "[Artist Name] is a [City]-based [Genre] artist blending [Sonic Element A] with [Sonic Element B], delivering [Specific Emotional/Listener Feeling]."
- **Sentence 2 (Institutional & Broadcast Proof):** "Currently in rotation on [Station Callsign A] and [Station Callsign B], their latest single '[Track Title]' peaked at #[Chart Position] on [Relevant Chart] following sold-out showcases at [Notable Venue]."
- **Sentence 3 (Current Operational Milestone):** "With [Upcoming Tour Name] routing across [Region] this fall, [Artist Name] brings an uncompromising broadcast-ready sound to audiences and programmers alike."

---

## 4. DEPLOYMENT PROTOCOL & BEST PRACTICES

1. **Host at a Dedicated URL:** Host your Command Deck at `artistname.com/epk` or `artistname.com/radio`. Never send an attached document.
2. **Zero Password Barriers:** Never password-protect your press kit. A gatekeeper arriving from a pitch will immediately close the tab if blocked by a login.
3. **Mobile Screen Optimization:** Ensure Blocks 1, 2, and 3 are 100% visible on a standard smartphone screen without horizontal scrolling.
"""

b5_content = """# BONUS 5 — THE MASTER RESOURCE ARSENAL

> **CONFIDENTIAL OPERATOR ASSET — FREQUENCY DOMINION**
> "Systems beat willpower every single time. The Master Resource Arsenal is your tactical armory — containing the pitch formulas, follow-up cadences, planning calendars, and audit scorecards required to execute the Frequency Dominion operating system."

---

## 1. ARSENAL INVENTORY & OPERATIONAL INDEX

The Resource Arsenal comprises six specialized tactical modules designed to support your 21-day campaign execution:

| Arsenal Asset | Primary File Location | Core Operational Capability | Target Campaign Stage |
|---|---|---|---|
| **30-Formula Subject Line Bank** | `Resources/Pitch-Weapons/` | High-converting 3-layer subject lines engineered for 1.4-second mobile opens | Weeks 5-6 (Load Sequence) |
| **90-Word Pitch Vault** | `Resources/Pitch-Weapons/` | 10 modular pitch scripts across all radio formats and tour angles | Weeks 5-6 (Load Sequence) |
| **3-Touch Follow-Up Sequences** | `Resources/Follow-Up/` | Multi-touch value escalation copy with zero begging and dignified exit protocols | Weeks 10-11 (Campaign Execution) |
| **21-Day Campaign Calendar** | `Resources/Calendars/` | Day-by-day battle rhythm from pre-flight load to cascade expansion | Weeks 7-12 (Execution & Cascade) |
| **Quarterly Release Calendar** | `Resources/Calendars/` | 12-week quarterly campaign architecture synchronized with radio impact dates | Annual Planning & Governance |
| **Relationship Compounding Playbook** | `Resources/Relationships/` | 30/10/10 portfolio management system and Thank-You Economy protocols | Post-Add & Evergreen Operations |
| **90-Day Audit Checklist** | `Resources/Audit/` | 50-point quarterly audit scorecard and six-lane revenue attribution ledger | Week 12 (Quarterly Governance) |

---

## 2. THE THREE RULES OF ARSENAL DEPLOYMENT

1. **Rule 1: Customize Every Payload:** Never deploy a formula verbatim without inserting specific station callsigns, music director names, verified run-times, and local venue dates. Specificity is the universal signal of respect.
2. **Rule 2: Respect the Lifecycle Ladder:** Do not jump ahead to Cascade pitches before securing your initial anchor add. Follow the sequence: Hometown Heat Map → 20-Station War Room → Load Sequence → First Sends → Follow-Up → Gratitude → Cascade.
3. **Rule 3: Maintain Operational Ledger Hygiene:** Every interaction generated through these tools must be recorded in your tracking ledgers within 60 minutes. Unlogged campaigns are unmanaged campaigns.
"""

(COURSE / "Bonuses" / "Bonus-3-EPK-Command-Deck" / "One-Page-EPK-Command-Deck.md").write_text(b3_content.strip() + "\n", encoding="utf-8")
(COURSE / "Bonuses" / "Bonus-5-Resources" / "Master-Resource-Arsenal.md").write_text(b5_content.strip() + "\n", encoding="utf-8")
print("Generated Bonus 3 and Bonus 5 markdown dossiers!")
