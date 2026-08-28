#!/usr/bin/env python3
"""Frequency Dominion — Master PDF Typesetting Pipeline.

Rebuilds the entire PDF suite for Frequency Dominion using the Typst engine:
- Full Obsidian Ink / Electric Acid print design system (#0a0a0f / #ffe600).
- Zero text overlap by construction via Typst layout calculus.
- High-contrast, mathematically legible typography (no yellow-on-white text).
- 24 War-Room Dossier PDFs (Lessons + Drills + Protocols + War-Room Directives).
- 8 Executive PDFs (Playbooks + Insider Decoder + 24-Lesson Insider Edge).
- 1 Course Overview PDF (Full System Blueprint & Delivery Guide).
- 5 Bonus PDFs (Heat Map 300, Audio Script Vault, EPK Deck, Audit Engine, Resources).
- 8 Resource PDFs (Calendars, Pitch Weapons, Follow-up sequences, Playbooks).
- 24 Standalone Action Worksheet PDFs in Templates/.

Total output: 70 publication-grade PDFs spanning 180+ pages.
"""
import os
import re
import sys
from pathlib import Path

try:
    import typst
    import pymupdf
except ImportError:
    print("Error: typst and pymupdf must be installed. Run with /tmp/pdfenv/bin/python.")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "Frequency-Dominion-Upsell"


def escape_typst_text(text: str) -> str:
    """Escapes special Typst syntax tokens in text content."""
    text = text.replace("\\", "\\\\")
    text = text.replace("//", r"\/\/")
    text = text.replace("/*", r"\/\*")
    text = text.replace("*/", r"\*\/")
    text = text.replace("#", "\\#")
    text = text.replace("$", "\\$")
    text = text.replace("@", "\\@")
    text = text.replace("<", "\\<")
    text = text.replace(">", "\\>")
    text = text.replace("[", "\\[")
    text = text.replace("]", "\\]")
    return text


def format_inline_markdown(text: str) -> str:
    """Converts inline markdown formatting to Typst elements while protecting code spans."""
    parts = text.split("`")
    for idx in range(0, len(parts), 2):
        p = escape_typst_text(parts[idx])
        p = re.sub(r"\*\*(.*?)\*\*", r"#strong[\1]", p)
        p = re.sub(r"(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)", r"#emph[\1]", p)
        p = re.sub(r"(#(?:strong|emph)\[.*?\])\(", r"\1 (", p)
        parts[idx] = p
    return "`".join(parts)


def md_to_typst(md_content: str, doc_category: str, doc_title: str, is_database: bool = False) -> str:
    """Transforms markdown text into a self-contained Typst document."""
    # Strip HTML comments entirely
    md_content = re.sub(r"<!--.*?-->", "", md_content, flags=re.DOTALL)
    lines = md_content.splitlines()
    out = []

    # Choose typography scale and margins
    page_margin = "(top: 22mm, bottom: 18mm, left: 14mm, right: 14mm)" if is_database else "(top: 24mm, bottom: 20mm, left: 16mm, right: 16mm)"
    base_font_size = "8pt" if is_database else "9.5pt"
    body_leading = "0.65em" if is_database else "0.75em"

    clean_category = escape_typst_text(doc_category.upper())
    clean_title_short = escape_typst_text(doc_title[:38])

    # Header & Footer Template
    out.append(f"""#set page(
  paper: "a4",
  fill: rgb("#0a0a0f"),
  margin: {page_margin},
  header: context {{
    let page_number = counter(page).get().first()
    if page_number > 1 [
      #grid(
        columns: (1fr, 1fr),
        align(left)[
          #text(fill: rgb("#ffe600"), size: 7.5pt, weight: "bold", tracking: 0.1em)[RADIOREACH · FREQUENCY DOMINION]
          #text(fill: rgb("#666675"), size: 7.5pt)[ · {clean_category}]
        ],
        align(right)[
          #text(fill: rgb("#9fa0aa"), size: 7.5pt, weight: "medium")[{clean_title_short}]
        ]
      )
      #v(-4pt)
      #line(length: 100%, stroke: 0.5pt + rgb("#ffe600"))
    ]
  }},
  footer: context {{
    let page_number = counter(page).get().first()
    let total_pages = counter(page).final().first()
    line(length: 100%, stroke: 0.5pt + rgb("#22222e"))
    v(3pt)
    grid(
      columns: (2.5fr, 1fr),
      align(left)[
        #text(fill: rgb("#555562"), size: 7.5pt, tracking: 0.08em)[CONFIDENTIAL · OPERATOR DIRECTIVE · NOT FOR REDISTRIBUTION]
      ],
      align(right)[
        #text(fill: rgb("#ffe600"), size: 7.5pt, weight: "bold")[PAGE #page_number OF #total_pages]
      ]
    )
  }}
)

#set text(
  font: "DejaVu Sans",
  size: {base_font_size},
  fill: rgb("#ebebf0"),
  spacing: 115%,
  lang: "en"
)

#set par(
  justify: true,
  leading: {body_leading},
  first-line-indent: 0pt
)

#show heading.where(level: 2): it => block(spacing: 11pt)[
  #text(fill: rgb("#ffe600"), weight: "bold", size: 11.5pt)[#it.body]
  #v(-4pt)
  #line(length: 100%, stroke: 0.35pt + rgb("#333345"))
]

#show heading.where(level: 3): it => block(spacing: 9pt)[
  #text(fill: rgb("#ffffff"), weight: "bold", size: 9.5pt)[#it.body]
]
""")

    in_table = False
    table_rows = []

    def flush_table():
        nonlocal in_table, table_rows
        if not table_rows:
            in_table = False
            return

        cols = len(table_rows[0])
        # Auto-compute column proportions
        if cols == 9 and is_database:
            col_spec = "(0.5fr, 1.3fr, 1.2fr, 0.6fr, 0.9fr, 1.4fr, 1.3fr, 1.5fr, 2.2fr)"
            inset_val = "4pt"
            cell_size = "7pt"
        elif cols == 7:
            col_spec = "(1.1fr, 1.2fr, 1.1fr, 1.2fr, 1fr, 1.2fr, 1.5fr)"
            inset_val = "4.5pt"
            cell_size = "7.5pt"
        elif cols == 6:
            col_spec = "(1.3fr, 1.4fr, 1.2fr, 1.4fr, 1.2fr, 1.5fr)"
            inset_val = "5pt"
            cell_size = "8pt"
        elif cols == 5:
            col_spec = "(1.4fr, 1.3fr, 1.6fr, 1.4fr, 1.8fr)"
            inset_val = "5.5pt"
            cell_size = "8pt"
        elif cols == 4:
            col_spec = "(1.5fr, 1.8fr, 1.4fr, 1.4fr)"
            inset_val = "6pt"
            cell_size = "8.5pt"
        elif cols == 3:
            col_spec = "(1.5fr, 2fr, 2fr)"
            inset_val = "6pt"
            cell_size = "8.5pt"
        elif cols == 2:
            col_spec = "(1.5fr, 3.5fr)"
            inset_val = "6pt"
            cell_size = "8.5pt"
        else:
            col_spec = f"({', '.join(['1fr'] * cols)})"
            inset_val = "5pt"
            cell_size = "8pt"

        out.append(f"""#table(
  columns: {col_spec},
  fill: (col, row) => if row == 0 {{ rgb("#1f1f2c") }} else if calc.even(row) {{ rgb("#111117") }} else {{ rgb("#161620") }},
  stroke: (col, row) => 0.4pt + rgb("#2b2b3b"),
  inset: {inset_val},
  align: (col, row) => if row == 0 {{ center + horizon }} else {{ left + horizon }},""")

        for r_idx, row in enumerate(table_rows):
            # Pad row if cells are missing
            padded_row = list(row) + [""] * (cols - len(row))
            for cell in padded_row[:cols]:
                c_text = format_inline_markdown(cell.strip())
                if r_idx == 0:
                    out.append(f'  [#text(fill: rgb("#ffe600"), weight: "bold", size: {cell_size})[{c_text}]],')
                else:
                    out.append(f'  [#text(size: {cell_size})[{c_text}]],')
        out.append(")\n")
        table_rows = []
        in_table = False

    in_code_block = False
    code_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Handle Code Block
        if stripped.startswith("```"):
            if in_code_block:
                # Flush code block using quadruple backticks for complete safety
                raw_code = "\n".join(code_lines)
                out.append(f"""#rect(
  width: 100%,
  fill: rgb("#0d0d14"),
  stroke: 0.5pt + rgb("#262635"),
  radius: 3pt,
  inset: 8pt
)[
  #set text(font: "DejaVu Sans Mono", size: 7.5pt, fill: rgb("#a0a0b2"))
````
{raw_code}
````
]
#v(4pt)""")
                in_code_block = False
                code_lines = []
            else:
                if in_table:
                    flush_table()
                in_code_block = True
                code_lines = []
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Handle Table
        if stripped.startswith("|") and stripped.endswith("|"):
            parts = [p.strip() for p in stripped[1:-1].split("|")]
            if all(set(p) <= {"-", ":", " "} for p in parts if p):
                # Separator line, skip
                i += 1
                continue
            table_rows.append(parts)
            in_table = True
            i += 1
            continue
        elif in_table:
            flush_table()

        if not stripped:
            # Check if this blank line is between list items
            prev_is_list = False
            next_is_list = False
            for prev_idx in range(i - 1, -1, -1):
                p_strip = lines[prev_idx].strip()
                if p_strip:
                    if p_strip.startswith("- ") or p_strip.startswith("* ") or re.match(r"^\d+\.\s+", p_strip):
                        prev_is_list = True
                    break
            for next_idx in range(i + 1, len(lines)):
                n_strip = lines[next_idx].strip()
                if n_strip:
                    if n_strip.startswith("- ") or n_strip.startswith("* ") or re.match(r"^\d+\.\s+", n_strip):
                        next_is_list = True
                    break

            if prev_is_list and next_is_list:
                # Do not break list continuity in Typst
                i += 1
                continue

            out.append("#v(3pt)")
            i += 1
            continue

        if stripped.startswith("<!--"):
            i += 1
            continue

        # Horizontal Rule
        if set(stripped) <= {"-", "="} and len(stripped) >= 3:
            out.append("""#v(4pt)
#line(length: 100%, stroke: 0.4pt + rgb("#262635"))
#v(4pt)""")
            i += 1
            continue

        # Header 1 (Cover / Main Title)
        if stripped.startswith("# "):
            h1 = format_inline_markdown(stripped[2:])
            out.append(f"""#rect(
  width: 100%,
  fill: rgb("#13131a"),
  stroke: (left: 4pt + rgb("#ffe600"), rest: 0.5pt + rgb("#262635")),
  radius: (right: 4pt),
  inset: (x: 14pt, y: 11pt)
)[
  #text(fill: rgb("#ffe600"), size: 7.5pt, weight: "bold", tracking: 0.15em)[{clean_category}]
  #v(2pt)
  #text(fill: rgb("#ffffff"), size: 15pt, weight: "bold")[{h1}]
  #v(2pt)
  #text(fill: rgb("#9fa0aa"), size: 8.5pt, style: "italic")[Frequency Dominion · Confidential Operating System]
]
#v(8pt)""")
            i += 1
            continue

        # Header 2
        if stripped.startswith("## "):
            h2 = format_inline_markdown(stripped[3:])
            out.append(f"""#v(8pt)
#heading(level: 2)[{h2}]
#v(2pt)""")
            i += 1
            continue

        # Header 3
        if stripped.startswith("### "):
            h3 = format_inline_markdown(stripped[4:])
            out.append(f"""#v(5pt)
#heading(level: 3)[{h3}]
#v(2pt)""")
            i += 1
            continue

        # Blockquote / One-Line Truth
        if stripped.startswith("> "):
            quote = stripped[2:]
            q_formatted = format_inline_markdown(quote)
            out.append(f"""#rect(
  width: 100%,
  fill: rgb("#161408"),
  stroke: 1pt + rgb("#ffe600"),
  radius: 3pt,
  inset: 8pt
)[
  #text(fill: rgb("#ffffff"), size: 9pt)[{q_formatted}]
]
#v(6pt)""")
            i += 1
            continue

        # Unordered List
        if stripped.startswith("- ") or stripped.startswith("* "):
            item = format_inline_markdown(stripped[2:])
            out.append(f"- {item}")
            i += 1
            continue

        # Ordered List
        if re.match(r"^\d+\.\s+", stripped):
            m = re.match(r"^(\d+\.)\s+(.*)$", stripped)
            item = format_inline_markdown(m.group(2))
            out.append(f"+ {item}")
            i += 1
            continue

        # Standard Paragraph
        p = format_inline_markdown(stripped)
        out.append(f"{p}\n")
        i += 1

    if in_table:
        flush_table()

    return "\n".join(out)


def compile_md_to_pdf(md_path: Path, out_pdf_path: Path, category: str, title: str, is_db: bool = False) -> int:
    """Compiles a markdown file to a high-grade PDF via Typst and returns page count."""
    md_text = md_path.read_text(encoding="utf-8")
    typ_source = md_to_typst(md_text, category, title, is_database=is_db)

    temp_typ = out_pdf_path.with_suffix(".typ")
    temp_typ.write_text(typ_source, encoding="utf-8")

    out_pdf_path.parent.mkdir(parents=True, exist_ok=True)
    typst.compile(str(temp_typ), output=str(out_pdf_path))

    # Clean temporary typst source
    if temp_typ.exists():
        temp_typ.unlink()

    # Measure page count with PyMuPDF
    doc = pymupdf.open(str(out_pdf_path))
    pages = len(doc)
    doc.close()
    return pages


def build_course_overview() -> tuple[int, Path]:
    md = COURSE / "Course-Overview.md"
    pdf = COURSE / "Course-Overview.pdf"
    pages = compile_md_to_pdf(md, pdf, "SYSTEM BLUEPRINT", "Frequency Dominion Master System Overview")
    return pages, pdf


def build_warroom_pdfs() -> list[tuple[str, int, Path]]:
    results = []
    for mod_dir in sorted(COURSE.glob("Module-*")):
        lessons_dir = mod_dir / "Lessons"
        war_dir = mod_dir / "War-Room-Notes"
        war_dir.mkdir(parents=True, exist_ok=True)

        for l_md in sorted(lessons_dir.glob("*.md")):
            stem = l_md.stem.replace("Lesson-", "War-Room-")
            out_pdf = war_dir / f"{stem}.pdf"
            title = stem.replace("War-Room-", "").replace("-", " ")
            category = f"{mod_dir.name[:8]} · WAR-ROOM DOSSIER"
            pages = compile_md_to_pdf(l_md, out_pdf, category, title)
            results.append((title, pages, out_pdf))
    return results


def build_executive_pdfs() -> list[tuple[str, int, Path]]:
    results = []
    insider_dir = COURSE / "Resources" / "Insider"
    out_dir = insider_dir / "Executive-PDFs"
    out_dir.mkdir(parents=True, exist_ok=True)

    for md_file in sorted(insider_dir.glob("*.md")):
        if md_file.name == "Insider-Layer-README.md":
            continue
        out_pdf = out_dir / f"{md_file.stem}.pdf"
        title = md_file.stem.replace("-", " ")
        category = "EXECUTIVE BRIEFING · OPERATOR LAYER"
        pages = compile_md_to_pdf(md_file, out_pdf, category, title)
        results.append((title, pages, out_pdf))
    return results


def build_bonus_pdfs() -> list[tuple[str, int, Path]]:
    results = []
    bonuses_dir = COURSE / "Bonuses"

    # Bonus 1
    b1_md = bonuses_dir / "Bonus-1-Hometown-Heat-Map-Database" / "Hometown-Heat-Map-300-Database.md"
    b1_pdf = bonuses_dir / "Bonus-1-Hometown-Heat-Map-Database" / "Hometown-Heat-Map-300-Database.pdf"
    if b1_md.exists():
        p = compile_md_to_pdf(b1_md, b1_pdf, "BONUS 1: TARGET DATABASE", "Hometown Heat Map 300 Curated Stations", is_db=True)
        results.append(("Bonus 1: Heat Map 300", p, b1_pdf))

    # Bonus 2
    b2_md = bonuses_dir / "Bonus-2-90-Second-Audio-Script-Vault" / "90-Second-Radio-Ready-Audio-Script-Vault.md"
    b2_pdf = bonuses_dir / "Bonus-2-90-Second-Audio-Script-Vault" / "90-Second-Radio-Ready-Audio-Script-Vault.pdf"
    if b2_md.exists():
        p = compile_md_to_pdf(b2_md, b2_pdf, "BONUS 2: AUDIO WEAPONS", "90-Second Radio-Ready Audio Script Vault")
        results.append(("Bonus 2: Audio Vault", p, b2_pdf))

    # Bonus 3
    b3_md = bonuses_dir / "Bonus-3-EPK-Command-Deck" / "One-Page-EPK-Command-Deck.md"
    b3_pdf = bonuses_dir / "Bonus-3-EPK-Command-Deck" / "One-Page-EPK-Command-Deck.pdf"
    if b3_md.exists():
        p = compile_md_to_pdf(b3_md, b3_pdf, "BONUS 3: COMMAND DECK", "One-Page EPK Command Deck Specification")
        results.append(("Bonus 3: EPK Deck", p, b3_pdf))

    # Bonus 4
    b4_md = bonuses_dir / "Bonus-4-90-Day-Audit-Engine" / "90-Day-Airplay-to-Income-Audit-Engine.md"
    b4_pdf = bonuses_dir / "Bonus-4-90-Day-Audit-Engine" / "90-Day-Airplay-to-Income-Audit-Engine.pdf"
    if b4_md.exists():
        p = compile_md_to_pdf(b4_md, b4_pdf, "BONUS 4: GOVERNANCE ENGINE", "90-Day Airplay-to-Income Audit Engine")
        results.append(("Bonus 4: Audit Engine", p, b4_pdf))

    # Bonus 5
    b5_md = bonuses_dir / "Bonus-5-Resources" / "Master-Resource-Arsenal.md"
    b5_pdf = bonuses_dir / "Bonus-5-Resources" / "Master-Resource-Arsenal.pdf"
    if b5_md.exists():
        p = compile_md_to_pdf(b5_md, b5_pdf, "BONUS 5: ARSENAL INDEX", "Master Resource Arsenal Specification")
        results.append(("Bonus 5: Resource Arsenal", p, b5_pdf))

    return results


def build_resource_pdfs() -> list[tuple[str, int, Path]]:
    results = []
    res_dir = COURSE / "Resources"

    targets = [
        ("Audit", "90-Day-Audit-Checklist.md", "90-Day-Audit-Checklist.pdf", "RESOURCE: AUDIT", "90-Day Quarterly Audit Checklist"),
        ("Calendars", "21-Day-Campaign-Calendar.md", "21-Day-Campaign-Calendar.pdf", "RESOURCE: CALENDARS", "21-Day Campaign Calendar Battle Rhythm"),
        ("Calendars", "Quarterly-Release-Calendar.md", "Quarterly-Release-Calendar.pdf", "RESOURCE: CALENDARS", "Quarterly Release Calendar & Annual Roadmap"),
        ("Follow-Up", "3-Touch-Follow-Up-Sequences-and-Templates.md", "3-Touch-Follow-Up-Sequences.pdf", "RESOURCE: FOLLOW-UP", "3-Touch Follow-Up System & Escalation Templates"),
        ("Heat-Maps", "Hometown-Heat-Map-300-Database.md", "Hometown-Heat-Map-300-Database.pdf", "RESOURCE: HEAT-MAPS", "300-Station Hometown Heat Map Database"),
        ("Pitch-Weapons", "30-Subject-Line-Formulas.md", "30-Subject-Line-Formulas.pdf", "RESOURCE: PITCH WEAPONS", "30 High-Converting Subject Line Formulas"),
        ("Pitch-Weapons", "90-Word-Pitch-Vault.md", "90-Word-Pitch-Vault.pdf", "RESOURCE: PITCH WEAPONS", "90-Word Modular Pitch Vault"),
        ("Relationships", "Relationship-Compounding-Playbook.md", "Relationship-Compounding-Playbook.pdf", "RESOURCE: RELATIONSHIPS", "Relationship Compounding Playbook & Ally Engine")
    ]

    for folder, md_name, pdf_name, cat, title in targets:
        md_path = res_dir / folder / md_name
        pdf_path = res_dir / folder / pdf_name
        if md_path.exists():
            is_db = (md_name == "Hometown-Heat-Map-300-Database.md")
            p = compile_md_to_pdf(md_path, pdf_path, cat, title, is_db=is_db)
            results.append((title, p, pdf_path))

    return results


def build_template_pdfs() -> list[tuple[str, int, Path]]:
    results = []
    for mod_dir in sorted(COURSE.glob("Module-*")):
        t_dir = mod_dir / "Templates"
        for md_file in sorted(t_dir.glob("*.md")):
            out_pdf = t_dir / f"{md_file.stem}.pdf"
            title = md_file.stem.replace("-", " ")
            category = f"{mod_dir.name[:8]} · ACTION WORKSHEET"
            pages = compile_md_to_pdf(md_file, out_pdf, category, title)
            results.append((title, pages, out_pdf))
    return results


def main():
    print("===============================================================")
    print("FREQUENCY DOMINION — REBUILDING PRINT TYPESETTING PIPELINE")
    print("===============================================================\n")

    total_pdfs = 0
    total_pages = 0

    # 1. Course Overview
    ov_pages, ov_path = build_course_overview()
    total_pdfs += 1
    total_pages += ov_pages
    print(f"[OVERVIEW]   {ov_pages:2d} pages  -->  {ov_path.relative_to(COURSE)}")

    # 2. 24 War-Room PDFs
    print("\n--- Compiling 24 War-Room Masterclass Dossiers ---")
    war_results = build_warroom_pdfs()
    for t, p, path in war_results:
        total_pdfs += 1
        total_pages += p
        print(f"[WAR-ROOM]   {p:2d} pages  -->  {path.relative_to(COURSE)}")

    # 3. 8 Executive PDFs
    print("\n--- Compiling 8 Executive Briefing PDFs ---")
    exec_results = build_executive_pdfs()
    for t, p, path in exec_results:
        total_pdfs += 1
        total_pages += p
        print(f"[EXECUTIVE]  {p:2d} pages  -->  {path.relative_to(COURSE)}")

    # 4. 5 Bonus PDFs
    print("\n--- Compiling 5 Bonus PDFs ---")
    bonus_results = build_bonus_pdfs()
    for t, p, path in bonus_results:
        total_pdfs += 1
        total_pages += p
        print(f"[BONUS]      {p:2d} pages  -->  {path.relative_to(COURSE)}")

    # 5. Resource PDFs
    print("\n--- Compiling Master Resource Arsenal PDFs ---")
    res_results = build_resource_pdfs()
    for t, p, path in res_results:
        total_pdfs += 1
        total_pages += p
        print(f"[RESOURCE]   {p:2d} pages  -->  {path.relative_to(COURSE)}")

    # 6. Action Worksheet PDFs
    print("\n--- Compiling 24 Action Worksheet PDFs ---")
    tpl_results = build_template_pdfs()
    for t, p, path in tpl_results:
        total_pdfs += 1
        total_pages += p
        print(f"[WORKSHEET]  {p:2d} pages  -->  {path.relative_to(COURSE)}")

    print("\n===============================================================")
    print(f"TYPESETTING PIPELINE COMPLETE: {total_pdfs} PDFs | {total_pages} PAGES")
    print("===============================================================")


if __name__ == "__main__":
    main()
