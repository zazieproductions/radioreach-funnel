#!/usr/bin/env python3
"""Frequency Dominion — Premium "Master Class Series" PDF Production Pipeline.

Rebuilds the ENTIRE Frequency Dominion PDF suite as a polished, consumer-ready,
sellable product in a BLACK + YELLOW brand. Produces:

- Course-Handbook.pdf (full-length premium student handbook + certificate)
- Module-1..6 Guide.pdf (full-length module guides)
- Hometown-Heat-Map-Atlas.pdf (visual heatmap atlas of the 300-station DB)
- Course-Overview.pdf (flagship blueprint with value stack)
- 24 War-Room lesson dossiers (with insider tips, objectives, takeaways,
  self-assessment, and module-2 visual heatmap)
- 8 Executive insider PDFs, 5 Bonus PDFs, 8 Resource PDFs, 24 worksheets
"""
import os
import re
import sys
import collections
from pathlib import Path

try:
    import typst
    import pymupdf
except ImportError:
    print("Error: typst and pymupdf must be installed. Run with /tmp/pdfenv/bin/python.")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "Frequency-Dominion-Upsell"

# ---------------------------------------------------------------- palette ---
# BRAND: BLACK + YELLOW
INK      = "#000000"
PANEL    = "#0c0c0c"
PANEL2   = "#141414"
LINE     = "#2b2b2b"
ACID     = "#ffe600"
GOLD     = "#d6b200"
TXT      = "#f7f7f2"
MUTED    = "#9b9b92"
SUB      = "#cfcfc4"
FAINT    = "#5c5c55"
BLOOD = GOLD

FONT = "DejaVu Sans"
MONO = "DejaVu Sans Mono"


# ------------------------------------------------------------- escaping -----
def esc(t: str) -> str:
    t = t.replace("\\", "\\\\")
    t = t.replace("//", r"\/\/")
    t = t.replace("/*", r"\/\*")
    t = t.replace("*/", r"\*\/")
    t = t.replace("#", "\\#")
    t = t.replace("$", "\\$")
    t = t.replace("@", "\\@")
    t = t.replace("<", "\\<")
    t = t.replace(">", "\\>")
    t = t.replace("[", "\\[")
    t = t.replace("]", "\\]")
    return t


def fmt_inline(t: str) -> str:
    parts = t.split("`")
    for idx in range(0, len(parts), 2):
        p = esc(parts[idx])
        p = re.sub(r"\*\*(.*?)\*\*", r"#strong[\1]", p)
        p = re.sub(r"(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)", r"#emph[\1]", p)
        p = re.sub(r"(#(?:strong|emph)\[.*?\])\(", r"\1 (", p)
        parts[idx] = p
    return "`".join(parts)


# ----------------------------------------------------------- page prelude ----
def prelude(category: str, title: str, base: float = 9.5) -> str:
    cat = esc(category.upper())
    ttl = esc(title[:46])
    return f"""#set page(
  paper: "a4",
  fill: rgb("{INK}"),
  margin: (top: 21mm, bottom: 18mm, left: 16mm, right: 16mm),
  header: context {{
    let p = counter(page).get().first()
    if p > 1 [
      #grid(
        columns: (1fr, auto),
        align(left)[
          #text(fill: rgb("{ACID}"), size: 7pt, weight: "bold", tracking: 0.14em)[RADIOREACH · FREQUENCY DOMINION]
          #text(fill: rgb("{FAINT}"), size: 7pt)[ · {cat}]
        ],
        align(right)[
          #text(fill: rgb("{SUB}"), size: 7pt, weight: "medium")[{ttl}]
        ]
      )
      #v(-3pt)
      #line(length: 100%, stroke: 0.5pt + rgb("{ACID}"))
    ]
  }},
  footer: context {{
    let p = counter(page).get().first()
    let t = counter(page).final().first()
    [
      #line(length: 100%, stroke: 0.4pt + rgb("{LINE}"))
      #v(2pt)
      #grid(
        columns: (1fr, auto),
        align(left)[
          #text(fill: rgb("{FAINT}"), size: 7pt, tracking: 0.1em)[FREQUENCY DOMINION · MASTER CLASS SERIES]
        ],
        align(right)[
          #text(fill: rgb("{ACID}"), size: 7pt, weight: "bold")[PAGE #p OF #t]
        ]
      )
    ]
  }}
)

#set text(font: "{FONT}", size: {base}pt, fill: rgb("{TXT}"), spacing: 108%, lang: "en")
#set par(justify: true, leading: 0.72em, first-line-indent: 0pt)

#show heading.where(level: 2): it => block(spacing: 11pt)[
  #rect(
    width: 100%, fill: rgb("{PANEL2}"), radius: 2pt,
    stroke: (left: 2.5pt + rgb("{ACID}"), rest: 0.4pt + rgb("{LINE}")),
    inset: (x: 8pt, y: 5pt)
  )[
    #text(fill: rgb("{ACID}"), weight: "bold", size: 11pt)[#it.body]
  ]
]

#show heading.where(level: 3): it => block(spacing: 8pt)[
  #text(fill: rgb("{TXT}"), weight: "bold", size: 9.5pt)[#it.body]
]
"""


def _grid(named: str, cells: list[str]) -> str:
    """Typst #grid call with cells as positional code-mode arguments."""
    body = ",\n  ".join(cells)
    if named:
        return "#grid(" + named + ",\n  " + body + "\n)"
    return "#grid(" + body + "\n)"


# ------------------------------------------------------------- callouts -----
def insider_tip(text: str) -> str:
    t = fmt_inline(text)
    inner = _grid("columns: (auto, 1fr), column-gutter: 9pt, row-gutter: 0pt", [
        "[#box(width: 22pt)[#text(fill: rgb(\"" + ACID + "\"), size: 16pt)[★]]]",
        "[#text(fill: rgb(\"" + ACID + "\"), size: 8pt, weight: \"bold\", tracking: 0.18em)[INSIDER RADIO TIP]"
        "#v(2pt)"
        "#text(size: 9pt, fill: rgb(\"" + TXT + "\"))[" + t + "]]",
    ])
    return f"""#rect(
  width: 100%, fill: rgb("#1c1a02"), stroke: 1pt + rgb("{ACID}"), radius: 3pt, inset: (x: 10pt, y: 8pt)
)[
  {inner}
]
#v(7pt)
"""


def pro_move(text: str) -> str:
    t = fmt_inline(text)
    inner = _grid("columns: (auto, 1fr), column-gutter: 9pt", [
        "[#box(width: 22pt)[#text(fill: rgb(\"" + BLOOD + "\"), size: 16pt)[▲]]]",
        "[#text(fill: rgb(\"" + BLOOD + "\"), size: 8pt, weight: \"bold\", tracking: 0.18em)[THE OPERATOR MOVE]"
        "#v(2pt)"
        "#text(size: 9pt, fill: rgb(\"" + TXT + "\"))[" + t + "]]",
    ])
    return f"""#rect(
  width: 100%, fill: rgb("#191300"), stroke: 1pt + rgb("{BLOOD}"), radius: 3pt, inset: (x: 10pt, y: 8pt)
)[
  {inner}
]
#v(7pt)
"""


def meta_box(label: str, items: list[str], accent: str = ACID,
             fill: str = "#161400") -> str:
    lis = "\n".join(f"  - {fmt_inline(i)}" for i in items)
    return f"""#rect(width: 100%, fill: rgb("{fill}"), radius: 2pt,
  stroke: (left: 3pt + rgb("{accent}"), rest: 0.5pt + rgb("{LINE}")), inset: (x: 10pt, y: 8pt))[
  #text(fill: rgb("{accent}"), size: 8pt, weight: "bold", tracking: 0.2em)[{esc(label.upper())}]
  #v(3pt)
{lis}
]
#v(7pt)
"""


def cover(title: str, category: str, subtitle: str, tagline: str,
          badge: str = "MASTER CLASS SERIES · TRAINING EDITION",
          value: str | None = None, series: str = "FREQUENCY DOMINION") -> str:
    value_line = ""
    if value:
        value_line = ('#v(5mm)\n  #align(center)[\n'
                      '    #rect(fill: rgb("' + PANEL2 + '"), stroke: 0.5pt + rgb("' + LINE + '"), '
                      'radius: 3pt, inset: (x: 14pt, y: 6pt))[\n'
                      '      #text(fill: rgb("' + ACID + '"), size: 9.5pt, weight: "bold")[VALUE: '
                      + esc(value) + ']\n'
                      '    ]\n'
                      '  ]')
    return f"""#block(width: 100%)[
  #align(center)[
    #rect(width: 100%, fill: rgb("{ACID}"), radius: 2pt, inset: (x: 0pt, y: 3pt))[
      #text(fill: rgb("{INK}"), size: 8pt, weight: "bold", tracking: 0.4em)[RADIOREACH · {esc(series.upper())}]
    ]
  ]
  #v(16mm)
  #align(center)[
    #rect(fill: rgb("{PANEL2}"), stroke: 0.7pt + rgb("{ACID}"), radius: 3pt, inset: (x: 14pt, y: 6pt))[
      #text(fill: rgb("{ACID}"), size: 9pt, weight: "bold", tracking: 0.26em)[{esc(category.upper())}]
    ]
  ]
  #v(9mm)
  #align(center)[
    #rect(width: 100%, fill: rgb("{ACID}"), radius: 4pt, inset: (x: 14pt, y: 16pt))[
      #align(center)[
        #text(fill: rgb("{INK}"), size: 27pt, weight: "bold")[{esc(title)}]
      ]
    ]
  ]
  #v(7mm)
  #align(center)[
    #text(fill: rgb("{SUB}"), size: 12.5pt, style: "italic")[{esc(subtitle)}]
  ]
  #v(8mm)
  #align(center)[
    #text(fill: rgb("{MUTED}"), size: 10pt)[{esc(tagline)}]
  ]
  #v(9mm)
  #align(center)[
    #rect(fill: rgb("{INK}"), stroke: 1pt + rgb("{ACID}"), radius: 3pt, inset: (x: 16pt, y: 8pt))[
      #text(fill: rgb("{ACID}"), size: 8.5pt, weight: "bold", tracking: 0.24em)[{esc(badge)}]
    ]
  ]
  {value_line}
  #v(22mm)
  #align(center)[#line(length: 100%, stroke: 0.5pt + rgb("{ACID}"))]
  #v(3mm)
  #align(center)[#text(fill: rgb("{FAINT}"), size: 8pt, tracking: 0.16em)[RADIOREACH.US · THE RADIO OWNERSHIP SYSTEM]]
]
#pagebreak()"""


def title_band(title: str, category: str, sub: str = "") -> str:
    sub_line = ""
    if sub:
        sub_line = ('#v(3pt)\n  #text(fill: rgb("' + SUB + '"), size: 8.5pt, style: "italic")['
                    + esc(sub) + "]")
    return f"""#rect(
  width: 100%, fill: rgb("{PANEL2}"),
  stroke: (left: 4pt + rgb("{ACID}"), rest: 0.5pt + rgb("{LINE}")),
  radius: (right: 3pt), inset: (x: 14pt, y: 10pt)
)[
  #text(fill: rgb("{ACID}"), size: 7.5pt, weight: "bold", tracking: 0.2em)[{esc(category.upper())}]
  #v(3pt)
  #text(fill: rgb("{TXT}"), size: 15pt, weight: "bold")[{esc(title)}]
  {sub_line}
]
#v(8pt)"""


# ---------------------------------------------------------------- graphics ---
def growth_curve_lines() -> str:
    pts = [(0,88),(5,88),(10,88),(15,88),(20,87),(25,87),(30,86),(35,86),
           (40,85),(45,84),(50,84),(55,83),(60,82),(65,80),(70,78),(75,75),
           (80,72),(85,68),(90,63),(95,56),(100,47)]
    segs = []
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        segs.append(
            f"#line(start: ({x1}%, {y1}%), end: ({x2}%, {y2}%), stroke: 2.5pt + rgb(\"{BLOOD}\"))")
    return "\n".join(segs)


def growth_chart() -> str:
    return f"""#rect(
  width: 100%, fill: rgb("{PANEL}"), stroke: 0.5pt + rgb("{LINE}"), radius: 4pt, inset: 10pt
)[
  #align(center)[#text(fill: rgb("{ACID}"), weight: "bold", size: 9pt)[THE COMPOUNDING DIVERGENCE · 12 MONTHS]]
  #v(2pt)
  #align(center)[#text(fill: rgb("{MUTED}"), size: 7.5pt)[Verified station adds by month — the spread is a career valuation, not a stat]]
  #v(6pt)
  #box(width: 100%, height: 42mm)[
    #line(start: (0%, 92%), end: (100%, 92%), stroke: 0.5pt + rgb("{LINE}"))
    #line(start: (0%, 92%), end: (0%, 0%), stroke: 0.5pt + rgb("{LINE}"))
    {growth_curve_lines()}
    #line(start: (0%, 88%), end: (100%, 88%), stroke: 1.8pt + rgb("{MUTED}"))
    #place(top + left, dx: 2%, dy: 90% + 2pt)[
      #text(fill: rgb("{MUTED}"), size: 7pt)[Artist A · the algorithmic hopeful]
    ]
    #place(top + left, dx: 55%, dy: 40%)[
      #text(fill: rgb("{BLOOD}"), size: 7.5pt, weight: "bold")[Artist B · the frequency operator → 36+ adds]
    ]
    #place(top + left, dx: 40%, dy: 97%)[
      #text(fill: rgb("{FAINT}"), size: 7pt)[MONTH 1 → MONTH 12]
    ]
  ]
]
#v(7pt)
"""


def timeline_21() -> str:
    phases = [
        ("DAYS 1–3", "LOAD SEQUENCE", "arm every station"),
        ("DAYS 4–7", "FIRST SENDS · WAVE 1", "Tuesday push"),
        ("DAYS 8–14", "3-TOUCH FOLLOW-UP", "value → grace"),
        ("DAYS 15–20", "ESCALATION · WAVE 2", "fresh proof re-fire"),
        ("DAY 21", "AUDIT & LOOP", "expand next market"),
    ]
    bars = []
    for lbl, name, sub in phases:
        inner = _grid("columns: (5fr, 4fr), row-gutter: 1pt", [
            "[#text(fill: rgb(\"" + ACID + "\"), size: 7pt, weight: \"bold\", tracking: 0.08em)[" + lbl + "]]",
            "[#align(right)[#text(fill: rgb(\"" + SUB + "\"), size: 7pt)[" + sub + "]]]",
            "[#text(fill: rgb(\"" + TXT + "\"), size: 8.5pt, weight: \"bold\")[" + name + "]]",
            "[#text(fill: rgb(\"" + FAINT + "\"), size: 6.5pt)[21-DAY]]",
        ])
        bars.append(f"""#rect(width: 100%, fill: rgb("{PANEL2}"), stroke: 0.5pt + rgb("{LINE}"), radius: 2pt, inset: 6pt)[
  {inner}
]""")
    top_cells = [f"[{b}]" for b in bars[:2]]
    bot_cells = [f"[{b}]" for b in bars[2:]]
    g_top = _grid("columns: (1fr, 1fr), column-gutter: 6pt, row-gutter: 5pt", top_cells)
    g_bot = _grid("columns: (1fr, 1fr, 1fr), column-gutter: 6pt, row-gutter: 5pt", bot_cells)
    return f"""#rect(width: 100%, fill: rgb("{PANEL}"), stroke: 0.5pt + rgb("{LINE}"), radius: 4pt, inset: 10pt)[
  #align(center)[#text(fill: rgb("{ACID}"), weight: "bold", size: 9pt)[THE 21-DAY CAMPAIGN BATTLE RHYTHM]]
  #v(6pt)
  {g_top}
  #v(5pt)
  {g_bot}
  #v(4pt)
  #align(center)[#text(fill: rgb("{MUTED}"), size: 7.5pt)[20 stations · 3 touches · 21 days = the minimum viable empire]]
]
#v(7pt)
"""


def process_flow() -> str:
    steps = ["SERVICE", "ADDS", "CHART", "SECOND WAVE"]
    cells = []
    subs = ["send the record", "work the list week after week", "report spins · climb", "pitch bigger with proof"]
    for i, s in enumerate(steps):
        cells.append(f"""[#rect(width: 100%, fill: rgb("{PANEL2}"), stroke: 0.6pt + rgb("{LINE}"), radius: 2pt, inset: 6pt)[
  #text(fill: rgb("{ACID}"), size: 8pt, weight: "bold")[{s}]
  #v(1pt)
  #text(fill: rgb("{MUTED}"), size: 6.5pt)[{subs[i]}]
]]""")
    sep = "[#text(fill: rgb(\"" + ACID + "\"), size: 9pt)[→]]"
    g_flow = _grid("columns: (1fr, auto, 1fr, auto, 1fr, auto, 1fr), column-gutter: 4pt, row-gutter: 5pt, align: center",
                   [cells[0], sep, cells[1], sep, cells[2], sep, cells[3]])
    return f"""#rect(width: 100%, fill: rgb("{PANEL}"), stroke: 0.5pt + rgb("{LINE}"), radius: 4pt, inset: 10pt)[
  #align(center)[#text(fill: rgb("{ACID}"), weight: "bold", size: 9pt)[THE ADD → CHART → CASCADE LOOP]]
  #v(6pt)
  {g_flow}
  #v(4pt)
  #align(center)[#text(fill: rgb("{MUTED}"), size: 7.5pt)[Labels pay $2,000–$10,000 per record to run the machine you will run yourself.]]
]
#v(7pt)
"""


def value_stack(items: list[tuple[str, str]]) -> str:
    rows = []
    for name, val in items:
        rows.append(_grid("columns: (1fr, auto), row-gutter: 0pt", [
            "[#text(fill: rgb(\"" + TXT + "\"), size: 8.5pt, weight: \"bold\")[" + esc(name) + "]]",
            "[#align(right)[#text(fill: rgb(\"" + ACID + "\"), size: 8.5pt, weight: \"bold\")[" + esc(val) + "]]]",
        ]))
    total = _grid("columns: (1fr, auto)", [
        "[#text(fill: rgb(\"" + SUB + "\"), size: 9pt, weight: \"bold\")[TOTAL CERTIFIED VALUE]]",
        "[#align(right)[#text(fill: rgb(\"" + ACID + "\"), size: 10pt, weight: \"bold\")[\\$5,193 → \\$97]]]",
    ])
    return f"""#rect(width: 100%, fill: rgb("{PANEL2}"), stroke: 0.5pt + rgb("{LINE}"), radius: 4pt, inset: (x: 12pt, y: 10pt))[
  #text(fill: rgb("{ACID}"), size: 8pt, weight: "bold", tracking: 0.2em)[WHAT YOU GET]
  #v(5pt)
  {chr(10).join(rows)}
  #v(4pt)
  #line(length: 100%, stroke: 0.4pt + rgb("{LINE}"))
  #v(3pt)
  {total}
]
#v(7pt)
"""


def section_h2(label: str) -> str:
    return f"#v(8pt)\n#heading(level: 2)[{esc(label)}]\n#v(2pt)"


# ------------------------------------------------------------ md renderer ----
def render_md(md_content: str, category: str, title: str,
              cover_info: tuple = None, cover_value: str | None = None,
              insider: str | None = None, pro: str | None = None,
              graphic: str | None = None, is_database: bool = False,
              base: float = 9.5, as_band: bool = False, subtitle: str = "",
              objectives: list = None, takeaways: list = None,
              assessment: list = None, prepend: str | None = None,
              suppress_h1: bool = False) -> str:
    out = []
    out.append(prelude(category, title, base=base))
    if cover_info:
        out.append(cover(cover_info[0], cover_info[1], cover_info[2],
                         cover_info[3], badge=cover_info[4], value=cover_value))
    else:
        out.append(title_band(title, category, sub=subtitle))
    if prepend:
        out.append(prepend)
    if objectives:
        out.append(meta_box("Learning Objectives", objectives, accent=ACID, fill="#161400"))
    if insider:
        out.append(insider_tip(insider))
    if pro:
        out.append(pro_move(pro))
    if graphic:
        out.append(graphic)

    md_content = re.sub(r"<!--.*?-->", "", md_content, flags=re.DOTALL)
    lines = md_content.splitlines()
    tbl_specs = {
        9: ("(0.5fr, 1.3fr, 1.2fr, 0.6fr, 0.9fr, 1.4fr, 1.3fr, 1.5fr, 2.2fr)", "4pt", "6.5pt"),
        7: ("(1.1fr, 1.2fr, 1.1fr, 1.2fr, 1fr, 1.2fr, 1.5fr)", "4.5pt", "7pt"),
        6: ("(1.3fr, 1.4fr, 1.2fr, 1.4fr, 1.2fr, 1.5fr)", "5pt", "7.5pt"),
        5: ("(1.4fr, 1.3fr, 1.6fr, 1.4fr, 1.8fr)", "5.5pt", "7.5pt"),
        4: ("(1.5fr, 1.8fr, 1.4fr, 1.4fr)", "6pt", "8pt"),
        3: ("(1.5fr, 2fr, 2fr)", "6pt", "8.5pt"),
        2: ("(1.5fr, 3.5fr)", "6pt", "8.5pt"),
    }
    in_table = False
    table_rows = []

    def flush_table():
        nonlocal in_table, table_rows
        if not table_rows:
            in_table = False
            return
        cols = len(table_rows[0])
        spec = tbl_specs.get(cols)
        if spec is None:
            col_spec = f"({', '.join(['1fr']*cols)})"
            inset_v, cell = "5pt", "7.5pt"
        else:
            col_spec, inset_v, cell = spec
        hdr_cells, body_cells = [], []
        for c in table_rows[0]:
            hdr_cells.append(
                f'  [#text(fill: rgb("{ACID}"), weight: "bold", size: {cell})[{fmt_inline(c.strip())}]]')
        for row in table_rows[1:]:
            padded = list(row) + [""] * (cols - len(row))
            for c in padded[:cols]:
                body_cells.append(f'  [#text(size: {cell})[{fmt_inline(c.strip())}]]')
        hdr_src = ",\n".join(hdr_cells)
        body_src = ",\n".join(body_cells)
        out.append(f"""#table(
  columns: {col_spec}, inset: {inset_v},
  align: (col, row) => if row == 0 {{ center + horizon }} else {{ left + horizon }},
  stroke: (col, row) => if row == 0 {{ 0.7pt + rgb("{ACID}") }} else {{ 0.4pt + rgb("{LINE}") }},
  fill: (col, row) => if row == 0 {{ rgb("{PANEL2}") }} else if calc.even(row) {{ rgb("{PANEL}") }} else {{ rgb("{INK}") }},
{hdr_src},
{body_src}
)
#v(6pt)""")
        table_rows = []
        in_table = False

    in_code = False
    code_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if s.startswith("```"):
            if in_code:
                raw = "\n".join(code_lines)
                out.append(f"""[#rect(width: 100%, fill: rgb("#0d0d14"), stroke: 0.5pt + rgb("{LINE}"), radius: 3pt, inset: 8pt)[
  #set text(font: "{MONO}", size: 7.5pt, fill: rgb("{MUTED}"))
````
{raw}
````
]
#v(5pt)""")
                in_code = False
                code_lines = []
            else:
                if in_table:
                    flush_table()
                in_code = True
                code_lines = []
            i += 1
            continue
        if in_code:
            code_lines.append(line)
            i += 1
            continue
        if s.startswith("|") and s.endswith("|"):
            parts = [p.strip() for p in s[1:-1].split("|")]
            if all(set(p) <= {"-", ":", " "} for p in parts if p):
                i += 1
                continue
            table_rows.append(parts)
            in_table = True
            i += 1
            continue
        elif in_table:
            flush_table()
        if not s:
            prev_list = next_list = False
            for pi in range(i - 1, -1, -1):
                ps = lines[pi].strip()
                if ps and (ps.startswith(("- ", "* ")) or re.match(r"^\d+\.\s+", ps)):
                    prev_list = True
                    break
            for ni in range(i + 1, len(lines)):
                ns = lines[ni].strip()
                if ns and (ns.startswith(("- ", "* ")) or re.match(r"^\d+\.\s+", ns)):
                    next_list = True
                    break
            if prev_list and next_list:
                i += 1
                continue
            out.append("#v(3pt)")
            i += 1
            continue
        if s.startswith("<!--"):
            i += 1
            continue
        if set(s) <= {"-", "="} and len(s) >= 3:
            out.append("#v(4pt)\n#line(length: 100%, stroke: 0.4pt + rgb(\"" + LINE + "\"))\n#v(4pt)")
            i += 1
            continue
        if s.startswith("# "):
            if not suppress_h1:
                out.append(title_band(fmt_inline(s[2:]), category, sub=""))
            i += 1
            continue
        if s.startswith("## "):
            out.append(f"#v(7pt)\n#heading(level: 2)[{fmt_inline(s[3:])}]\n#v(2pt)")
            i += 1
            continue
        if s.startswith("### "):
            out.append(f"#v(5pt)\n#heading(level: 3)[{fmt_inline(s[4:])}]\n#v(2pt)")
            i += 1
            continue
        if s.startswith("> "):
            out.append(f"""[#rect(width: 100%, fill: rgb("{PANEL}"), stroke: 1pt + rgb("{ACID}"), radius: 3pt, inset: 8pt)[
  #text(fill: rgb("{TXT}"), size: 9pt, style: "italic")[{fmt_inline(s[2:])}]
]
#v(6pt)""")
            i += 1
            continue
        if s.startswith(("- ", "* ")):
            out.append(f"- {fmt_inline(s[2:])}")
            i += 1
            continue
        m = re.match(r"^(\d+)\.\s+(.*)$", s)
        if m:
            out.append(f"+ {fmt_inline(m.group(2))}")
            i += 1
            continue
        out.append(f"{fmt_inline(s)}\n")
        i += 1
    if in_table:
        flush_table()
    if takeaways:
        out.append("#v(8pt)\n#heading(level: 2)[Key Takeaways]\n#v(2pt)")
        out.append(meta_box("Remember This", takeaways, accent=ACID, fill="#141400"))
    if assessment:
        out.append("#v(6pt)\n#heading(level: 2)[Self-Assessment · Check Your Mastery]\n#v(2pt)")
        out.append(meta_box("Pass Before You Move On",
                            [f"{i + 1}. {a}" for i, a in enumerate(assessment)],
                            accent=GOLD, fill="#1a1700"))
    return "\n".join(out)


def compile_doc(md_path: Path, out_pdf: Path, category: str, title: str,
                **kwargs) -> int:
    md_text = md_path.read_text(encoding="utf-8")
    src = render_md(md_text, category, title, **kwargs)
    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    tmp = out_pdf.with_suffix(".typ")
    tmp.write_text(src, encoding="utf-8")
    typst.compile(str(tmp), output=str(out_pdf))
    if tmp.exists():
        tmp.unlink()
    with pymupdf.open(str(out_pdf)) as doc:
        return len(doc)

# ---------------------------------------------------------- insider tips -----
INSIDER = {
    "1.1": "Silence compounds negatively. The Unheard Tax isn't just missed airplay — it's missed compounding. Run the tax audit quarterly, not once; a number on paper beats any motivation speech.",
    "1.2": "A PD's yes is a ratings bet, not a taste vote. Ask what a new record needs to fit the format, then mirror the PD's own wording back in the pitch. Their language is the acceptance criteria.",
    "1.3": "Proof is market-weighted — a spin in the target's metro outranks 100k global streams. Tag every receipt with a market and build per-market proof shelves. Never show Austin receipts in a Boston pitch.",
    "1.4": "The No-Spam Oath is a capacity rule — three touches keeps your relationship bank in credit for the next release. Keep a 'not now' folder: it's a recheck calendar of future allies, not a graveyard.",
    "2.1": "Tier the markets, not just the rings: college towns (hungry, weekly cycles), mid metros (moderate pressure), PPM metros (conservative). Map at least 2 college towns first — that lane produces proof faster than any commercial station.",
    "2.2": "The show's aftermath is the real asset. Send a 20-second vertical crowd clip on the night itself; the next-day 'we're still talking about it' email is the strongest thank-you in the economy.",
    "2.3": "Score the playlist, not the website. Pull the last 10–15 songs a station actually plays via stream logs and plot tempo, energy and era — that 'neighborhood' is your real target definition.",
    "2.4": "Allocate the war room by outcome: 10 slot shops, 6 ladder shops, 3 market-makers, 1 wildcard. Keep it at exactly 20 rows even as the map grows — growth is new campaigns, not bigger rows.",
    "3.1": "Subject lines win station-type-matched: proof lines for commercial, format references for specialty, name-drops for established contacts. Log every subject by station type and build your own playbook.",
    "3.2": "The reply you want is a question. 'Send the WAV?' is an 80%-made yes. Answer any PD question within 4 hours with a phone number and a 12-minute call offer — speed is the proof of professionalism.",
    "3.3": "The EPK is a decision interface, not art. Keep 6 blocks, but build 3 regional proof decks (west / east / mid) that swap only the proof block — one hour of work, a real conversion delta.",
    "3.4": "The 30-second cut is the forwarding asset — the one PDs pass to their promo team. Always include the smallest, hook-loaded 30-sec version in every package.",
    "4.1": "Give the campaign an official impact date and service the record 1–2 weeks ahead of it. PDs are calendar animals — a date converts 'maybe' into 'when?'",
    "4.2": "Ride the weekly rotation cycle: wave 1 on Tuesday, wave 2 on Thursday, touch-3 the next Monday on a fresh board. Every Monday is the refresh heartbeat.",
    "4.3": "Rotation upgrades are the real follow-up. Four weeks after an add, ask for the light→medium upgrade with receipts. Almost no independent makes that ask — that's exactly why it works.",
    "4.4": "Adds land in waves. When 2–3 hit in one morning, the cycle is turning — re-fire with the fresh receipts same-day and turn that morning into 11 by Friday.",
    "5.1": "The call's third question — 'when's your add cycle?' — unlocks the calendar for every future campaign. End every call with a date, not a hope: 'checking back [date]'.",
    "5.2": "The gesture is one rung above the ask — give confidant respect before you want champion behavior. Never attach an ask to a thank-you; the ask at week 5 lands on a relationship, not a transaction.",
    "5.3": "Triage by ROI: ghosted wells recover fastest, spammed wells need the full 90-day cooling. Check the playlist before repairing a clash well — a changed lineup is new soil.",
    "5.4": "The asset/ask balance is the real KPI — 3 asks and 0 assets means the account is draining. Scan monthly and send a no-ask value drop to any ally running a deficit.",
    "6.1": "Proof is perishable: 7-day-old reads as 'now', 90-day-old reads as 'history'. Refresh the EPK's receipts weekly and archive the old ones for the press kit.",
    "6.2": "The chart (NACC / RMR) is the currency supervisors actually check. Build the one-page placement package (chart proof + 30-sec cut + stems + contact) before you need it.",
    "6.3": "Timing is market-attention windows: Q1 post-holiday open, Q2 spring/summer booking, Q3 fall breakout, Q4 closed. Never release into Q4 as an unknown — use it for the annual audit.",
    "6.4": "The audit is a business review: one kill/keep, one scale/hold, one ascension decision. Sign the next-quarter memo with ONE commitment — machines compound on single repairs.",
}

PRO = {
    "1.1": "Print your tax number and pin it above your workstation. When fear of rejection stalls outreach, the invoice — not motivation — is what moves you.",
    "2.1": "Run the Triangle Tour Method: pick three Ring 3 cities that form a drivable weekend triangle and coordinate pitches across all three at once.",
    "2.3": "If a station's stream log sits on the boundary of your genre, that's a specialty-slot lead, not a power miss. Hunt the edges first.",
    "3.4": "Name the 30-sec file 'ARTIST_TITLE_30sec.mp3' and put it first in the download folder. One less step for the PD is one more step for your add.",
    "4.3": "Time the upgrade ask to land right after the station's weekly music meeting — Thursday afternoon, not Monday morning.",
}

def lesson_id_from_name(stem: str) -> str:
    m = re.search(r"Lesson-(\d)\.(\d)", stem)
    return f"{m.group(1)}.{m.group(2)}" if m else ""

LESSON_OBJ = {
    "1.1": ["Quantify your exact 12-month Unheard Tax across reach, royalties, and leverage.", "Distinguish silence-is-neutral from silence-is-an-active-expense.", "Model the compounding divergence between a blaster and a frequency operator."],
    "1.2": ["Reframe a station as a customer with a measurable need, format, clock, and competition.", "Identify which daypart / specialty slot your record is engineered to serve.", "Mirror the programmer's own wording as your acceptance criteria."],
    "1.3": ["Build a market-weighted evidence vault of third-party receipts.", "Separate first-party proof from borrowed credentials.", "Create per-market proof shelves so every pitch shows local proof."],
    "1.4": ["Adopt a precision-over-volume identity shift from beggar to owner.", "Define the No-Spam capacity rule of three touches.", "Convert every 'not now' reply into a recheck calendar of future allies."],
    "2.1": ["Map stations by geography and hunger tiers (college / mid-metro / PPM).", "Identify at least two college-town, weekly-cycle stations.", "Shortlist twenty targets for your first campaign."],
    "2.2": ["Use tour dates as story, deadline, and market at once.", "Manufacture airplay demand before you ever arrive.", "Convert the show's aftermath into proof inside 48 hours."],
    "2.3": ["Score stations by playlist evidence rather than format label rumor.", "Plot tempo, energy, and era from real stream logs.", "Rank your shortlist like an analyst, not a fan."],
    "2.4": ["Build a concentration-based 20-station command center.", "Allocate every row by outcome: 10 slot / 6 ladder / 3 market-maker / 1 wildcard.", "Keep the war room at exactly 20 rows as the map grows."],
    "3.1": ["Write station-type-matched subject lines that win in 1.4 seconds.", "Apply the single-engine, single-hook rule.", "Build a personal subject-line log and iterate on real open data."],
    "3.2": ["Compress your pitch to 90 words with one hook and one ask.", "Engineer the reply you want toward a question, not a favor.", "Set a four-hour reply protocol that proves professionalism."],
    "3.3": ["Build a one-page, six-block EPK that reads as a decision interface.", "Create three regional proof decks from one master.", "Keep every receipt current and market-tagged."],
    "3.4": ["Prepare radio-ready, clean-edited audio for daytime clocks.", "Produce the 30-second forwarding asset programmers pass along.", "Package and name files so the programmer does less work."],
    "4.1": ["Arm every station before you fire a single email.", "Set an official impact date and service the record 1–2 weeks ahead.", "Translate a list into a loaded, ready-to-fire campaign."],
    "4.2": ["Execute a two-wave send timed to the weekly rotation cycle.", "Apply the 4-hour rule to first replies.", "Treat every Monday as the campaign refresh heartbeat."],
    "4.3": ["Run a value-then-grace three-touch escalation.", "Land touch-3 on a fresh board after the station's music meeting.", "Ask for rotation upgrades (light → medium) at week four."],
    "4.4": ["Detect add waves and read the cycle turning.", "Re-fire same-day with fresh proof when 2–3 adds land together.", "Queue the next market before the current campaign cools."],
    "5.1": ["Run a 12-minute, one-ask relationship call.", "Ask the add-cycle question that unlocks every future calendar.", "End every call with a date, not a hope."],
    "5.2": ["Send specific, no-ask gratitude one rung above the ask.", "Sequence gestures ahead of asks across the relationship.", "Convert zero-ask windows into week-5 champions."],
    "5.3": ["Triage burned wells by return on investment.", "Execute the five-step repair protocol with a 90-day cooling window.", "Check the playlist before repairing a clash well."],
    "5.4": ["Maintain a 30/10/10 ally ledger and re-rank it monthly.", "Monitor the asset / ask balance as the account's health KPI.", "Send no-ask value drops to any ally running a deficit."],
    "6.1": ["Turn every spin into four reusable proof assets.", "Refresh proof on a 7-day cycle and archive history for press.", "Run campaigns on current proof, press kits on history."],
    "6.2": ["Convert verifiable airplay into placement income.", "Build the one-page placement package before you need it.", "Pitch supervisors, brands, and bookers with chart currency."],
    "6.3": ["Plan a 12-week, three-release cadence.", "Align releases to market-attention windows by quarter.", "Reserve Q4 for the annual audit and strategy season."],
    "6.4": ["Run a 50-point business review of the whole system.", "Make one kill/keep, one scale/hold, and one ascension decision.", "Sign a one-commitment memo for the next quarter."],
}

LESSON_TAKE = {
    "1.1": ["Silence is an expense, not a neutral holding pattern.", "The Unheard Tax compounds across reach, revenue, and leverage.", "An audit number beats any motivation speech."],
    "1.2": ["A programmer's yes is a ratings bet, not a taste vote.", "The customer is the format; the daypart changes the fit.", "Their language is your acceptance criteria."],
    "1.3": ["Third-party evidence transfers risk.", "Proof is market-weighted — a metro spin outranks global streams.", "Per-market shelves beat one global deck."],
    "1.4": ["Precision is a differentiator because spam is the baseline.", "Three touches keeps your relationship bank in credit.", "The 'not now' folder is a recheck calendar of future allies."],
    "2.1": ["Geography lowers ask risk.", "Tier the markets: college, mid-metro, PPM.", "The college lane produces proof fastest."],
    "2.2": ["Dates are story, deadline, and market in one.", "The show's aftermath is the real asset.", "A night-of clip converts at show + 48 hours."],
    "2.3": ["Score the playlist, not the website.", "The played neighborhood is your real target definition.", "Boundary songs are specialty leads, not power misses."],
    "2.4": ["Concentration beats breadth.", "Allocate by outcome: slot, ladder, market-maker, wildcard.", "Growth means new campaigns, not bigger rows."],
    "3.1": ["Win in 1.4 seconds with one engine.", "Match the subject line to the station type.", "Log and iterate on real data."],
    "3.2": ["Ninety words, one hook, one ask.", "Engineer the reply you want into a question.", "Four-hour replies prove professionalism."],
    "3.3": ["The EPK is a decision interface, not art.", "Six blocks, three regional proof decks.", "One hour of work, a real conversion delta."],
    "3.4": ["Logistics dominate programming decisions.", "The 30-second cut is the forwarding asset.", "Name and order files for the programmer."],
    "4.1": ["Fire only armed stations.", "An impact date converts 'maybe' into 'when?'", "Service 1–2 weeks ahead of the add."],
    "4.2": ["Two waves ride the weekly cycle.", "Wave 1 Tuesday, wave 2 Thursday, touch-3 next Monday.", "Monday is the refresh heartbeat."],
    "4.3": ["Value first, then grace.", "Rotation upgrades are the real follow-up.", "Light → medium is the most winnable ask in radio."],
    "4.4": ["Adds are seeds.", "Adds land in waves — read the cycle turning.", "Escalate same-day with fresh proof."],
    "5.1": ["Twelve minutes, one ask.", "The add-cycle question unlocks every calendar.", "End with a date, not a hope."],
    "5.2": ["Gratitude sits one rung above the ask.", "Never attach an ask to a thank-you.", "The week-5 ask lands on a relationship, not a transaction."],
    "5.3": ["Ghosted wells recover fastest.", "Spammed wells need the full cooling period.", "A changed lineup means the well is new soil."],
    "5.4": ["The ledger is the moat's maintenance log.", "Asset / ask balance is the health KPI.", "Scan monthly and fix deficits with no-ask drops."],
    "6.1": ["Each spin becomes four assets.", "Proof is perishable — 7 days reads as 'now'.", "Current proof runs campaigns; history runs press kits."],
    "6.2": ["Airplay is verifiable demand.", "The chart is the currency supervisors check.", "The placement package converts twice: supervisor and sponsor."],
    "6.3": ["Twelve weeks, three releases.", "Timing is market-attention windows by quarter.", "Q4 is the closed window — use it for strategy."],
    "6.4": ["The audit is a business review, not a to-do list.", "Fix the weakest column, one at a time.", "Machines compound on single repairs."],
}

LESSON_ASSESS = {
    "1.1": ["Did I compute a dollar figure for my 12-month Unheard Tax?", "Did I name my dominant enemy (blast, one-and-done, or perfection)?", "Did I deposit my first proof asset into a Proof-Stack folder?"],
    "1.2": ["Can I state the format need my target station is trying to serve?", "Do I know which daypart / specialty slot my record fits?", "Have I drafted a pitch that mirrors the programmer's wording?"],
    "1.3": ["Do I hold at least one verifiable receipt per target market?", "Is every receipt tagged with a market, not just a date?", "Can I show local proof for every local pitch I send?"],
    "1.4": ["Have I signed and printed the No-Spam Oath?", "Am I committed to a three-touch maximum per station?", "Is my 'not now' folder set up as a recheck calendar?"],
    "2.1": ["Do I have at least two college-town, weekly-cycle stations mapped?", "Is every station tiered by hunger and geography?", "Have I locked my top twenty targets for the first campaign?"],
    "2.2": ["Are my tour dates confirmed and mapped to stations?", "Did I plan a night-of crowd clip for each market?", "Is my 'still talking about it' next-day email drafted?"],
    "2.3": ["Did I pull a real 10–15 song stream log for a target station?", "Have I plotted tempo, energy, and era to find the neighborhood?", "Did I rank my shortlist from best fit to worst?"],
    "2.4": ["Is my war room exactly twenty rows?", "Does each row carry an outcome role (slot / ladder / market-maker / wildcard)?", "Is my wildcard slot actually a wildcard, not another slot shop?"],
    "3.1": ["Did I write at least three station-type-matched subject lines?", "Is each subject under the 1.4-second / one-engine rule?", "Have I started a log to track which subjects get opens?"],
    "3.2": ["Is my pitch ninety words or fewer?", "Does it carry exactly one hook and one ask?", "Is my four-hour reply protocol set up for every send?"],
    "3.3": ["Does my EPK fit on one page with six clean blocks?", "Do I have three regional proof decks (west / east / mid)?", "Are all receipts current and market-tagged?"],
    "3.4": ["Is my audio radio-ready and clean-edited?", "Do I have a hook-loaded 30-second forwarding cut?", "Are my files named and ordered for the programmer?"],
    "4.1": ["Is every target station loaded and armed before send?", "Do I have an official impact date set?", "Did I service the record 1–2 weeks ahead of that date?"],
    "4.2": ["Did wave 1 go out on a Tuesday?", "Did wave 2 follow on Thursday?", "Is my touch-3 scheduled for the next Monday's fresh board?"],
    "4.3": ["Are my three touches spaced, escalated, and polite?", "Is touch-3 timed to land after the station's music meeting?", "Have I planned a week-4 rotation-upgrade ask with receipts?"],
    "4.4": ["Am I watching for add-wave mornings?", "Can I re-fire same-day with fresh proof when adds land?", "Is my next market already queued for expansion?"],
    "5.1": ["Is my 12-minute call sheet ready?", "Did I memorize the add-cycle question?", "Do I end every call with a concrete check-back date?"],
    "5.2": ["Have I sent a no-ask, specific thank-you this week?", "Is my gesture one rung above the ask?", "Am I tracking a zero-ask window before any ask?"],
    "5.3": ["Have I triaged my burned wells by ROI?", "Is a 90-day cooling window set for the wells that need it?", "Did I check the playlist before any clash-well repair?"],
    "5.4": ["Is my 30/10/10 ally ledger current?", "Is the asset / ask balance healthy on every account?", "Did I send a no-ask value drop to any deficit account?"],
    "6.1": ["Do I have a spin → four-asset pipeline?", "Is my proof refreshed on a 7-day cycle?", "Is older proof archived for the press kit?"],
    "6.2": ["Is my one-page placement package built?", "Does it include chart proof, a 30-sec cut, stems, and contact?", "Do I have a pitch list of supervisors, brands, and bookers?"],
    "6.3": ["Is my 12-week, three-release calendar set?", "Are releases aligned to the market-attention windows?", "Is Q4 reserved for the audit and strategy season?"],
    "6.4": ["Did I complete the full 50-point audit?", "Did I make one kill/keep, one scale/hold, and one ascension decision?", "Is my next-quarter memo signed with one commitment?"],
}

# ------------------------------------------------------------------ modules --
MODULES = [
    {"num": 1, "name": "Command Identity", "tagline": "You are not a pitch. You are a frequency.",
     "intro": ("Before you touch a single station, stop acting like an artist hoping to be heard and start acting like a frequency owner. Command Identity prices your silence, reframes radio as a market, builds the evidence vault that makes programmers say yes, and swaps begging for precision."),
     "objectives": ["Adopt an owner identity instead of a beggar identity.", "Price the Unheard Tax in real dollars.", "Treat every station as a customer with a measurable need.", "Build the proof stack and sign the No-Spam Oath."],
     "lessons": [("1.1", "The Unheard Tax", "Quantify exactly what being ignored costs you."), ("1.2", "Station-As-Customer", "Treat radio as a market, not a favor."), ("1.3", "The Proof Stack", "Build the evidence vault that makes PDs say yes."), ("1.4", "The No-Spam Oath & Identity Shift", "Go from beggar to dominion owner.")],
     "assignment": ("Complete the Command Identity sheet: run the Unheard Tax audit and pin the number, draft a one-page station-as-customer brief for your top station, inventory your proof stack, and sign the printed No-Spam Oath."),
     "quiz": [("What is the Unheard Tax?", "The compounding cost of every release cycle without broadcast airplay — reach, revenue, and leverage."), ("What is a programmer's 'yes' really?", "A ratings bet, not a taste vote."), ("What outranks 100,000 global streams in a pitch?", "A verified spin in the target's metro."), ("Why does the No-Spam Oath limit you to three touches?", "Precision and capacity keep your relationship bank in credit for the next release."), ("What is the 'not now' folder?", "A recheck calendar of future allies, not a graveyard of failure.")],
     "takeaways": ["Silence is an expense.", "A station is a customer.", "Proof precedes the pitch.", "Precision is the brand."],
     "next": ("With an owner's identity and a proof stack in hand, you're ready to decide exactly which stations to pursue. That's Target Architecture.")},
    {"num": 2, "name": "Target Architecture", "tagline": "Precision is the new volume.",
     "intro": ("Volume is dead; precision is the new volume. Target Architecture turns radio from a random blast into a surgical map — a hometown heat map, tour leverage, an analyst-grade scoring system, and a 20-station command center that never sleeps."),
     "objectives": ["Build the hometown heat map and tier every market.", "Use tour pre-roll to manufacture demand with dates.", "Score stations like an analyst, on playlist evidence.", "Construct a 20-station war room allocated by outcome."],
     "lessons": [("2.1", "The Hometown Heat Map", "Find the stations that can't say no."), ("2.2", "Tour Pre-Roll", "Manufacture airplay demand with dates."), ("2.3", "The Format Scoring System", "Rank every station like an analyst."), ("2.4", "The 20-Station War Room", "Build the command center that never sleeps.")],
     "assignment": ("Deliver your Target Map: a heat map with at least two college towns, five scored stations on playlist evidence, and a locked 20-station war room with every row carrying an outcome role."),
     "quiz": [("Which lane produces proof the fastest?", "The college / specialty lane with its weekly cycles."), ("Why tier the markets?", "Because college, mid-metro, and PPM markets each run on different physics."), ("What is the aftermath asset after a show?", "A night-of crowd clip plus a next-day 'still talking' email."), ("What should you score — the playlist or the website?", "The playlist — it's the truth; the format label is a rumor."), ("What is the 20-station allocation?", "10 slot shops, 6 ladder shops, 3 market-makers, 1 wildcard.")],
     "takeaways": ["Geography lowers ask risk.", "College is the fast lane.", "Score the playlist.", "Concentrate on 20."],
     "next": ("Your map is set — now arm it with the messages and assets that make a programmer stop scrolling. That's the Pitch Weapon.")},
    {"num": 3, "name": "The Pitch Weapon", "tagline": "Be the one email they answer.",
     "intro": ("Everything before this point is invisible to the programmer. The Pitch Weapon is the moment you become the one email they actually answer — a subject line that cuts through noise, a 90-word pitch with one ask, a one-page EPK, and 90 seconds of radio-ready audio."),
     "objectives": ["Write subject lines that win in 1.4 seconds.", "Craft a 90-word pitch with one hook and one ask.", "Build a one-page EPK that commands attention.", "Produce the 90-second radio-ready weapon that forces replies."],
     "lessons": [("3.1", "Subject Lines That Cut Through Noise", "Apply the 30-formula vault."), ("3.2", "The 90-Word Pitch", "Write the only email that matters."), ("3.3", "The One-Page EPK", "Command attention in a single page."), ("3.4", "Radio-Ready Audio", "Forge the 90-second weapon that forces replies.")],
     "assignment": ("Assemble your Pitch Package: three station-type-matched subject lines, one 90-word pitch, a one-page EPK with six blocks, and a radio-ready full track plus a 30-second forwarding cut."),
     "quiz": [("How long do you have to win a subject line?", "About 1.4 seconds."), ("What reply should you engineer for?", "A question — 'send the WAV?' is an 80%-made yes."), ("How many words is the pitch?", "Ninety — one hook, one ask."), ("How many blocks does the EPK carry?", "Six."), ("What is the forwarding asset?", "The 30-second radio cut programmers pass to the promo team.")],
     "takeaways": ["One subject, 1.4 seconds.", "Ninety words, one ask.", "The EPK is a decision interface.", "The 30-second cut forwards."],
     "next": ("Weapons are only powerful when fired in sequence. That's the 21-Day Campaign.")},
    {"num": 4, "name": "The 21-Day Campaign", "tagline": "Burn nothing. Own everything.",
     "intro": ("Hoping is not a campaign. The 21-Day Campaign is the operating rhythm: load every station before you fire, send in timed waves, follow up three times with value and grace, then let one add cascade into a market."),
     "objectives": ["Run a load sequence that arms every station before send.", "Execute first sends in timed waves on the weekly cycle.", "Run the three-touch follow-up with value and grace.", "Convert adds into next-market expansion loops."],
     "lessons": [("4.1", "The Load Sequence", "Arm every station before you send."), ("4.2", "First Sends", "Time the waves and the 4-hour rule."), ("4.3", "The 3-Touch Follow-Up", "Persistence without the stench."), ("4.4", "Adds & Next-Market Expansion", "Turn one station into a cascade.")],
     "assignment": ("Run a live 21-day campaign on your locked 20 stations: load the sequence, fire two waves, execute three touches, and log every add. Produce a results log showing wave timing and outcomes."),
     "quiz": [("When do you fire?", "Only at armed stations."), ("What converts 'maybe' into 'when?'", "An official impact date."), ("What day does wave 1 ride?", "Tuesday, on the weekly rotation cycle."), ("How many touches, and in what order?", "Three, value then grace."), ("When do you ask for a rotation upgrade?", "About four weeks after an add.")],
     "takeaways": ["Load before fire.", "Ride the weekly cycle.", "Three touches, value to grace.", "Adds cascade."],
     "next": ("Campaigns win stations; relationships win careers. That's Human Frequency.")},
    {"num": 5, "name": "Human Frequency", "tagline": "The people are the airwaves.",
     "intro": ("Airplay is won by machines but kept by people. Human Frequency is the relationship layer — the 12-minute call, the thank-you economy, the burned-well repair, and the 90-day ally engine that compounds trust into champions."),
     "objectives": ["Run a 12-minute high-value relationship call.", "Deploy the thank-you economy with specific, no-ask gratitude.", "Repair burned wells with a five-step, ROI-driven protocol.", "Compound relationships with the 90-day ally engine."],
     "lessons": [("5.1", "High-Value Calls", "Run the 12-minute relationship call."), ("5.2", "The Thank-You Economy", "Use tiny gestures to win lifelong allies."), ("5.3", "Burned-Well Repair", "Salvage relationships with the 5-step protocol."), ("5.4", "Relationship Compounding", "Run the 90-day ally engine.")],
     "assignment": ("Run an Ally Sprint: three 12-minute calls, three no-ask thank-yous, one burned-well repair, and a seeded 30/10/10 ally ledger with a healthy asset / ask balance."),
     "quiz": [("How long is the high-value call?", "Twelve minutes, with one ask."), ("What unlocks every future campaign calendar?", "The 'when's your add cycle?' question."), ("Should a thank-you carry an ask?", "No — the zero-ask window is the strategic move."), ("Which burned well recovers fastest?", "The ghosted well."), ("What is the asset / ask balance?", "The health KPI of every ally account.")],
     "takeaways": ["Twelve minutes, one ask.", "Gratitude above the ask.", "Repair by ROI.", "The ledger is the moat."],
     "next": ("People, proof, and persistence compound into a business. That's the Empire Loop.")},
    {"num": 6, "name": "The Empire Loop", "tagline": "Convert airplay into an empire.",
     "intro": ("A single add is not a business. The Empire Loop converts airplay into income and systems — proof compounding, a placement package, a quarter-dominating release calendar, and a 90-day audit that ascends you to the next tier."),
     "objectives": ["Compound every spin into reusable proof assets.", "Convert airplay into verifiable placement income.", "Plan a release calendar that dominates quarters.", "Run the 90-day audit and ascend on gates."],
     "lessons": [("6.1", "Proof Compounding Systems", "Turn every spin into a weapon."), ("6.2", "Airplay-to-Income", "Convert frequency into money."), ("6.3", "The Release Calendar", "Dominate quarters, not just weeks."), ("6.4", "The 90-Day Audit & Ascension", "Scale the system to a real business.")],
     "assignment": ("Complete your Empire Review: build the placement package, set the 12-week release calendar, run the full 90-day audit, and sign a one-commitment next-quarter memo."),
     "quiz": [("How many assets does each spin become?", "Four."), ("How often do you refresh proof?", "Weekly, on a 7-day cycle."), ("What does the placement package contain?", "Chart proof, a 30-sec cut, stems, and contact."), ("When do you never release as an unknown?", "Q4 — it's the closed window."), ("How many commitments does the next-quarter memo carry?", "Exactly one.")],
     "takeaways": ["Proof compounds.", "The chart is currency.", "Twelve-week cadence.", "The audit ascends."],
     "next": ("You've closed the loop. Re-run the 90-day audit, ascend the gates, and scale toward a done-for-you campaign team.")},
]


def module_lesson_box(mod_num: int, lid: str, title: str, goal: str) -> str:
    tip = INSIDER.get(lid, "")
    s = f"""#v(2pt)
#heading(level: 3)[{esc(f'LESSON {lid} · {title}')}]
#text(size: 9pt, fill: rgb("{SUB}"))[{esc(goal)}]
#v(2pt)"""
    if tip:
        s += insider_tip(tip)
    g = _grid("columns: (1fr, 1fr), column-gutter: 6pt, row-gutter: 4pt", [
        "[#rect(width: 100%, fill: rgb(\"" + PANEL2 + "\"), stroke: 0.4pt + rgb(\"" + LINE + "\"), radius: 2pt, inset: 6pt)["
        "#text(fill: rgb(\"" + ACID + "\"), size: 7pt, weight: \"bold\", tracking: 0.1em)[LESSON DRILL]"
        "#v(1pt)"
        "#text(fill: rgb(\"" + MUTED + "\"), size: 7.5pt)[Complete the drills in the masterclass dossier and pass the pass standards.]]]",
        "[#rect(width: 100%, fill: rgb(\"" + PANEL2 + "\"), stroke: 0.4pt + rgb(\"" + LINE + "\"), radius: 2pt, inset: 6pt)["
        "#text(fill: rgb(\"" + ACID + "\"), size: 7pt, weight: \"bold\", tracking: 0.1em)[ACTION WORKSHEET]"
        "#v(1pt)"
        "#text(fill: rgb(\"" + MUTED + "\"), size: 7.5pt)[Fill in T" + esc(lid.replace(".", "")) + " · " + esc(title) + " in the module's Templates folder.]]]",
    ])
    return s + g + "\n#v(7pt)"


def build_module_guide(mod: dict) -> tuple[int, Path]:
    mn = mod["num"]
    out = []
    out.append(prelude(f"MODULE {mn} GUIDE", f"Module {mn} {mod['name']}", base=9.5))
    out.append(cover(f"MODULE {mn} · {mod['name']}", f"MODULE {mn} OF 6", mod["tagline"],
                     "A complete premium course module — overview, lesson-by-lesson, capstone, quiz, and takeaways.",
                     badge="FULL-LENGTH MODULE GUIDE · TRAINING EDITION"))
    out.append(section_h2("MODULE OVERVIEW"))
    out.append(f"#text(size: 10pt, fill: rgb(\"{TXT}\"))[{esc(mod['intro'])}]\n#v(6pt)")
    out.append(meta_box("By the end of this module you will", mod["objectives"], accent=ACID, fill="#161400"))
    out.append(section_h2("THE LESSON MAP"))
    for lid, t, g in mod["lessons"]:
        out.append(module_lesson_box(mn, lid, t, g))
    out.append(section_h2("CAPSTONE ASSIGNMENT"))
    out.append(f"""[#rect(width: 100%, fill: rgb("{PANEL2}"), stroke: 1pt + rgb("{ACID}"), radius: 3pt, inset: 10pt)[
  #text(fill: rgb("{ACID}"), size: 8pt, weight: "bold", tracking: 0.2em)[MODULE {mn} DELIVERABLE]
  #v(3pt)
  #text(size: 9pt, fill: rgb("{TXT}"))[{esc(mod['assignment'])}]
  #v(4pt)
  #text(fill: rgb("{MUTED}"), size: 8pt)[Pass standard: complete the deliverable before starting Module {mn + 1}.]
]
#v(7pt)
""")
    out.append(section_h2("MODULE QUIZ"))
    for i, (q, a) in enumerate(mod["quiz"], 1):
        out.append(f"""[#v(2pt)
#text(fill: rgb("{ACID}"), weight: "bold", size: 9pt)[Q{i}. {esc(q)}]
#v(1pt)
#text(fill: rgb("{MUTED}"), size: 8.5pt, style: "italic")[Answer: {esc(a)}]
#v(4pt)]""")
    out.append(section_h2("KEY TAKEAWAYS"))
    out.append(meta_box("Carry these forward", mod["takeaways"], accent=ACID, fill="#141400"))
    out.append(section_h2("BRIDGE TO THE NEXT MODULE"))
    out.append(f"#text(size: 9.5pt, fill: rgb(\"{SUB}\"), style: \"italic\")[{esc(mod['next'])}]\n#v(6pt)")
    src = "\n".join(out)
    pdf = COURSE / f"Module-{mn}-Guide.pdf"
    pdf.parent.mkdir(parents=True, exist_ok=True)
    tmp = pdf.with_suffix(".typ")
    tmp.write_text(src, encoding="utf-8")
    typst.compile(str(tmp), output=str(pdf))
    if tmp.exists():
        tmp.unlink()
    with pymupdf.open(str(pdf)) as doc:
        return len(doc), pdf


def certificate_page() -> str:
    cert_g1 = _grid("columns: (1fr, 1fr), column-gutter: 20mm", [
        "[#align(center)[#line(length: 100%, stroke: 0.4pt + rgb(\"" + LINE + "\"))]]",
        "[#align(center)[#line(length: 100%, stroke: 0.4pt + rgb(\"" + LINE + "\"))]]",
    ])
    cert_g2 = _grid("columns: (1fr, 1fr), column-gutter: 20mm", [
        "[#align(center)[#text(fill: rgb(\"" + MUTED + "\"), size: 7.5pt)[MODULE INSTRUCTOR]]]",
        "[#align(center)[#text(fill: rgb(\"" + MUTED + "\"), size: 7.5pt)[DATE OF COMPLETION]]]",
    ])
    return f"""#set page(margin: 18mm)
#rect(width: 100%, height: 100%, fill: rgb("{INK}"), stroke: 2.5pt + rgb("{ACID}"), radius: 6pt)[
  #align(center)[
    #v(30mm)
    #text(fill: rgb("{ACID}"), size: 9pt, weight: "bold", tracking: 0.34em)[FREQUENCY DOMINION]
    #v(4mm)
    #line(length: 40%, stroke: 0.6pt + rgb("{LINE}"))
    #v(8mm)
    #text(fill: rgb("{ACID}"), size: 22pt, weight: "bold")[CERTIFICATE OF COMPLETION]
    #v(4mm)
    #text(fill: rgb("{MUTED}"), size: 9.5pt)[This certifies that]
    #v(6mm)
    #line(length: 55%, stroke: 0.6pt + rgb("{TXT}"))
    #v(2mm)
    #text(fill: rgb("{MUTED}"), size: 8pt, tracking: 0.2em)[STUDENT NAME]
    #v(6mm)
    #text(fill: rgb("{SUB}"), size: 9.5pt)[has completed the full 24-lesson, six-module Frequency Dominion course,]
    #v(2mm)
    #text(fill: rgb("{SUB}"), size: 9.5pt)[earning the title of Radio Frequency Owner.]
    #v(12mm)
    #circle(radius: 22pt, stroke: 1.5pt + rgb("{ACID}"), fill: rgb("{PANEL2}"))[
      #text(fill: rgb("{ACID}"), size: 8pt, weight: "bold", tracking: 0.2em)[RADIO\nOWNER]
    ]
    #v(14mm)
    {cert_g1}
    #v(2mm)
    {cert_g2}
    #v(16mm)
    #text(fill: rgb("{FAINT}"), size: 7.5pt, tracking: 0.16em)[RADIOREACH.US · THE RADIO OWNERSHIP SYSTEM]
  ]
]"""


def build_course_handbook() -> tuple[int, Path]:
    out = []
    out.append(prelude("COURSE GUIDE", "Frequency Dominion Student Handbook", base=9.5))
    out.append(cover("FREQUENCY DOMINION", "COURSE GUIDE",
                     "The 24-Lesson Radio Ownership System",
                     "A complete premium course — student handbook, six full modules, 24 lessons, the insider layer, and five bonuses.",
                     badge="STUDENT HANDBOOK · PREMIUM COURSE EDITION",
                     value="$5,193 stack · now $97", series="FREQUENCY DOMINION"))
    out.append(section_h2("WELCOME TO FREQUENCY DOMINION"))
    out.append(f"""[#rect(width: 100%, fill: rgb("{PANEL2}"), stroke: (left: 3pt + rgb("{ACID}"), rest: 0.5pt + rgb("{LINE}")), radius: 2pt, inset: 10pt)[
  #text(size: 10pt, fill: rgb("{TXT}"), style: "italic")[You do not ask for airplay. You own the frequency.]
]
#v(6pt)
#text(size: 9.5pt)[Most artists treat radio like a favor they're hoping to collect. Frequency Dominion is the opposite operating system — an owner's course that turns the contacts you already own into a predictable, compounding airplay machine. This handbook is your roadmap; the six modules are the training.]""")
    out.append(section_h2("HOW TO USE THIS COURSE"))
    out.append(meta_box("The learning loop for every lesson", [
        "Read the lesson's Learning Objectives so you know what mastery looks like.",
        "Study the masterclass directive and strategic blueprint in the lesson dossier.",
        "Run the implementation drills and hit the pass standards.",
        "Fill in the matching Action Worksheet in the Templates folder.",
        "Read the Insider Radio Tip and the Operator Move for the premium edge.",
        "Pass the Self-Assessment before you move to the next lesson."], accent=ACID))
    out.append(section_h2("THE SEVEN LAWS OF FREQUENCY DOMINION"))
    laws = ["The Unheard Tax is real. Every week without airplay costs you reach, revenue, and leverage.",
            "A station is a customer, not a favor. Serve the PD's clock. Win the format.",
            "Proof precedes the pitch. Show the evidence before you ask.",
            "Targets are architecture, not luck. Heat map → format score → war room → campaign.",
            "The pitch is a weapon, not a message. Ninety words, one hook, one ask.",
            "Follow-up is a system, not a feeling. Three touches, spaced and escalated.",
            "Empires compound. Proof → adds → exposure → income → better proof → bigger stations."]
    out.append(meta_box("Seven laws", [f"{i+1}. {l}" for i, l in enumerate(laws)], accent=ACID, fill="#161400"))
    out.append(section_h2("CURRICULUM MAP · SIX MODULES, 24 LESSONS"))
    tbl = [f"""#table(
  columns: (2.2fr, 5fr), inset: 7pt, align: (col, row) => if row == 0 {{ left + horizon }} else {{ left + horizon }},
  stroke: (col, row) => if row == 0 {{ 0.8pt + rgb("{ACID}") }} else {{ 0.4pt + rgb("{LINE}") }},
  fill: (col, row) => if row == 0 {{ rgb("{PANEL2}") }} else if calc.even(row) {{ rgb("{PANEL}") }} else {{ rgb("{INK}") }},
  [#text(fill: rgb("{ACID}"), weight: "bold", size: 8.5pt)[MODULE]],
  [#text(fill: rgb("{ACID}"), weight: "bold", size: 8.5pt)[LESSONS]],"""]
    for mod in MODULES:
        names = "  ·  ".join(f"{lid} {t}" for lid, t, _ in mod["lessons"])
        tbl.append(f"  [#text(size: 8.5pt, weight: \"bold\", fill: rgb(\"{SUB}\"))[{esc('MODULE ' + str(mod['num']) + ' · ' + mod['name'])}]],")
        tbl.append(f"  [#text(size: 7.5pt)[{esc(names)}]],")
    tbl.append(")\n#v(6pt)")
    out.append("\n".join(tbl))
    out.append(section_h2("THE 21-DAY PACING PLAN"))
    out.append(timeline_21())
    out.append(section_h2("THE INSIDER LAYER · PREMIUM FLOOR"))
    out.append(f"#text(size: 9.5pt)[Beneath the 24 lessons sits the operator's level — the mechanics the industry uses internally and almost never explains: the Radio Industry Insider Decoder, six executive module playbooks, and a 24-lesson Insider Edge. Access order: decode on day 1, then read each lesson, its Insider Edge, and the module playbook after the module's fourth lesson.]\n#v(4pt)")
    out.append(value_stack([("The 24-Lesson Masterclass System", "$2,000"),
                            ("The Radio Industry Insider Decoder", "$1,391"),
                            ("6 Executive Module Playbooks", "$600"),
                            ("The 300-Station Hometown Heat Map", "$297"),
                            ("90-Second Audio Script Vault", "$197"),
                            ("One-Page EPK Command Deck", "$147"),
                            ("90-Day Airplay-to-Income Audit Engine", "$97"),
                            ("The Entire Resource Arsenal", "$400+")]))
    out.append(section_h2("YOUR FIRST 24 HOURS"))
    out.append(meta_box("Do this before anything else", [
        "Open Module 1 and complete Lesson 1.1's masterclass dossier.",
        "Run the Unheard Tax audit — 20 minutes. Write the number down.",
        "Build your Proof Stack folder — even three screenshots and a YouTube link.",
        "Sign the No-Spam Oath. Print it and read it before every send.",
        "Post your Unheard Tax number in the community. Let the group hold you to it."], accent=ACID))
    out.append(section_h2("THE COMMITMENT OATH"))
    oath_g1 = _grid("columns: (1fr, 1fr), column-gutter: 8mm", [
        "[#align(left)[#line(length: 100%, stroke: 0.4pt + rgb(\"" + MUTED + "\"))]]",
        "[#align(right)[#line(length: 100%, stroke: 0.4pt + rgb(\"" + MUTED + "\"))]]",
    ])
    oath_g2 = _grid("columns: (1fr, 1fr)", [
        "[#align(left)[#text(fill: rgb(\"" + MUTED + "\"), size: 7.5pt, tracking: 0.15em)[SIGNATURE]]]",
        "[#align(right)[#text(fill: rgb(\"" + MUTED + "\"), size: 7.5pt, tracking: 0.15em)[DATE]]]",
    ])
    out.append(f"""[#rect(width: 100%, fill: rgb("{PANEL2}"), stroke: 1pt + rgb("{ACID}"), radius: 3pt, inset: 10pt)[
  #text(size: 9.5pt, fill: rgb("{TXT}"), style: "italic")[I am done asking for airplay. From today, I am a frequency owner. I will target with precision, prove with evidence, pitch with weapons, follow up with systems, and compound every win until airplay is a revenue line — not a hope.]
  #v(6pt)
  #line(length: 100%, stroke: 0.4pt + rgb("{LINE}"))
  #v(4pt)
  {oath_g1}
  #v(1pt)
  {oath_g2}
]
#v(7pt)
""")
    out.append("#pagebreak()")
    out.append(certificate_page())
    src = "\n".join(out)
    pdf = COURSE / "Course-Handbook.pdf"
    pdf.parent.mkdir(parents=True, exist_ok=True)
    tmp = pdf.with_suffix(".typ")
    tmp.write_text(src, encoding="utf-8")
    typst.compile(str(tmp), output=str(pdf))
    if tmp.exists():
        tmp.unlink()
    with pymupdf.open(str(pdf)) as doc:
        return len(doc), pdf

# ========================================================== HEAT MAP ATLAS ==
HEATDB = COURSE / "Bonuses" / "Bonus-1-Hometown-Heat-Map-Database" / "Hometown-Heat-Map-300-Database.md"

REGIONS = {
    "Northeast": ["ME", "VT", "NH", "MA", "RI", "CT", "NY", "NJ", "PA"],
    "Mid-Atlantic": ["DE", "MD", "DC", "VA", "WV"],
    "Southeast": ["NC", "SC", "GA", "FL", "KY", "TN", "AL", "MS", "AR"],
    "South": ["TX", "OK", "LA"],
    "Midwest": ["OH", "MI", "IN", "IL", "WI", "MN", "IA", "MO", "KS", "NE", "ND", "SD"],
    "Mountain": ["MT", "ID", "WY", "CO", "UT", "NV", "NM", "AZ"],
    "Pacific": ["WA", "OR", "CA", "AK", "HI"],
}


def load_heat_data():
    md = HEATDB.read_text(encoding="utf-8")
    rows = re.findall(r"^\|\s*\d+\s*\|(.*)\|", md, re.M)
    by_state = collections.Counter()
    rings = collections.Counter()
    fmts = collections.Counter()
    for row in rows:
        cells = [c.strip() for c in row.split("|")]
        if len(cells) >= 6:
            by_state[cells[2]] += 1
            rings[cells[3]] += 1
            fmts[cells[4].split("/")[0].strip()] += 1
    reg = collections.Counter()
    for s, c in by_state.items():
        for rname, sts in REGIONS.items():
            if s in sts:
                reg[rname] += c
    return by_state, reg, rings, fmts


def heat_fill(count: int, maxc: int) -> str:
    t = 0.0 if maxc <= 0 else (count / maxc) ** 0.7
    r = int(18 + (255 - 18) * t)
    g = int(24 + (230 - 24) * t)
    b = int(24 + (0 - 24) * t)
    return f"rgb(\"#{r:02x}{g:02x}{b:02x}\")"


def heat_text(count: int, maxc: int) -> str:
    return "#000000" if (maxc > 0 and count / maxc > 0.45) else "#e8e8e0"


# Classic 11-column US tile-grid map (all 50 states + DC).
STATE_TILES = {
    "AK": (0, 0), "WA": (1, 0), "OR": (2, 0), "ID": (3, 0), "MT": (4, 0), "ND": (5, 0),
    "MN": (6, 0), "IL": (7, 0), "WI": (8, 0), "VT": (9, 0), "ME": (10, 0),
    "CA": (1, 1), "NV": (2, 1), "UT": (3, 1), "WY": (4, 1), "SD": (5, 1), "IA": (6, 1),
    "IN": (7, 1), "MI": (8, 1), "NY": (9, 1), "NH": (10, 1),
    "AZ": (1, 2), "NM": (2, 2), "CO": (3, 2), "NE": (4, 2), "MO": (5, 2), "KY": (6, 2),
    "OH": (7, 2), "PA": (8, 2), "NJ": (9, 2), "MA": (10, 2),
    "HI": (1, 3), "OK": (2, 3), "KS": (3, 3), "AR": (4, 3), "TN": (5, 3), "WV": (6, 3),
    "VA": (7, 3), "MD": (8, 3), "DE": (9, 3), "CT": (10, 3),
    "TX": (2, 4), "LA": (3, 4), "MS": (4, 4), "AL": (5, 4), "GA": (6, 4), "SC": (7, 4),
    "NC": (8, 4), "DC": (9, 4), "RI": (10, 4),
    "FL": (6, 5),
}


def heat_legend(maxc: int) -> str:
    steps = []
    for i in range(7):
        cnt = round(maxc * i / 6)
        steps.append("[#rect(width: 9mm, height: 4mm, fill: " + heat_fill(cnt, maxc) + ", stroke: 0.4pt + rgb(\"#000000\"))]")
    inner = _grid("columns: 7, column-gutter: 1pt", steps)
    g_sw = _grid("columns: (1fr, auto)", [
        "[#text(fill: rgb(\"" + MUTED + "\"), size: 7pt)[COOL → HOT · TARGET CONCENTRATION]]",
        "[" + inner + "]",
    ])
    return g_sw + ("\n#v(1pt)\n#align(right)[#text(fill: rgb(\"" + FAINT + "\"), size: 6.5pt)[0 → " + str(maxc) + " stations / state]]")


def state_tile_heatmap(by_state) -> str:
    maxc = max(by_state.values()) if by_state else 1
    all_cells = []
    for row in range(6):
        for col in range(11):
            ab = None
            for a, (c, r) in STATE_TILES.items():
                if r == row and c == col:
                    ab = a
                    break
            if ab is None:
                all_cells.append("[#box(width: 9.5mm, height: 9.5mm)]")
            else:
                cnt = by_state.get(ab, 0)
                fill = heat_fill(cnt, maxc)
                tcol = heat_text(cnt, maxc)
                all_cells.append(
                    "[#rect(width: 9.5mm, height: 9.5mm, fill: " + fill + ", stroke: 0.4pt + rgb(\"#000000\"), radius: 1pt)["
                    "#align(center + horizon)[#text(size: 7pt, weight: \"bold\", fill: rgb(\"" + tcol + "\"))[" + ab + "]]"
                    "#align(center + horizon)[#text(size: 5.5pt, fill: rgb(\"" + tcol + "\"))[" + str(cnt) + "]]"
                    "]]")
    g = _grid("columns: 11, column-gutter: 1.5pt, row-gutter: 1.5pt, align: center + horizon", all_cells)
    return f"""#rect(width: 100%, fill: rgb("{PANEL}"), stroke: 0.5pt + rgb("{LINE}"), radius: 4pt, inset: 10pt)[
  #align(center)[#text(fill: rgb("{ACID}"), weight: "bold", size: 9.5pt)[THE HOMETOWN HEAT MAP · STATION DENSITY BY STATE]]
  #v(2pt)
  #align(center)[#text(fill: rgb("{MUTED}"), size: 7pt)[300 curated targets · 50 states + DC · color = concentration of stations]]
  #v(7pt)
  {g}
  #v(6pt)
  {heat_legend(maxc)}
]
#v(7pt)
"""


def heat_bars(items, maxc, title, subtitle, value_label="stations") -> str:
    rows = []
    for name, cnt in items:
        pct = (cnt / maxc * 100) if maxc else 0
        fill = heat_fill(cnt, maxc)
        rows.append(_grid("columns: (2.2fr, 4fr), column-gutter: 8pt, row-gutter: 3pt", [
            "[#align(right)[#text(fill: rgb(\"" + SUB + "\"), size: 8pt, weight: \"bold\")[" + esc(name) + "]]]",
            "[#box(width: 100%)[#rect(width: " + str(max(pct, 2)) + "%, height: 5mm, fill: " + fill + ", stroke: 0.4pt + rgb(\"#000000\"), radius: 1pt)#box(width: 4pt)#text(fill: rgb(\"" + ACID + "\"), size: 8pt, weight: \"bold\")[" + str(cnt) + " " + value_label + "]]]",
        ]))
    return f"""#rect(width: 100%, fill: rgb("{PANEL}"), stroke: 0.5pt + rgb("{LINE}"), radius: 4pt, inset: 10pt)[
  #text(fill: rgb("{ACID}"), size: 8.5pt, weight: "bold")[{esc(title.upper())}]
  #v(1pt)
  #text(fill: rgb("{MUTED}"), size: 7pt)[{esc(subtitle)}]
  #v(5pt)
  {chr(10).join(rows)}
]
#v(7pt)
"""


def ring_tier_heat(rings) -> str:
    items = [
        ("RING 1 · Hometown Metro", rings.get("Ring 1", 0)),
        ("RING 1/2 · Metro + Commuter", rings.get("Ring 1/2", 0)),
        ("RING 2/3 · Commuter + Region", rings.get("Ring 2/3", 0)),
        ("RING 3/4 · Regional + National", rings.get("Ring 3/4", 0)),
    ]
    return heat_bars(items, max(rings.values()), "Ring Tier Heat · Priority By Proximity",
                     "Pitch inner rings first — proximity lowers ask risk.", "stations")


def format_heat_grid(fmts) -> str:
    top = fmts.most_common(8)
    maxc = top[0][1] if top else 1
    cells = []
    for name, cnt in top:
        fill = heat_fill(cnt, maxc)
        tcol = heat_text(cnt, maxc)
        parts = name.split(" ")
        label = parts[0] + (" " + parts[1] if len(parts) > 1 else "")
        cells.append("[#rect(width: 100%, fill: " + fill + ", stroke: 0.4pt + rgb(\"#000000\"), radius: 2pt, inset: 6pt)["
                     "#text(size: 8pt, weight: \"bold\", fill: rgb(\"" + tcol + "\"))[" + esc(label) + "]"
                     "#v(1pt)"
                     "#text(size: 7pt, weight: \"bold\", fill: rgb(\"" + tcol + "\"))[" + str(cnt) + " stations]]]")
    g_top = _grid("columns: (1fr, 1fr, 1fr, 1fr), column-gutter: 5pt, row-gutter: 5pt", cells[:4])
    g_bot = _grid("columns: (1fr, 1fr, 1fr, 1fr), column-gutter: 5pt, row-gutter: 5pt", cells[4:])
    return f"""#rect(width: 100%, fill: rgb("{PANEL}"), stroke: 0.5pt + rgb("{LINE}"), radius: 4pt, inset: 10pt)[
  #text(fill: rgb("{ACID}"), size: 8.5pt, weight: "bold")[FORMAT HEAT GRID · WHERE THE OPEN DOORS ARE]
  #v(1pt)
  #text(fill: rgb("{MUTED}"), size: 7pt)[Top formats by station count — the lanes with the most targets]
  #v(5pt)
  {g_top}
  #v(5pt)
  {g_bot}
]
#v(7pt)
"""


def top_states_heat(by_state) -> str:
    top = by_state.most_common(10)
    return heat_bars([(s, c) for s, c in top], top[0][1], "Top 10 Hottest States",
                     "Highest target concentration — start your first campaign here.", "stations")


def heat_atlas_section(by_state, reg, rings, fmts) -> str:
    return (section_h2("VISUAL HEAT MAP ATLAS · READ THE CONCENTRATION")
            + state_tile_heatmap(by_state)
            + heat_bars(list(reg.items()), max(reg.values()), "Regional Heat Index · 7 Command Regions",
                        "Where the 300 targets concentrate across the country.", "stations")
            + ring_tier_heat(rings)
            + format_heat_grid(fmts)
            + top_states_heat(by_state)
            + section_h2("HOW TO READ THIS ATLAS"))


def ring_perimeter_diagram() -> str:
    """Concentric 4-ring hometown heat-map diagram for Lesson 2.1."""
    rings = [("RING 1", "0–30 mi", "home metro · you are local news"),
             ("RING 2", "30–90 mi", "commuter zone · weekend traffic"),
             ("RING 3", "90–200 mi", "regional perimeter · touring acts"),
             ("RING 4", "200–350 mi", "tour corridor · presale priming")]
    fills = ["#fff0a0", "#ffdc00", "#ffb300", "#ff6a00"]
    circles = []
    for i, (name, miles, sub) in enumerate(rings):
        r = 6 + i * 8  # mm radius
        circles.append(
            "#place(center + horizon)["
            "#circle(radius: " + str(r) + "mm, stroke: 1pt + rgb(\"#ffe600\"), fill: rgb(\"" + fills[i] + "\"))"
            "]")
    inner = "\n".join(circles)
    return f"""#rect(width: 100%, fill: rgb("{PANEL}"), stroke: 0.5pt + rgb("{LINE}"), radius: 4pt, inset: 10pt)[
  #align(center)[#text(fill: rgb("{ACID}"), weight: "bold", size: 9.5pt)[THE FOUR-RING HOMETOWN PERIMETER]]
  #v(2pt)
  #align(center)[#text(fill: rgb("{MUTED}"), size: 7pt)[Concentrate fire where proximity makes you commercially undeniable]]
  #v(6pt)
  #box(width: 100%, height: 78mm)[
    {inner}
    #place(center + horizon)[#circle(radius: 5mm, stroke: 0.5pt + rgb("{INK}"), fill: rgb("{ACID}"))[#align(center + horizon)[#text(size: 7pt, weight: \"bold\", fill: rgb("{INK}"))[YOU]]]]
  ]
  #v(6pt)
  {ring_legend()}
]
#v(7pt)
"""


def ring_legend() -> str:
    cells = [
        "[#rect(width: 100%, fill: rgb(\"#fff0a0\"), stroke: 0.4pt + rgb(\"#000000\"), radius: 2pt, inset: 5pt)[#text(size: 7pt, weight: \"bold\", fill: black)[RING 1 · 0–30 mi]#v(1pt)#text(size: 6.5pt, fill: black)[home metro]]]",
        "[#rect(width: 100%, fill: rgb(\"#ffdc00\"), stroke: 0.4pt + rgb(\"#000000\"), radius: 2pt, inset: 5pt)[#text(size: 7pt, weight: \"bold\", fill: black)[RING 2 · 30–90 mi]#v(1pt)#text(size: 6.5pt, fill: black)[commuter zone]]]",
        "[#rect(width: 100%, fill: rgb(\"#ffb300\"), stroke: 0.4pt + rgb(\"#000000\"), radius: 2pt, inset: 5pt)[#text(size: 7pt, weight: \"bold\", fill: black)[RING 3 · 90–200 mi]#v(1pt)#text(size: 6.5pt, fill: black)[regional perimeter]]]",
        "[#rect(width: 100%, fill: rgb(\"#ff6a00\"), stroke: 0.4pt + rgb(\"#000000\"), radius: 2pt, inset: 5pt)[#text(size: 7pt, weight: \"bold\", fill: black)[RING 4 · 200–350 mi]#v(1pt)#text(size: 6.5pt, fill: black)[tour corridor]]]",
    ]
    g = _grid("columns: (1fr, 1fr, 1fr, 1fr), column-gutter: 5pt, row-gutter: 5pt", cells)
    return g


def module2_heat_section() -> str:
    by_state, reg, rings, fmts = load_heat_data()
    return (section_h2("VISUAL HEAT MAP · THE FOUR RINGS AND THE NATIONAL FIELD")
            + ring_perimeter_diagram()
            + state_tile_heatmap(by_state)
            + meta_box("How to read this map", [
                "Ring 1 & 2 are lowest-risk asks — stack them first.",
                "Hottest states on the national field = where to launch your 20-station war room.",
                "Tier the markets: college towns (weekly cycles), mid metros, PPM metros.",
                "Synchronize every hot region with a live tour date."], accent=ACID))


def build_heat_atlas() -> tuple[int, Path]:
    by_state, reg, rings, fmts = load_heat_data()
    out = []
    out.append(prelude("HEAT MAP ATLAS", "Hometown Heat Map Atlas", base=9.5))
    out.append(cover("THE HOMETOWN HEAT MAP ATLAS", "BONUS 1 · TARGET DATABASE",
                     "300-Station Station Density Visual Atlas",
                     "Every station in the master database mapped as a visual heat map — state by state, region by region, format by format.",
                     badge="VISUAL HEAT MAP ATLAS · PREMIUM TRAINING EDITION"))
    out.append("#pagebreak()")
    out.append(section_h2("THE 300-STATION DENSITY MAP"))
    out.append(state_tile_heatmap(by_state))
    out.append("#pagebreak()")
    out.append(section_h2("REGIONAL HEAT INDEX"))
    out.append(heat_bars(list(reg.items()), max(reg.values()), "7 Command Regions",
                         "Where the targets concentrate — plan your tour corridor here.", "stations"))
    out.append(section_h2("RING-TIER HEAT · PROXIMITY = POWER"))
    out.append(ring_tier_heat(rings))
    out.append("#pagebreak()")
    out.append(section_h2("FORMAT HEAT GRID"))
    out.append(format_heat_grid(fmts))
    out.append(section_h2("TOP 10 HOTTEST STATES"))
    out.append(top_states_heat(by_state))
    out.append(section_h2("ATLAS METHOD"))
    out.append(meta_box("How to use the atlas", [
        "Hottest states = launch your first 20-station war room there.",
        "Follow the regional heat index to build a single tour corridor, not scattered blasts.",
        "Ring 1/2 targets are the lowest-risk asks — stack them first.",
        "Open a format with the most stations to maximize your add odds.",
        "Synchronize every hot region with a live tour date for maximum conversion."], accent=ACID))
    src = "\n".join(out)
    pdf = COURSE / "Hometown-Heat-Map-Atlas.pdf"
    pdf.parent.mkdir(parents=True, exist_ok=True)
    tmp = pdf.with_suffix(".typ")
    tmp.write_text(src, encoding="utf-8")
    typst.compile(str(tmp), output=str(pdf))
    if tmp.exists():
        tmp.unlink()
    with pymupdf.open(str(pdf)) as doc:
        return len(doc), pdf


if __name__ == "__main__":
    print("=" * 63)
    print("FREQUENCY DOMINION — PREMIUM MASTER CLASS SERIES PDF PIPELINE")
    print("=" * 63 + "\n")
    total_pdfs = 0
    total_pages = 0

    # 0. Course Handbook
    p, _ = build_course_handbook()
    total_pdfs += 1; total_pages += p
    print(f"[HANDBOOK]   {p:2d} pages  -->  Course-Handbook.pdf")

    # 0b. Six module guides
    print("\n--- 6 Full-Length Module Guides ---")
    for mod in MODULES:
        p, path = build_module_guide(mod)
        total_pdfs += 1; total_pages += p
        print(f"[MODULE]     {p:2d} pages  -->  {path.relative_to(COURSE)}")

    # 0c. Heat map atlas
    p, _ = build_heat_atlas()
    total_pdfs += 1; total_pages += p
    print(f"[ATLAS]      {p:2d} pages  -->  Hometown-Heat-Map-Atlas.pdf")

    # 1. Course Overview
    ov = COURSE / "Course-Overview.md"
    p = compile_doc(ov, COURSE / "Course-Overview.pdf", "SYSTEM BLUEPRINT",
                    "Frequency Dominion · The 24-Lesson Radio Ownership System",
                    cover_info=("FREQUENCY DOMINION", "SYSTEM BLUEPRINT",
                                "The 24-Lesson Radio Ownership System",
                                "Turn one ignored email into 20 stations, 3 touches, and a compounding airplay empire — without begging, blasting, or burning wells.",
                                "MASTER CLASS SERIES · TRAINING EDITION"),
                    cover_value="$5,193 stack · now $97",
                    graphic=value_stack([("The 24-Lesson Masterclass System", "$2,000"),
                                         ("The Radio Industry Insider Decoder", "$1,391"),
                                         ("6 Executive Module Playbooks", "$600"),
                                         ("The 300-Station Hometown Heat Map", "$297"),
                                         ("90-Second Audio Script Vault", "$197"),
                                         ("One-Page EPK Command Deck", "$147"),
                                         ("90-Day Airplay-to-Income Audit Engine", "$97"),
                                         ("The Entire Resource Arsenal", "$400+")]))
    total_pdfs += 1; total_pages += p
    print(f"[OVERVIEW]   {p:2d} pages  -->  Course-Overview.pdf")

    # 2. Lessons → War-Room dossiers
    print("\n--- 24 Lesson Masterclass Dossiers ---")
    for mod_dir in sorted(COURSE.glob("Module-*")):
        for l_md in sorted((mod_dir / "Lessons").glob("*.md")):
            lid = lesson_id_from_name(l_md.stem)
            stem = l_md.stem.replace("Lesson-", "War-Room-")
            out = (mod_dir / "War-Room-Notes") / f"{stem}.pdf"
            out.parent.mkdir(parents=True, exist_ok=True)
            title = stem.replace("War-Room-", "").replace("-", " ")
            cat = f"{mod_dir.name[:8]} · MASTERCLASS DOSSIER"
            gr = timeline_21() if lid == "4.1" else (growth_chart() if lid == "1.1" else None)
            if lid == "2.1":
                gr = module2_heat_section()
            p = compile_doc(l_md, out, cat, title,
                            insider=INSIDER.get(lid), pro=PRO.get(lid), graphic=gr,
                            subtitle="Lesson masterclass · implementation drills · war-room directive",
                            objectives=LESSON_OBJ.get(lid), takeaways=LESSON_TAKE.get(lid),
                            assessment=LESSON_ASSESS.get(lid))
            total_pdfs += 1; total_pages += p
            print(f"[LESSON]     {p:2d} pages  -->  {out.relative_to(COURSE)}")

    # 3. Executive insider PDFs
    print("\n--- Executive Insider Briefings ---")
    insider_dir = COURSE / "Resources" / "Insider"
    exec_out = insider_dir / "Executive-PDFs"
    exec_out.mkdir(parents=True, exist_ok=True)
    exec_map = {"Radio-Industry-Insider-Decoder.md": "DECODER · THE RATINGS ENGINE"}
    exec_cover = {"Radio-Industry-Insider-Decoder.md":
                  ("THE RADIO INDUSTRY INSIDER DECODER", "OPERATOR LAYER",
                   "The mechanics nobody explains to independents",
                   "How ratings work, how a station's clock is built, when adds happen, and how the promotion industry moves music.",
                   "EXECUTIVE BRIEFING · PREMIUM FLOOR")}
    for md_file in sorted(insider_dir.glob("*.md")):
        if md_file.name == "Insider-Layer-README.md":
            continue
        name = md_file.stem
        cat = exec_map.get(md_file.name, "EXECUTIVE BRIEFING · OPERATOR LAYER")
        gr = process_flow() if md_file.name == "Radio-Industry-Insider-Decoder.md" else None
        p = compile_doc(md_file, exec_out / f"{name}.pdf", cat, name.replace("-", " "),
                        cover_info=exec_cover.get(md_file.name), graphic=gr)
        total_pdfs += 1; total_pages += p
        print(f"[EXECUTIVE]  {p:2d} pages  -->  Executive-PDFs/{name}.pdf")

    # 4. Bonus PDFs
    print("\n--- 5 Bonus PDFs ---")
    b = COURSE / "Bonuses"
    bonus_map = [
        ("Bonus-1-Hometown-Heat-Map-Database", "Hometown-Heat-Map-300-Database.md",
         "BONUS 1 · TARGET DATABASE", "Hometown Heat Map — 300 Curated Stations",
         "Your 300-station targeting directory", True),
        ("Bonus-2-90-Second-Audio-Script-Vault", "90-Second-Radio-Ready-Audio-Script-Vault.md",
         "BONUS 2 · AUDIO WEAPONS", "The 90-Second Radio-Ready Audio Script Vault",
         "10 full scripts + hook formulas that force replies", False),
        ("Bonus-3-EPK-Command-Deck", "One-Page-EPK-Command-Deck.md",
         "BONUS 3 · COMMAND DECK", "The One-Page EPK Command Deck",
         "The proof weapon that commands attention", False),
        ("Bonus-4-90-Day-Audit-Engine", "90-Day-Airplay-to-Income-Audit-Engine.md",
         "BONUS 4 · GOVERNANCE ENGINE", "The 90-Day Airplay-to-Income Audit Engine",
         "50-point audit · spin verification · revenue attribution", False),
        ("Bonus-5-Resources", "Master-Resource-Arsenal.md",
         "BONUS 5 · ARSENAL INDEX", "The Master Resource Arsenal",
         "Every heat map, calendar, pitch vault and sequence in one index", False),
    ]
    for folder, md_name, cat, title, sub, is_db in bonus_map:
        md = b / folder / md_name
        pdf = b / folder / f"{Path(md_name).stem}.pdf"
        kw = dict(is_database=is_db, base=8.0 if is_db else 9.5)
        if md_name == "Hometown-Heat-Map-300-Database.md":
            by_state, reg, rings, fmts = load_heat_data()
            kw["prepend"] = heat_atlas_section(by_state, reg, rings, fmts)
            kw["suppress_h1"] = True
        p = compile_doc(md, pdf, cat, title,
                        cover_info=(title.split("·")[1].strip() if "·" in title else title,
                                    cat, sub, "", "BONUS · PREMIUM TRAINING EDITION"), **kw)
        total_pdfs += 1; total_pages += p
        print(f"[BONUS]      {p:2d} pages  -->  {pdf.relative_to(COURSE)}")

    # 5. Resource PDFs
    print("\n--- Resource PDFs ---")
    res = COURSE / "Resources"
    res_targets = [
        ("Audit", "90-Day-Audit-Checklist.md", None, "RESOURCE · AUDIT", "The 90-Day Quarterly Audit Checklist"),
        ("Calendars", "21-Day-Campaign-Calendar.md", None, "RESOURCE · CALENDARS", "The 21-Day Campaign Calendar Battle Rhythm"),
        ("Calendars", "Quarterly-Release-Calendar.md", None, "RESOURCE · CALENDARS", "Quarterly Release Calendar & Annual Roadmap"),
        ("Follow-Up", "3-Touch-Follow-Up-Sequences-and-Templates.md", "3-Touch-Follow-Up-Sequences.pdf", "RESOURCE · FOLLOW-UP", "The 3-Touch Follow-Up System & Escalation Templates"),
        ("Heat-Maps", "Hometown-Heat-Map-300-Database.md", None, "RESOURCE · HEAT MAPS", "The 300-Station Hometown Heat Map Database"),
        ("Pitch-Weapons", "30-Subject-Line-Formulas.md", None, "RESOURCE · PITCH WEAPONS", "30 High-Converting Subject Line Formulas"),
        ("Pitch-Weapons", "90-Word-Pitch-Vault.md", None, "RESOURCE · PITCH WEAPONS", "The 90-Word Modular Pitch Vault"),
        ("Relationships", "Relationship-Compounding-Playbook.md", None, "RESOURCE · RELATIONSHIPS", "The Relationship Compounding Playbook & Ally Engine"),
    ]
    for folder, md_name, out_name, cat, title in res_targets:
        md = res / folder / md_name
        pdf = res / folder / (out_name or f"{Path(md_name).stem}.pdf")
        is_db = md_name == "Hometown-Heat-Map-300-Database.md"
        kw = dict(is_database=is_db, base=8.0 if is_db else 9.5)
        if is_db:
            by_state, reg, rings, fmts = load_heat_data()
            kw["prepend"] = heat_atlas_section(by_state, reg, rings, fmts)
            kw["suppress_h1"] = True
        p = compile_doc(md, pdf, cat, title,
                        cover_info=(title, cat, "", "", "RESOURCE · PREMIUM TRAINING EDITION"), **kw)
        total_pdfs += 1; total_pages += p
        print(f"[RESOURCE]   {p:2d} pages  -->  {pdf.relative_to(COURSE)}")

    # 6. Worksheets
    print("\n--- Action Worksheet PDFs ---")
    for mod_dir in sorted(COURSE.glob("Module-*")):
        for md_file in sorted((mod_dir / "Templates").glob("*.md")):
            out = mod_dir / "Templates" / f"{md_file.stem}.pdf"
            title = md_file.stem.replace("-", " ")
            cat = f"{mod_dir.name[:8]} · ACTION WORKSHEET"
            p = compile_doc(md_file, out, cat, title, as_band=True,
                            subtitle="Printable action worksheet · fill in digitally or on paper")
            total_pdfs += 1; total_pages += p
            print(f"[WORKSHEET]  {p:2d} pages  -->  {out.relative_to(COURSE)}")

    print("\n" + "=" * 63)
    print(f"PIPELINE COMPLETE: {total_pdfs} PDFs | {total_pages} PAGES")
    print("=" * 63)
