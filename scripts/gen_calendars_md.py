from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAL = ROOT / "Frequency-Dominion-Upsell" / "Resources" / "Calendars"

c21_content = """# THE 21-DAY CAMPAIGN CALENDAR — Day-by-Day Battle Rhythm

> **CONFIDENTIAL OPERATOR ASSET — FREQUENCY DOMINION**
> "Campaigns fail in the chaotic gaps between 'I'll do it later.' The 21-Day Campaign Calendar is a rigid operational flight plan — directing exactly who to email, what to deliver, and when to exit from Day 1 to Day 21."

---

## THE 21-DAY EXECUTION TIMELINE

| Day | Phase | Core Operational Mission & Milestone | Verification Standard | Status Checklist |
|---|---|---|---|---|
| **Day 1** | **LOAD** | Verify gatekeeper contacts and populate War Room rows 1–10 | Direct named MD emails checked; zero info@ | [ ] COMPLETED |
| **Day 2** | **LOAD** | Verify gatekeeper contacts and populate War Room rows 11–20 | 20 total stations locked with verified contacts | [ ] COMPLETED |
| **Day 3** | **LOAD** | Execute Seven-Gate Arming Audit; eliminate all delivery blockers | All 7 gates verified green; clean WAV staged | [ ] COMPLETED |
| **Day 4** | **FIRE** | **Wave 1 Dispatch (Top 10 Targets):** Deliver 90-word pitch | Delivered Tuesday 9:15–10:30 AM local time | [ ] COMPLETED |
| **Day 5** | **WATCH** | 24-Hour Diagnostic Window: Monitor email opens, clicks, bounces | Open rates logged; zero-latency reply readiness | [ ] COMPLETED |
| **Day 6** | **WATCH** | Reconcile diagnostic logs; pre-stage Touch 2 Value Assets | 30-second hook cuts and tour dates staged | [ ] COMPLETED |
| **Day 7** | **FIRE** | **Wave 2 Dispatch (Remaining 10 Targets):** Deliver 90-word pitch | Delivered Thursday 9:15–10:30 AM local time | [ ] COMPLETED |
| **Day 8** | **TOUCH-2** | **Touch 2 Dispatch to Wave 1:** Deliver 30-second hook cut | In-thread reply; fresh asset; under 45 words | [ ] COMPLETED |
| **Day 9** | **TOUCH-2** | **Touch 2 Dispatch to Wave 2:** Deliver 30-second hook cut | In-thread reply; fresh asset; under 45 words | [ ] COMPLETED |
| **Day 10** | **WATCH** | Dialogue handling: Respond to all gatekeeper requests under 2 hours | Broadcast WAVs delivered; interviews booked | [ ] COMPLETED |
| **Day 11** | **TOUCH-3** | **Touch 3 Graceful Exit to Wave 1:** Final proof update + exit | Cite verified spins; dignified exit; no guilt | [ ] COMPLETED |
| **Day 12** | **TOUCH-3** | **Touch 3 Graceful Exit to Wave 2:** Final proof update + exit | Cite verified spins; dignified exit; no guilt | [ ] COMPLETED |
| **Day 13** | **REPLY** | Log all programmer responses; schedule 12-minute relationship calls | High-value phone sheets prepped (Lesson 5.1) | [ ] COMPLETED |
| **Day 14** | **MONITOR** | Move silent stations to Cold Archive; lock 90-day re-check dates | Zero emotional frustration; pipeline hygiene | [ ] COMPLETED |
| **Day 15** | **ADD** | **Post-Add Gratitude Protocol:** Dispatch 24h executive thank-yous | Sincere appreciation; zero commercial ask | [ ] COMPLETED |
| **Day 16** | **ADD** | Social Amplification: Tag station and DJ with station-first copy | Drive listeners to station stream / FM dial | [ ] COMPLETED |
| **Day 17** | **ADD** | Deliver studio sweeper drops; mail handwritten physical cards | Physical footprint on broadcast studio desk | [ ] COMPLETED |
| **Day 18** | **CASCADE** | **Cascade Expansion Loop (Corridor):** Pitch 5 adjacent sibling stations | Lead with confirmed add proof (Lesson 4.4) | [ ] COMPLETED |
| **Day 19** | **CASCADE** | **Cascade Expansion Loop (Format):** Pitch 5 college chart siblings | NACC format alignment; citation of spins | [ ] COMPLETED |
| **Day 20** | **CASCADE** | Rotation Upgrade Requests: Share local Shazam/ticket metrics | Request advancement from light to medium | [ ] COMPLETED |
| **Day 21** | **AUDIT** | Campaign Audit & Reconciliation: Transition allies to 30/10/10 | Airplay-to-Income ledger updated; Q+1 set | [ ] COMPLETED |
"""

q_content = """# THE QUARTERLY RELEASE CALENDAR — Annual Enterprise Operations

> **CONFIDENTIAL OPERATOR ASSET — FREQUENCY DOMINION**
> "Three disciplined releases per year beat twelve rushed drops every single time. The Quarterly Release Calendar synchronizes recording, broadcast promotion, tour routing, and revenue monetization across a dominant 12-month timeline."

---

## 12-MONTH ENTERPRISE RELEASE SCHEDULE

| Quarter | Focus Release | Target Impact Date | Campaign Start (T-8) | Campaign End (T+4) | Target Station Roster | Primary Monetization Lane | Audit & Ascension Date | Operational Status |
|---|---|---|---|---|---|---|---|---|
| **Quarter 1** | **Single 1 (Anchor Single)** | February 10, 2026 | December 15, 2025 | March 15, 2026 | 20 Scored Stations (Rings 1 & 2) | Lane 1: Live Concert Ticket Sales | April 01, 2026 | [ ] SCHEDULED |
| **Quarter 2** | **Single 2 (Expansion Cut)** | May 12, 2026 | March 15, 2026 | June 15, 2026 | 30 Stations (Cascade + Corridor) | Lane 3: DSP Algorithmic Velocity | July 01, 2026 | [ ] SCHEDULED |
| **Quarter 3** | **Single 3 (Summer Focus)** | September 15, 2026 | July 15, 2026 | October 15, 2026 | 40 Stations (National NACC / AAA) | Lane 2: Commercial Sync Briefs | October 15, 2026 | [ ] SCHEDULED |
| **Quarter 4** | **Harvest & Catalog Review** | November 10, 2026 | October 01, 2026 | December 15, 2026 | 30/10/10 Ally Engine Portfolio | Lane 4: Brand Tour Sponsorships | January 15, 2027 | [ ] SCHEDULED |

---

## THE 12-WEEK CAMPAIGN EXECUTION PHASES

```
[W1 - W2] Final Master & Audio Weapon Build (-14 LUFS, FCC Clean, 90s Weapon)
   ↓
[W3 - W4] Target Architecture & 100-Point Station Scoring (Lock 20 Targets)
   ↓
[W5 - W6] Staging Command Deck EPK, 3-Layer Subject Lines & 7-Gate Clearance
   ↓
[W7 - W8] Tour Pre-Roll & Live Venue Synchronization (T-21 Countdowns)
   ↓
[WEEK 9]  RADIO IMPACT WEEK: Wave 1 (Tue) + Wave 2 (Thu) Dispatch
   ↓
[WEEK 10] Touch 2 Value Drop (30s Hook Cut Delivered) + Dialogue Management
   ↓
[WEEK 11] Touch 3 Graceful Exit + Cascade Expansion Loops to Sibling Stations
   ↓
[WEEK 12] Thank-You Economy Protocol, Physical Cards, and 90-Day Audit Review
```
"""

CAL.mkdir(parents=True, exist_ok=True)
(CAL / "21-Day-Campaign-Calendar.md").write_text(c21_content.strip() + "\n", encoding="utf-8")
(CAL / "Quarterly-Release-Calendar.md").write_text(q_content.strip() + "\n", encoding="utf-8")
print("Generated 21-Day-Campaign-Calendar.md and Quarterly-Release-Calendar.md")
