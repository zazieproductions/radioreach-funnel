#!/usr/bin/env python3
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

print(f"Total lesson entries loaded: {len(ALL_DATA)}")

def format_table(headers, rows):
    header_line = "| " + " | ".join(headers) + " |"
    sep_line = "| " + " | ".join(["---"] * len(headers)) + " |"
    row_lines = ["| " + " | ".join(r) + " |" for r in rows]
    return "\n".join([header_line, sep_line] + row_lines)

written = 0
for k, data in ALL_DATA.items():
    if isinstance(k, tuple):
        mod_dir, filename = k
    else:
        mod_dir = data["dir"]
        filename = data["file"]
        
    dest_path = COURSE / mod_dir / "Lessons" / filename
    dest_path.parent.mkdir(parents=True, exist_ok=True)
        
    table_md = format_table(data["headers"], data["rows"])
    comm_prompts_md = "\n".join(f"{idx+1}. {p}" for idx, p in enumerate(data["community"]))
    one_line_truth = data.get("truth") or data.get("quote")
    
    content = f"""# {data["title"]}

> **THE ONE-LINE TRUTH:** {one_line_truth}

## MASTERCLASS DIRECTIVE & STRATEGIC BLUEPRINT

{data["doctrine"]}

## IMPLEMENTATION DRILLS & PASS STANDARDS

{data["drills"]}

## ACTION WORKSHEET & OPERATIONAL PROTOCOL

**Protocol Document:** `{data["worksheet_title"]}`

Complete the structured table below as part of your lesson implementation. This worksheet directly replaces legacy spreadsheets with a publication-grade execution protocol.

{table_md}

## WAR-ROOM NOTES

<!-- WARROOM:START -->
**WAR-ROOM DIRECTIVE — {data["title"]}**

{data["warroom"]}
<!-- WARROOM:END -->

## FREQUENCY DOMINION COMMUNITY DRILLS

{comm_prompts_md}
"""
    dest_path.write_text(content.strip() + "\n", encoding="utf-8")
    written += 1
    print(f"[{written:02d}/24] Wrote {dest_path.relative_to(COURSE)} ({len(content.splitlines())} lines)")

print(f"Successfully generated all {written} lesson files!")
