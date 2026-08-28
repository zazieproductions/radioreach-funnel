#!/usr/bin/env python3
"""Frequency Dominion — asset generator.

Generates: 24 fillable templates, heat-map databases, campaign calendars,
bonus trackers, and per-module community-prompt compilations.
Run with the system python3 (stdlib only).
"""
import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "Frequency-Dominion-Upsell"

MODULES = {
    "Module-1-Command-Identity": "Command Identity",
    "Module-2-Target-Architecture": "Target Architecture",
    "Module-3-The-Pitch-Weapon": "The Pitch Weapon",
    "Module-4-21-Day-Campaign": "The 21-Day Campaign",
    "Module-5-Human-Frequency": "Human Frequency",
    "Module-6-Empire-Loop": "Empire Loop",
}

EXAMPLE = "[EXAMPLE — replace]"


def write_csv(path: Path, header: list[str], rows: list[list[str]]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in rows:
            w.writerow(r)


def templates():
    t = COURSE / "Module-1-Command-Identity" / "Templates"
    write_csv(t / "T1.1-Unheard-Tax-Audit.csv",
        ["Category", "Item", "Current-Value", "Lost-Value", "Proof", "Tax-Amount", "Notes"],
        [["REACH", "Current adds (12 mo)", "0", "48", "Email history", "", "1 add/week projection"],
         ["REVENUE", "Airplay-driven ticket sales", "0", f"{EXAMPLE} $4,800", "Show records", "", "4 shows × $1,200"],
         ["LEVERAGE", "Deals/placement offers", "0", f"{EXAMPLE} $8,000", "Inbox", "", "Sync + sponsor paths"]])

    write_csv(t / "T1.2-Station-Customer-Brief.csv",
        ["Station", "Song-Title", "Artist", "BPM", "Energy", "Story", "Slot-Position", "Your-Song", "Your-BPM", "Your-Energy", "Gap", "Fix"],
        [[f"{EXAMPLE} KXYZ"  , "Benchmark 1"  , "Artist A", "92", "Mid", "Local origin", "7pm block", "My single", "78", "Loud", "BPM warmth", "Re-edit to 92"],
         [f"{EXAMPLE} KXYZ"  , "Benchmark 2"  , "Artist B", "96", "High", "Touring act", "9pm block", "My single", "78", "Loud", "Energy", "Add live track"],
         [f"{EXAMPLE} KXYZ"  , "Benchmark 3"  , "Artist C", "90", "Mid", "College tie", "Midday", "My single", "78", "Loud", "Story", "Local angle"]])

    write_csv(t / "T1.3-Proof-Stack-Inventory.csv",
        ["Receipt", "Date", "Source", "Medium", "Tier", "Proof-Line", "Market", "File-Path", "Status"],
        [[f"{EXAMPLE} Spin on college show", "2026-01-12", "WXYC 89.3", "Recording + log", "Tier 1", "Played in rotation, Chapel Hill", "Chapel Hill, NC", "proof/01/xyz.mp3", "Logged"],
         ["Press feature", "2026-01-20", "Local blog", "Link", "Tier 1", "Featured + quoted by staff writer", "Austin, TX", "proof/01/feature.png", "Logged"],
         ["Playlist placement", "2026-02-01", "Indie playlist", "Screenshot", "Tier 2", "40K followers, 3 tracks", "National", "proof/02/playlist.png", "Logged"]])

    # Module 2 templates
    t = COURSE / "Module-2-Target-Architecture" / "Templates"
    write_csv(t / "T2.1-Hometown-Heat-Map.csv",
        ["ID", "Station", "Callsign", "Market", "State", "Ring", "Platform", "Format", "Decision-Maker", "Contact", "Score", "Status", "Story-Angle", "Source"],
        [[1, f"{EXAMPLE} Studio station", "KXYZ", "Home", "TX", "1", "Commercial", "Alt", "MD Jane", "jane@", "TBD", "Mapped", "Local single release", "station site"],
         [2, f"{EXAMPLE} College station", "WCXN", "Home", "TX", "1", "College", "Variety", "Music director", "md@", "TBD", "Mapped", "Alumni tie", "campus site"],
         [3, f"{EXAMPLE} Online station", "WEB", "Home", "TX", "1", "Online", "Indie", "Founder", "info@", "TBD", "Mapped", "Genre fit", "site"]])

    write_csv(t / "T2.2-Tour-Preroll.csv",
        ["Date", "Venue", "City", "Capacity", "Market", "Ring", "T-21", "T-14", "T-10", "T-7", "T-4", "Show-Night", "Telegram", "Proof-Logged"],
        [["2026-05-14", "The Room", "Home", "300", "Home", "1", f"{EXAMPLE} announced", "asset shot", "Wave 1 (5 stations)", "Touch 2", "Touch 3", "PD guest list", "Draft", "Yes"],
         ["2026-06-02", "B-Side", "City 2", "120", "Metro", "2", "announced", "asset shot", "pre-roll", "value touch", "grace close", "invite", "sent", "Yes"]])

    write_csv(t / "T2.3-Format-Scorecard.csv",
        ["Station", "Market", "Tempo", "Energy", "Lyrics", "Length", "Intro", "Language", "Artist-Name", "Title-Safe", "Production", "Slot-Position", "Story", "Proof", "FIT-TOTAL(12)",
         "Format-Fit(30)", "Relationship(15)", "Local-Tie(10)", "Timing(10)", "Reach(10)", "Response(25)", "TOTAL(100)", "Tier", "Fix-or-Filter"],
        [["KXYZ", "Home", "OK", "High", "OK", "OK", "OK", "Clean", "OK", "OK", "OK", "OK", "OK", "OK", "10",
          "28", "12", "9", "8", "7", "20", "84", "A", "Fix timing"],
         ["WCXN", "Home", "OK", "Mid", "OK", "OK", "OK", "Clean", "OK", "OK", "OK", "OK", "OK", "OK", "11",
          "25", "10", "10", "9", "5", "15", "74", "B", "Fix response"],
         ["WEB1", "Home", "OK", "High", "OK", "OK", "OK", "Clean", "OK", "OK", "OK", "OK", "OK", "OK", "11",
          "26", "5", "7", "8", "3", "10", "59", "B", "Fix relationship"]])

    write_csv(t / "T2.4-20-Station-War-Room.csv",
        ["Station", "Market", "Format", "Score", "Decision-Maker", "Contact", "Channel", "Status", "Next-Action", "Next-Date", "Notes"],
        [["KXYZ", "Home", "Alt", "84", "MD Jane", "jane@kxyz.fm", "Email", "LOADED", "Wave 1 send", "2026-05-12", "Proof stack up to date"],
         ["WCXN", "Home", "College", "74", "Music Director", "md@wcxn.org", "DM", "MONITOR", "Verify contact", "2026-05-15", "No email found"],
         ["WEB1", "Home", "Online", "59", "Founder", "info@web1.fm", "Email", "WAVE-1", "Touch 2 asset", "2026-05-16", "Send crowd clip"]])

    # Module 3 templates
    t = COURSE / "Module-3-The-Pitch-Weapon" / "Templates"

    # Module 4 templates
    t4 = COURSE / "Module-4-21-Day-Campaign" / "Templates"
    write_csv(t / "T3.1-Subject-Line-Bank.csv",
        ["Date", "Station", "Market", "Subject", "Engine", "Layer-1", "Layer-2", "Layer-3", "Opened", "Replied", "Notes"],
        [["2026-05-12", "KXYZ", "Home", "Local artist, 450 tickets", "Proof", "Name", "Format", "City", "Yes", "No", "Test 1"],
         ["2026-05-12", "WCXN", "Home", "Your 7pm block, 3:12 edit", "Interest", "Name", "Show", "Slot", "Yes", "Yes", "Winner"],
         ["2026-05-12", "WEB1", "Home", "Quick one about the show", "Human", "Name", "Station", "Show", "Yes", "No", "Soft"]])

    write_csv(t / "T3.3-One-Page-EPK-Brief.csv",
        ["Block", "Element", "Copy", "Asset", "Link", "Approved", "Notes"],
        [["1", "Photo", "Live stage shot", "proof/photo-live.jpg", "", "No", "Needs crop"],
         ["2", "Name + genre line", "Artist Name — dark indie pop", "text", "", "No", "One genre only"],
         ["3", "Three receipts", "2,100 streams · 450 tickets · 3 press", "text", "links", "No", "Refresh quarterly"],
         ["4", "Music", "90-sec promo + radio edit", "audio files", "drive", "No", "Under 10MB"],
         ["5", "Press + logos", "3 logos, verifiable", "logos.png", "", "No", "Verify sources"],
         ["6", "Logistics", "contact, city, dates, socials", "text", "", "No", "Mobile-check"]])

    write_csv(t / "T3.4-Radio-Audio-Schedule.csv",
        ["File", "Version", "Duration", "LUFS", "True-Peak", "Format", "Size(MB)", "Filename", "Metadata", "Host", "Link"],
        [["Radio promo", "90-sec", "1:30", "-14", "-1.0 dBTP", "WAV + MP3", "9.4", "ARTIST-SONG-90SEC", "filled", "Drive", "https://..."],
         ["Radio edit", "Clean", "3:12", "-14", "-1.0 dBTP", "WAV + MP3", "34", "ARTIST-SONG-CLEAN", "filled", "Drive", "https://..."],
         ["Payload", "30-sec", "0:30", "-14", "-1.0 dBTP", "MP3", "3.1", "ARTIST-SONG-30SEC", "filled", "Drive", "https://..."]])

    t = COURSE / "Module-4-21-Day-Campaign" / "Templates"
    header7 = ["Station", "Score", "G1-Contact", "G2-Proof-Live", "G3-Audio-Package", "G4-Pitch-Variant", "G5-Local-Story", "G6-Warroom-Row", "G7-Receipt", "Blocker", "Owner", "Due", "Load-Order", "Firing-Date"]
    write_csv(t / "T4.1-Load-Sequence-Checklist.csv", header7,
        [["KXYZ", "84", "PASS", "PASS", "PASS", "PASS", "PASS", "PASS", "PASS", "None", "Artist", "2026-05-10", "1", "2026-05-12"],
         ["WCXN", "74", "FAIL", "PASS", "PASS", "PASS", "PASS", "PASS", "PASS", "Contact unverified", "Artist", "2026-05-11", "2", "2026-05-14"],
         ["WEB1", "59", "PASS", "PASS", "PASS", "PASS", "FAIL", "PASS", "PASS", "No local story", "Artist", "2026-05-11", "3", "2026-05-14"]])

    write_csv(t / "T4.2-First-Send-Wave.csv",
        ["Station", "Wave", "Date", "Local-Send-Time", "Sender", "Subject", "Opened", "Clicked", "Replied", "Bounced", "Diagnostic"],
        [["KXYZ", "1", "2026-05-12", "09:10 local", "Artist", "Local artist, 450 tickets", "Yes", "Yes", "No", "No", "Pitch body"],
         ["WCXN", "1", "2026-05-12", "09:20 local", "Artist", "Your 7pm block, 3:12 edit", "Yes", "No", "Yes", "No", "Winner — call"],
         ["WEB1", "2", "2026-05-14", "09:10 local", "Artist", "Quick one about the show", "No", "—", "No", "No", "Rewrite engine"]])

    write_csv(t / "T4.3-Followup-Tracker.csv",
        ["Station", "Wave", "Touch-1-Date", "Touch-2-Date", "Touch-2-Value", "Touch-3-Date", "Reply", "Next-Action", "Status"],
        [["KXYZ", "1", "2026-05-12", "2026-05-16", "450-ticket crowd clip", "2026-05-20", "No", "MONITOR 90d", "Touch 3 done"],
         ["WCXN", "1", "2026-05-12", "2026-05-16", "New 30-sec cutdown", "2026-05-20", "Yes — 7pm slot", "12-min call", "REPLY"],
         ["WEB1", "2", "2026-05-14", "2026-05-18", "Acoustic version", "2026-05-22", "No", "Grace close draft", "TOUCH-3"]])

    write_csv(t / "T4.4-Expansion-Tracker.csv",
        ["Add-Date", "Station", "Market", "Sister-Ask", "Repeat-Ask", "Referral-Ask", "Outcome", "Cascade-1", "Cascade-2", "Cascade-3", "Proof-Logged"],
        [["2026-05-20", "WCXN", "Home", "Sister college WYYZ", "Next slot?", "Warm intro", "Yes", "WYYZ", "WZKQ", "WLMN", "Yes"],
         ["2026-05-24", "KXYZ", "Home", "Partner alt KABC", "Weekend rotation", "None yet", "Partial", "KABC", "—", "—", "Yes"]])

    t = COURSE / "Module-5-Human-Frequency" / "Templates"
    write_csv(t / "T5.1-12-Minute-Call-Sheet.csv",
        ["Station", "Contact", "Show", "Format", "Observation", "Listen-Q1", "Listen-Q2", "One-Ask", "Next-Step", "Call-Date", "Outcome", "Follow-Through"],
        [["WCXN", "Music Director", "Local Hour", "College", "Plays 3 local artists/wk", "What's exciting this quarter?", "What does a new track need?", "7pm slot this month?", "Confirm date + send WAV", "2026-05-22", "Yes", "4h email + 24h log"],
         ["KXYZ", "MD Jane", "Alt Block", "Alt", "Heavy local focus", "Q2 gaps?", "Format needs", "Add to weekend rotation?", "Send clean edit", "2026-05-26", "Follow-up", "Awaiting"]])

    write_csv(t / "T5.2-Thank-You-Ledger.csv",
        ["Station", "Contact", "Add-Date", "Thank-You-Sent", "Asset", "Asset-Date", "Ask", "Ask-Date", "Response", "Next-Action"],
        [["WCXN", "Music Director", "2026-05-20", "2026-05-21", "Social clip + ID", "2026-05-28", "Repeat slot", "2026-06-17", "Yes — Friday 7pm", "Asset #2"],
         ["KXYZ", "MD Jane", "2026-05-24", "2026-05-25", "Listener tickets", "2026-06-01", "Weekend rotation", "2026-06-21", "Pending", "Check-in 7d"]])

    write_csv(t / "T5.3-Burned-Well-Repair-Log.csv",
        ["Station", "Burn-Type", "Cause", "Cooling-Start", "Signal-Date", "Bridge", "Re-Entry-Ask", "Outcome", "Recheck-Date"],
        [["WOLD-FM", "Spam", "Blasted 18K list twice", "2026-05-01", "2026-08-01", "Honest 60-word bridge", "One specialty slot", "Awaiting", "2027-05-01"],
         ["WKLY", "Ghost", "Promised follow-up, vanished", "2026-05-01", "2026-08-01", "Value asset + no ask", "Re-add pitch", "Awaiting", "2027-05-01"]])

    write_csv(t / "T5.4-Ally-Engine-Tracker.csv",
        ["Ally", "Station", "Market", "Tier", "Last-Touch", "Next-Touch", "Asset-Given", "Asks-Made", "Response", "Notes"],
        [["MD Jane", "KXYZ", "Home", "ACTIVE", "2026-06-01", "2026-06-20", "Tickets", "1", "Yes", "Weekend rotation"],
         ["Music Dir.", "WCXN", "Home", "ALLy", "2026-05-28", "2026-06-15", "Clip + ID", "0", "—", "Asset balance high"],
         ["Founder", "WEB1", "Home", "WARM", "2026-05-22", "2026-06-30", "Premiere", "0", "—", "Next single early"]])

    t = COURSE / "Module-6-Empire-Loop" / "Templates"
    write_csv(t / "T6.1-Proof-Log.csv",
        ["Date", "Station", "Market", "Show", "Slot", "Song", "Link", "Screenshot", "Graphic", "Clip", "Quote", "Deployed"],
        [["2026-05-20", "WCXN", "Home", "Local Hour", "7:00pm", "Single A", "stream link", "proof/20.png", "proof/20-g.png", "proof/20.mp4", "MD: 'local favorite'", "FB + EPK"],
         ["2026-05-24", "KXYZ", "Home", "Alt Block", "9:30pm", "Single A", "stream link", "proof/24.png", "proof/24-g.png", "proof/24.mp4", "Hot rotation", "Email + EPK"]])

    write_csv(t / "T6.2-Airplay-Income-Ledger.csv",
        ["Date", "Add-Station", "Lane", "Event", "Amount", "Proof-Link", "Notes"],
        [["2026-06-02", "WCXN", "Tickets", "Show pre-sale", "1,200", "firefly link", "Listener code"],
         ["2026-06-10", "KXYZ", "Streams", "Spike + saves", "410 units", "report link", "Attributed 30d"],
         ["2026-06-18", "WCXN", "Placement", "Podcast ad license", "2,500", "contract", "Supervisor cited spins"]])

    write_csv(t / "T6.3-Release-Calendar.csv",
        ["Release", "Date", "W-12", "W-8-Proof", "W-8-Targets", "W-6-Weapons", "W-4-Load", "W-2-Preroll", "W-0-Launch", "W+1-Followup", "W+2-Harvest", "Targets-Armed", "Revenue-Lane"],
        [["Single 1", "2026-09-11", "2026-06-20", "2026-07-18", "2026-07-18", "2026-08-01", "2026-08-15", "2026-08-28", "2026-09-11", "2026-09-18", "2026-09-25", "20", "Tickets"],
         ["Single 2", "2026-12-04", "2026-09-12", "2026-10-10", "2026-10-10", "2026-10-24", "2026-11-07", "2026-11-20", "2026-12-04", "2026-12-11", "2026-12-18", "30", "Placements"]])

    write_csv(t / "T6.4-90-Day-Audit-Scorecard.csv",
        ["Column", "Score-1-10", "Data", "Finding", "Next-90-Day-Plan"],
        [["Momentum", "7", f"{EXAMPLE} 6 adds, 18 replies", "Solid", "Push to 10 adds"],
         ["Reach", "6", f"{EXAMPLE} 20 stations, 2 markets", "Narrow", "Open market 3"],
         ["Revenue", "3", f"{EXAMPLE} $1,200 tickets only", "WEAKEST", "Build placement lane"],
         ["Relationship", "7", f"{EXAMPLE} 30/10/8", "Healthy", "2 intros/month"],
         ["System", "5", f"{EXAMPLE} 2 gates missed", "Slipping", "Fix load gates"]])


def heat_map_300(path: Path, with_examples: bool):
    header = ["ID", "Station", "Callsign", "Market", "State", "Ring", "Platform", "Format", "Decision-Maker", "Contact", "Score", "Status", "Story-Angle", "Source"]
    seeded = [
        ("KEXP", "Seattle", "WA"), ("KCRW", "Santa Monica", "CA"), ("KROQ", "Los Angeles", "CA"),
        ("KPFK", "Los Angeles", "CA"), ("KCSN", "Northridge", "CA"), ("KALX", "Berkeley", "CA"),
        ("KDVS", "Davis", "CA"), ("KUCI", "Irvine", "CA"), ("KUSC", "Los Angeles", "CA"),
        ("KUTX", "Austin", "TX"), ("KVRX", "Austin", "TX"), ("WNUR", "Evanston", "IL"),
        ("WXPN", "Philadelphia", "PA"), ("WKDU", "Philadelphia", "PA"), ("WNYC", "New York", "NY"),
        ("WQHT", "New York", "NY"), ("WBLS", "New York", "NY"), ("WKCR", "New York", "NY"),
        ("WFUV", "Bronx", "NY"), ("WPRB", "Princeton", "NJ"), ("WERS", "Boston", "MA"),
        ("WMBR", "Cambridge", "MA"), ("WRPI", "Troy", "NY"), ("WMUC", "College Park", "MD"),
        ("WTUL", "New Orleans", "LA"), ("WUVT", "Blacksburg", "VA"), ("WKNC", "Raleigh", "NC"),
        ("WXYC", "Chapel Hill", "NC"), ("WREK", "Atlanta", "GA"), ("WRAS", "Atlanta", "GA"),
        ("WDBM", "East Lansing", "MI"), ("WXRT", "Chicago", "IL"), ("WBEZ", "Chicago", "IL"),
        ("WRIU", "Kingston", "RI"), ("WUSB", "Stony Brook", "NY"), ("WLOY", "Baltimore", "MD"),
        ("KALW", "San Francisco", "CA"), ("KMHD", "Portland", "OR"), ("KEXP-PDX", "Portland", "OR"),
        ("WFPK", "Louisville", "KY"), ("WTMD", "Towson", "MD"), ("WFMU", "Jersey City", "NJ"),
    ]
    rows = []
    for i in range(1, 301):
        if i <= len(seeded):
            cs, market, state = seeded[i - 1]
            rows.append([i, "", cs, market, state, "", "", "", "", "", "", "MAPPED", "", "seed — verify + fill"])
        else:
            rows.append([i, "", "", "", "", "", "", "", "", "", "", "RESEARCH", "", ""])
    write_csv(path, header, rows)


def calendars():
    c = COURSE / "Resources" / "Calendars"
    header = ["Day", "Phase", "Task", "Status", "Done-Date", "Notes"]
    plan = [
        (1, "LOAD", "Verify contacts + fill war room rows 1–10", "", "", ""),
        (2, "LOAD", "Verify contacts + fill war room rows 11–20", "", "", ""),
        (3, "LOAD", "Final seven-gate audit + blockers board", "", "", ""),
        (4, "FIRE", "Wave 1 — top 10, Tuesday 9–11am local", "", "", ""),
        (5, "WATCH", "24h diagnostics: opens, clicks, bounces", "", "", ""),
        (6, "WATCH", "Log outcomes; prep touch-2 value assets", "", "", ""),
        (7, "FIRE", "Wave 2 — next 10, Thursday 9–11am local", "", "", ""),
        (8, "TOUCH-2", "Touch 2 (value + receipt) to wave 1", "", "", ""),
        (9, "TOUCH-2", "Touch 2 to wave 2", "", "", ""),
        (10, "WATCH", "Reply handling: resend/answer under 12h", "", "", ""),
        (11, "TOUCH-3", "Grace close to wave 1 (day 8)", "", "", ""),
        (12, "TOUCH-3", "Grace close to wave 2", "", "", ""),
        (13, "REPLY", "All replies logged; calls scheduled", "", "", ""),
        (14, "MONITOR", "Move silent stations to MONITOR + recheck", "", "", ""),
        (15, "ADD", "Post-add protocol: 24h thank-yous", "", "", ""),
        (16, "ADD", "48h public acknowledgements", "", "", ""),
        (17, "ADD", "72h ALLY rows + proof stack entries", "", "", ""),
        (18, "CASCADE", "Sister-station asks", "", "", ""),
        (19, "CASCADE", "Repeat-support asks", "", "", ""),
        (20, "CASCADE", "Referral asks + intro web", "", "", ""),
        (21, "AUDIT", "Campaign audit + next market loop", "", "", ""),
    ]
    write_csv(c / "21-Day-Campaign-Calendar.csv", header, [list(p) for p in plan])

    qheader = ["Quarter", "Release", "Release-Date", "Campaign-Start", "Campaign-End", "Proof-Build", "Target-Range", "Revenue-Lane", "Audit-Date", "Status"]
    write_csv(c / "Quarterly-Release-Calendar.csv", qheader, [
        ["Q1", "Single 1", "2026-01-30", "2026-01-01", "2026-03-01", "2025-12-15", "20 stations", "Tickets", "2026-04-01", ""],
        ["Q2", "Single 2", "2026-05-01", "2026-03-01", "2026-05-30", "2026-02-15", "30 stations", "Streams", "2026-07-01", ""],
        ["Q3", "Single 3", "2026-09-11", "2026-06-20", "2026-10-05", "2026-05-15", "40 stations", "Placements", "2026-10-15", ""],
        ["Q4", "Harvest + Audit", "—", "2026-10-15", "2026-12-31", "2026-10-01", "Cascade + re-adds", "Sponsorship", "2027-01-15", ""],
    ])


def community_compilations():
    for mod, title in MODULES.items():
        lessons_dir = COURSE / mod / "Lessons"
        prompts = []
        for lesson in sorted(lessons_dir.glob("*.md")):
            md = lesson.read_text(encoding="utf-8")
            m = re.search(r"## COMMUNITY PROMPTS(.*)", md, re.S)
            if not m:
                continue
            title_m = re.search(r"^# (.+)$", md, re.M)
            prompts.append(f"\n### {title_m.group(1) if title_m else lesson.stem}\n" + m.group(1).strip())
        (COURSE / mod / "Community-Prompts" / f"{mod}-Community-Prompts.md").write_text(
            f"# {title} — Community Prompts\n\nEngagement prompts for the member group. Post, tag, hold each other accountable. "
            "Zero-vibe rule: data or it didn't happen.\n\n" + "\n".join(prompts) + "\n", encoding="utf-8")


def module_overviews():
    for mod, title in MODULES.items():
        lessons = sorted((COURSE / mod / "Lessons").glob("*.md"))
        names = [re.search(r"^# (.+)$", l.read_text(encoding="utf-8"), re.M).group(1) for l in lessons]
        body = "\n".join(f"- {n}" for n in names)
        (COURSE / mod / f"{mod}-OVERVIEW.md").write_text(
            f"# {title} — Module Overview\n\n{body}\n\n"
            "**Every lesson contains:** full video script, implementation drills, fillable template, "
            "war-room notes PDF, and community prompts.\n", encoding="utf-8")


def bonuses():
    b = COURSE / "Bonuses"
    (b / "Bonus-1-Hometown-Heat-Map-Database").mkdir(parents=True, exist_ok=True)
    heat_map_300(b / "Bonus-1-Hometown-Heat-Map-Database" / "Hometown-Heat-Map-300-Rows.csv", True)
    (b / "Bonus-1-Hometown-Heat-Map-Database" / "README.md").write_text(
        "# Bonus 1 — The 300-Station Hometown Heat Map Database\n\n"
        "300 rows, ready for your full-country targeting map. Rows 1–42 are seeded well-known "
        "callsigns (markets only — verify each station's current format, decision-maker, and contact). "
        "Rows 43–300 are research slots. Use Module 2.1–2.3 for the filling protocol.\n", encoding="utf-8")

    b4 = b / "Bonus-4-90-Day-Audit-Engine"
    b4.mkdir(parents=True, exist_ok=True)
    write_csv(b4 / "90-Day-Audit-Scorecard.csv",
        ["Column", "Score-1-10", "Data", "Finding", "Next-90-Day-Plan"],
        [["Momentum", "", "", "", ""], ["Reach", "", "", "", ""], ["Revenue", "", "", "", ""],
         ["Relationship", "", "", "", ""], ["System", "", "", "", ""], ["TOTAL", "", "", "", ""]])
    write_csv(b4 / "Daily-Spin-Log.csv",
        ["Date", "Station", "Market", "Show", "Slot", "Song", "Link", "Screenshot", "Notes"], [])
    write_csv(b4 / "Weekly-Touch-Log.csv",
        ["Week", "Station", "Touch-Type", "Date", "Value-Added", "Reply", "Next-Action"], [])
    write_csv(b4 / "Airplay-Income-Ledger.csv",
        ["Date", "Add-Station", "Lane", "Event", "Amount", "Proof-Link", "Notes"], [])
    (b4 / "README.md").write_text(
        "# Bonus 4 — The 90-Day Airplay-to-Income Audit Engine\n\n"
        "Five files: the scorecard (Module 6.4), daily spin log, weekly touch log, and airplay income ledger. "
        "Run the audit every 90 days: pull data, score 1–10 per column, name the weakest column, plan the next quarter.\n", encoding="utf-8")

    b5 = b / "Bonus-5-Resources"
    b5.mkdir(parents=True, exist_ok=True)
    (b5 / "README.md").write_text(
        "# Bonus 5 — The Entire Resource Arsenal\n\n"
        "Heat maps, campaign calendars, 30 subject-line formulas, the 90-word pitch vault, 3-touch follow-up "
        "sequences, and the 12-month CRM ladder live in the `Resources/` folder of this package.\n", encoding="utf-8")


def resources_aux():
    r = COURSE / "Resources"
    heat_map_300(r / "Heat-Maps" / "Hometown-Heat-Map-300.csv", True)
    (r / "Heat-Maps" / "README.md").write_text(
        "# Heat Maps\n\nHometown-Heat-Map-300.csv — the full targeting map. Fill per Module 2.1–2.3.\n", encoding="utf-8")
    (r / "Follow-Up" / "README.md").write_text(
        "# Follow-Up\n\nSee 3-Touch-Follow-Up-Sequences-and-Templates.md — the complete system.\n", encoding="utf-8")


if __name__ == "__main__":
    templates()
    calendars()
    community_compilations()
    module_overviews()
    bonuses()
    resources_aux()
    print("Assets generated.")
