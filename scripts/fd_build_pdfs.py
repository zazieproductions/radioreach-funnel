#!/usr/bin/env python3
"""Frequency Dominion — War-Room Notes PDF renderer.

Reads markdown between <!-- WARROOM:START --> and <!-- WARROOM:END --> markers
(or the entire file when no markers exist) and renders an elite, branded PDF.

Usage: /tmp/pdfenv/bin/python scripts/fd_build_pdfs.py
"""
import re
import sys
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "Frequency-Dominion-Upsell"

INK = (8, 8, 10)          # #08080a
PANEL = (16, 16, 20)      # #101014
ACID = (255, 230, 0)      # #ffe600
BLOOD = (224, 27, 36)     # #e01b24
TEXT = (235, 235, 240)
MUTED = (150, 150, 158)


class DominionPDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*PANEL)
        self.rect(0, 0, self.w, 12, "F")
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*ACID)
        self.set_xy(12, 3)
        self.cell(0, 6, "FREQUENCY DOMINION - WAR-ROOM NOTES  -  CONFIDENTIAL STRATEGY", align="L")
        self.set_text_color(*MUTED)
        self.cell(0, 6, self.title[-40:], align="R")
        self.set_draw_color(*ACID)
        self.line(12, 11, self.w - 12, 11)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "", 7.5)
        self.set_text_color(*MUTED)
        self.cell(0, 6, f"Page {self.page_no()}", align="C")


LATIN_SAFE = {
    "\u2014": "-", "\u2013": "-", "\u201c": '"', "\u201d": '"', "\u2018": "'",
    "\u2019": "'", "\u00d7": "x", "\u2192": "->", "\u2190": "<-", "\u2026": "...",
    "\u25aa": "-", "\u25ba": ">", "\u2713": "[x]", "\u2715": "[ ]", "\u2717": "[x]",
    "\u00b7": "-", "\u2011": "-", "\u2022": "-",
}


def clean_inline(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = text.replace("`", "")
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
    for k, v in LATIN_SAFE.items():
        text = text.replace(k, v)
    text = "".join(c if ord(c) < 256 else "?" for c in text)
    return text


def render_markdown(pdf: DominionPDF, lines: list[str]):
    pdf.set_text_color(*TEXT)
    for raw in lines:
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped:
            pdf.ln(2.2)
            continue
        if stripped.startswith("<!--"):
            continue
        if set(stripped) <= {"-", "="}:
            pdf.set_draw_color(60, 60, 66)
            pdf.set_line_width(0.25)
            pdf.line(12, pdf.get_y(), pdf.w - 12, pdf.get_y())
            pdf.ln(2.5)
            continue
        if stripped.startswith("**") and stripped.endswith("**") and len(stripped) < 90:
            pdf.set_font("Helvetica", "B", 15)
            pdf.set_text_color(*ACID)
            pdf.multi_cell(0, 7.2, clean_inline(stripped.strip("*")), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(1.5)
            pdf.set_text_color(*TEXT)
            continue
        if stripped.startswith("### "):
            pdf.set_font("Helvetica", "B", 12.5)
            pdf.set_text_color(*ACID)
            pdf.multi_cell(0, 6.5, clean_inline(stripped[4:]), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(1.2)
            pdf.set_text_color(*TEXT)
            continue
        if stripped.startswith("## "):
            pdf.set_font("Helvetica", "B", 15)
            pdf.set_text_color(*ACID)
            pdf.multi_cell(0, 7.5, clean_inline(stripped[3:]), new_x="LMARGIN", new_y="NEXT")
            pdf.set_draw_color(*ACID)
            pdf.set_line_width(0.5)
            pdf.line(12, pdf.get_y() + 1, 40, pdf.get_y() + 1)
            pdf.ln(3)
            pdf.set_text_color(*TEXT)
            continue
        if stripped.startswith("# "):
            pdf.set_font("Helvetica", "B", 20)
            pdf.set_text_color(*ACID)
            pdf.multi_cell(0, 9, clean_inline(stripped[2:]), new_x="LMARGIN", new_y="NEXT")
            pdf.set_draw_color(*ACID)
            pdf.set_line_width(0.8)
            pdf.line(12, pdf.get_y() + 1.5, 70, pdf.get_y() + 1.5)
            pdf.ln(4)
            pdf.set_text_color(*TEXT)
            continue
        if stripped.startswith("> "):
            pdf.set_font("Helvetica", "I", 10.5)
            pdf.set_text_color(*ACID)
            pdf.set_x(16)
            pdf.multi_cell(0, 5.8, clean_inline(stripped[2:]), new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(*TEXT)
            pdf.ln(1)
            continue
        bullet = None
        num = None
        if re.match(r"^[-*] ", stripped):
            bullet = True
            stripped = stripped[2:]
        elif re.match(r"^\d+\. ", stripped):
            num = True
            stripped = re.sub(r"^\d+\. ", "", stripped)
        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(*ACID)
            pdf.set_fill_color(24, 24, 30)
            pdf.multi_cell(0, 5.2, "   |   ".join(clean_inline(c) for c in cells), new_x="LMARGIN", new_y="NEXT", fill=True)
            pdf.set_text_color(*TEXT)
            continue
        if bullet or num:
            pdf.set_font("Helvetica", "", 9.8)
            pdf.set_x(18)
            pdf.multi_cell(0, 5.6, ("- " if bullet else "- ") + clean_inline(stripped), new_x="LMARGIN", new_y="NEXT")
            continue
        if "###" not in stripped and len(clean_inline(stripped)) > 4 and re.match(r"^[A-Z0-9].*:$", stripped):
            pdf.set_font("Helvetica", "B", 10.5)
            pdf.set_text_color(255, 255, 255)
            pdf.multi_cell(0, 6, clean_inline(stripped), new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(*TEXT)
            continue
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5.8, clean_inline(stripped), new_x="LMARGIN", new_y="NEXT")


def make_pdf(out_path: Path, title: str, subtitle: str, md_text: str):
    pdf = DominionPDF(format="A4")
    pdf.set_title(title)
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    pdf.set_fill_color(*INK)
    pdf.rect(0, 0, pdf.w, 78, "F")
    pdf.set_draw_color(*ACID)
    pdf.set_line_width(0.9)
    pdf.line(0, 78, pdf.w, 78)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*ACID)
    pdf.set_xy(12, 16)
    pdf.cell(0, 6, "RADIOREACH.US  ·  FREQUENCY DOMINION".replace("\u00b7", "-"))
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_xy(12, 30)
    pdf.multi_cell(0, 10, clean_inline(title), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*MUTED)
    pdf.set_xy(12, 58)
    pdf.multi_cell(0, 6, clean_inline(subtitle), new_x="LMARGIN", new_y="NEXT")
    pdf.set_y(pl := max(pdf.get_y(), 86))
    render_markdown(pdf, [clean_inline(l) for l in md_text.splitlines()])
    pdf.output(str(out_path))


def extract_section(md: str) -> str:
    m = re.search(r"<!-- WARROOM:START -->(.*?)<!-- WARROOM:END -->", md, re.S)
    if m:
        return m.group(1).strip()
    # fallback: everything from the WAR-ROOM heading to the next top-level heading
    m = re.search(r"## WAR-ROOM NOTES(.*?)(?=\n## |\Z)", md, re.S)
    return m.group(1).strip() if m else md


def build_module_pdfs():
    out = 0
    for module_dir in sorted(COURSE.glob("Module-*")):
        lesson_dir = module_dir / "Lessons"
        war_dir = module_dir / "War-Room-Notes"
        war_dir.mkdir(exist_ok=True)
        for lesson in sorted(lesson_dir.glob("*.md")):
            md = lesson.read_text(encoding="utf-8")
            section = extract_section(md)
            title_match = re.search(r"^# (.+)$", md, re.M)
            title = title_match.group(1).strip() if title_match else lesson.stem
            pdf_path = war_dir / f"{lesson.stem.replace('Lesson-', 'War-Room-')}.pdf"
            make_pdf(pdf_path, title, "Elite private strategy · not for redistribution", section)
            out += 1
    return out


def build_overview_pdf():
    md_path = COURSE / "Course-Overview.md"
    md = md_path.read_text(encoding="utf-8")
    make_pdf(COURSE / "Course-Overview.pdf", "Frequency Dominion", "The 24-Lesson Radio Ownership System", md)
    return 1


def build_insider_pdfs():
    insider = COURSE / "Resources" / "Insider"
    out_dir = insider / "Executive-PDFs"
    out_dir.mkdir(exist_ok=True)
    n = 0
    for md_path in sorted(insider.glob("*.md")):
        if md_path.name == "Insider-Layer-README.md":
            continue
        md = md_path.read_text(encoding="utf-8")
        title_match = re.search(r"^# (.+)$", md, re.M)
        title = title_match.group(1).strip() if title_match else md_path.stem
        pdf_path = out_dir / f"{md_path.stem}.pdf"
        make_pdf(pdf_path, title, "Executive insider briefing - confidential", md)
        n += 1
    return n


if __name__ == "__main__":
    n = build_module_pdfs()
    build_overview_pdf()
    m = build_insider_pdfs()
    print(f"Built {n} war-room PDFs + Course-Overview.pdf + {m} executive PDFs")
