#!/usr/bin/env python3
"""Generates comprehensive markdown templates for all 24 lessons
and removes legacy CSV files.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "Frequency-Dominion-Upsell"

sys.path.insert(0, str(ROOT / "scripts"))

from lessons_m1_m2 import DATA_M1_M2
from lessons_m3_m4 import DATA_M3_M4
from lessons_m5_m6 import DATA_M5_M6

ALL_DATA = {}
ALL_DATA.update(DATA_M1_M2)
ALL_DATA.update(DATA_M3_M4)
ALL_DATA.update(DATA_M5_M6)

TEMPLATE_NAMES = {
    "1.1": ("T1.1-Unheard-Tax-Audit", "Reach / Revenue / Leverage Tax Valuation Ledger"),
    "1.2": ("T1.2-Station-Customer-Brief", "Station Benchmark Compliance Matrix"),
    "1.3": ("T1.3-Proof-Stack-Inventory", "Proof Stack Inventory & Third-Party Credibility Vault"),
    "1.4": ("T1.4-No-Spam-Oath", "Signed Operator Covenant & Deliverability Checklist"),
    "2.1": ("T2.1-Hometown-Heat-Map", "4-Ring Concentric Station Targeting Map"),
    "2.2": ("T2.2-Tour-Preroll", "Tour Pre-Roll Synchronized Campaign Scheduler"),
    "2.3": ("T2.3-Format-Scorecard", "100-Point Station Format & Fit Scoring Algorithm"),
    "2.4": ("T2.4-20-Station-War-Room", "20-Station Operational Command Center Cockpit"),
    "3.1": ("T3.1-Subject-Line-Bank", "30-Formula 3-Layer Subject Line Testing Bank"),
    "3.2": ("T3.2-90-Word-Pitch", "6-Block Modular 90-Word Pitch Builder"),
    "3.3": ("T3.3-One-Page-EPK-Brief", "One-Page Command Deck EPK Content Brief"),
    "3.4": ("T3.4-Radio-Audio-Schedule", "Broadcast Audio Technical Deliverable Specification"),
    "4.1": ("T4.1-Load-Sequence-Checklist", "Seven-Gate Pre-Flight Launch Control Board"),
    "4.2": ("T4.2-First-Send-Wave", "Wave 1 & Wave 2 Launch Dispatch Log & Schedule"),
    "4.3": ("T4.3-Followup-Tracker", "3-Touch Follow-Up Cockpit & Value Escalation Log"),
    "4.4": ("T4.4-Expansion-Tracker", "Cascade Expansion Loop Regional Station Tracker"),
    "5.1": ("T5.1-12-Minute-Call-Sheet", "12-Minute Relationship Call Pre-Flight Briefing Sheet"),
    "5.2": ("T5.2-Thank-You-Ledger", "Thank-You Economy Gratitude Cascade & Ally Ledger"),
    "5.3": ("T5.3-Burned-Well-Repair-Log", "Burned-Well 5-Step Relationship Repair Protocol"),
    "5.4": ("T5.4-Ally-Engine-Tracker", "30/10/10 Relational Portfolio Compounding Engine"),
    "6.1": ("T6.1-Proof-Log", "Proof Compounding System & Airplay Mine Log"),
    "6.2": ("T6.2-Airplay-Income-Ledger", "Airplay-to-Income Attribution Ledger (Six Lanes)"),
    "6.3": ("T6.3-Release-Calendar", "12-Week Quarterly Release Campaign Master Calendar"),
    "6.4": ("T6.4-90-Day-Audit-Scorecard", "50-Point 90-Day Audit Scorecard & Ascension Dashboard")
}

def format_table(headers, rows):
    header_line = "| " + " | ".join(headers) + " |"
    sep_line = "| " + " | ".join(["---"] * len(headers)) + " |"
    row_lines = ["| " + " | ".join(r) + " |" for r in rows]
    return "\n".join([header_line, sep_line] + row_lines)

# Generate markdown templates
for k, data in ALL_DATA.items():
    if isinstance(k, tuple):
        mod_dir = k[0]
        num = k[1].split("-")[1]
    else:
        mod_dir = data["dir"]
        num = k
        
    t_stem, t_desc = TEMPLATE_NAMES[num]
    t_dir = COURSE / mod_dir / "Templates"
    t_dir.mkdir(parents=True, exist_ok=True)
    
    t_file = t_dir / f"{t_stem}.md"
    
    table_md = format_table(data["headers"], data["rows"])
    
    # Add blank rows for artist execution
    blank_rows = []
    for _ in range(3):
        blank_rows.append("| " + " | ".join(["[Enter Data]"] * len(data["headers"])) + " |")
    blank_table_md = "\n".join(blank_rows)
    
    one_line_truth = data.get("truth") or data.get("quote")
    
    content = f"""# TEMPLATE {num} — {t_desc.upper()}

> **CONFIDENTIAL OPERATOR TEMPLATE — FREQUENCY DOMINION**
> "{one_line_truth}"

---

## OPERATIONAL INSTRUCTIONS & EXECUTION STANDARD

1. **Review Benchmark Guidelines:** Examine the verified sample records in the benchmark grid below to calibrate your targets.
2. **Execute Drills in Sequence:** Complete this worksheet in conjunction with the implementation drills outlined in Lesson {num}.
3. **Log & Archive:** Maintain this completed document within your central command system. Unlogged campaigns are unmanaged campaigns.

---

## MASTER EXECUTION MATRIX

{table_md}

### BLANK FIELD OPERATIONAL LOG

Use the grid below to record your active campaign data:

| {" | ".join(data["headers"])} |
| {" | ".join(["---"] * len(data["headers"]))} |
{blank_table_md}

---

## QUALITY ASSURANCE CHECKLIST

- [ ] All required data fields populated with verified, real-world metrics.
- [ ] Named gatekeepers verified via direct station directories or Spinitron logs.
- [ ] Formats scored and checked against current station programming clocks.
- [ ] Follow-up dates locked in master calendar before initial sends.
"""
    t_file.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Generated {t_file.relative_to(COURSE)}")

print("All 24 markdown templates generated.")
