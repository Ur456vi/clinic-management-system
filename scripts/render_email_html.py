#!/usr/bin/env python3
"""
render_email_html.py — render a markdown email body into a designed HTML email.

Usage:
    python3 scripts/render_email_html.py \
        --subject "[Vyara] Sprint 1 Day 2 — ..." \
        --body-file assignments/2026-05-14/urvi.md \
        [--out assignments/2026-05-14/urvi.html]

If --out is omitted, HTML is written to stdout.

The input body file may include RFC822-style headers (To/Cc/Subject/From) — they
are stripped before rendering, matching the parsing in scripts/send_email.sh.

Design system (inline styles, kept simple for email-client compatibility):
  - Header gradient: teal-700 → slate-900
  - Accent: teal-600 (#0d9488)
  - Code/path styling: slate-100 bg, monospace
  - "Notes from PM" or "## Notes …" H2 sections get a teal callout treatment
  - Numbered "**1. Title**" task bullets get a teal numeric badge
"""
import argparse
import html
import re
import sys
from datetime import date
from pathlib import Path

try:
    import markdown as md_lib  # type: ignore
except ImportError:
    md_lib = None  # We'll fall back to a tiny inline renderer.


# ---------- Style tokens ----------
S = {
    "body":      "margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e293b;",
    "container": "max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06),0 4px 12px rgba(15,23,42,0.04);",
    "header":    "background:linear-gradient(135deg,#0f766e 0%,#0f172a 100%);padding:24px 28px;",
    "kicker":    "font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5eead4;font-weight:600;",
    "chip":      "background:rgba(94,234,212,0.15);color:#5eead4;padding:3px 10px;border-radius:999px;font-weight:600;font-size:11px;letter-spacing:0.3px;",
    "date":      "margin-left:10px;color:#cbd5e1;font-size:13px;",
    "h1":        "margin:0;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;",
    "h2":        "margin:24px 0 8px 0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#0f766e;font-weight:700;border-bottom:2px solid #ccfbf1;padding-bottom:8px;",
    "p":         "margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#334155;",
    "ul":        "margin:0 0 14px 0;padding-left:22px;font-size:15px;line-height:1.65;color:#334155;",
    "li":        "margin-bottom:6px;",
    "strong":    "color:#0f172a;font-weight:700;",
    "code":      "background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:#0f172a;",
    "footer":    "border-top:1px solid #e2e8f0;padding-top:14px;font-size:11px;color:#94a3b8;line-height:1.6;",
    "callout":   "background:#f0fdfa;border-left:4px solid #0d9488;border-radius:6px;padding:16px 18px;margin:14px 0;",
    "callout_kicker": "font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#0f766e;font-weight:700;margin-bottom:8px;",
    "sig":       "font-size:14px;color:#0f172a;font-weight:600;margin-top:18px;",
    "sig_sub":   "font-size:12px;color:#94a3b8;margin-top:2px;",
}


# ---------- Markdown pre-processing ----------
def preprocess_markdown(body: str) -> str:
    """Normalize PM-draft markdown so the parser sees expected block structure.

    1) Insert a blank line after a bold numbered heading like '**1. Foo**' so
       the following '- bullet' lines parse as a list (and not as a continuation
       paragraph with literal dashes).
    2) Normalize en/em-dash bullets ('–', '—') to '-' at start of lines so
       lists don't get confused. (Currently a no-op; reserved.)
    """
    out: list[str] = []
    lines = body.splitlines()
    for i, line in enumerate(lines):
        out.append(line)
        if re.match(r"^\*\*\d+\.\s.*\*\*\s*$", line):
            # If the next non-empty line is a bullet, ensure a blank line separates them.
            nxt = lines[i + 1] if i + 1 < len(lines) else ""
            if nxt.lstrip().startswith("- ") or nxt.lstrip().startswith("* "):
                if not (i + 1 < len(lines) and lines[i + 1].strip() == ""):
                    out.append("")
    return "\n".join(out)


# ---------- Markdown → HTML body ----------
def strip_headers(text: str) -> str:
    """Drop any leading RFC822-style headers up to the first blank line."""
    lines = text.splitlines()
    i = 0
    saw_header = False
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            if saw_header:
                i += 1
                break
            i += 1
            continue
        if re.match(r"^(To|Cc|Bcc|From|Subject|Reply-To|Html-File):\s", line):
            saw_header = True
            i += 1
            continue
        break
    return "\n".join(lines[i:]) if saw_header else text


def render_markdown(body: str) -> str:
    body = preprocess_markdown(body)
    if md_lib:
        html_body = md_lib.markdown(body, extensions=["extra", "sane_lists"])
    else:
        # Minimal fallback: paragraphs, headings, bullets, inline code, bold.
        html_body = _fallback_markdown(body)
    return html_body


def _fallback_markdown(text: str) -> str:
    out = []
    in_list = False
    for raw in text.split("\n\n"):
        block = raw.strip("\n")
        if not block:
            continue
        if block.startswith("## "):
            out.append(f"<h2>{html.escape(block[3:].strip())}</h2>")
        elif block.startswith("# "):
            out.append(f"<h1>{html.escape(block[2:].strip())}</h1>")
        elif all(ln.lstrip().startswith("- ") for ln in block.splitlines() if ln.strip()):
            items = "".join(f"<li>{_inline(ln.lstrip()[2:])}</li>" for ln in block.splitlines() if ln.strip())
            out.append(f"<ul>{items}</ul>")
        else:
            out.append(f"<p>{_inline(block).replace(chr(10), '<br>')}</p>")
    return "\n".join(out)


def _inline(s: str) -> str:
    s = html.escape(s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    return s


# ---------- Style injection ----------
def style_tag(tag: str, style: str) -> tuple[re.Pattern, str]:
    return re.compile(rf"<{tag}(\s|>)"), f'<{tag} style="{style}"\\1'


REPLACE_STYLES = [
    style_tag("p", S["p"]),
    style_tag("ul", S["ul"]),
    style_tag("ol", S["ul"]),
    style_tag("li", S["li"]),
    style_tag("strong", S["strong"]),
    style_tag("code", S["code"]),
]


def inject_styles(html_body: str) -> str:
    for pat, repl in REPLACE_STYLES:
        html_body = pat.sub(repl, html_body)
    # Restyle <h2>… as our section header.
    html_body = re.sub(
        r"<h2(?:\s[^>]*)?>(.*?)</h2>",
        lambda m: f'<div style="{S["h2"]}">{m.group(1)}</div>',
        html_body,
        flags=re.DOTALL,
    )
    # h1 in body (rare; we already render subject as title)
    html_body = re.sub(
        r"<h1(?:\s[^>]*)?>(.*?)</h1>",
        lambda m: f'<h1 style="{S["h1"]}">{m.group(1)}</h1>',
        html_body,
        flags=re.DOTALL,
    )
    return html_body


CALLOUT_HEADINGS = {"notes from pm", "important notes", "pm notes"}


def wrap_callouts(html_body: str) -> str:
    """Convert a section whose H2 text matches CALLOUT_HEADINGS into a styled callout.

    Captures the H2 heading plus its IMMEDIATELY-FOLLOWING block (the next <ul>,
    <ol>, or single <p>). Trailing prose like a closing paragraph or signature
    stays outside the callout.
    """
    h2_style = re.escape(S["h2"])
    pattern = re.compile(
        rf'<div style="{h2_style}">([^<]+)</div>\s*(<ul[^>]*>.*?</ul>|<ol[^>]*>.*?</ol>|<p[^>]*>.*?</p>)',
        re.DOTALL,
    )

    def repl(m: re.Match) -> str:
        heading = m.group(1).strip().lower()
        if heading not in CALLOUT_HEADINGS:
            return m.group(0)
        return (
            f'<div style="{S["callout"]}">'
            f'<div style="{S["callout_kicker"]}">{html.escape(m.group(1).strip())}</div>'
            f"{m.group(2)}"
            f"</div>"
        )

    return pattern.sub(repl, html_body)


def signature_block(html_body: str) -> tuple[str, str]:
    """Pull a trailing '— Vyara PM' style line out of the body into a separate signature."""
    m = re.search(r"<p[^>]*>—\s*(.+?)</p>\s*$", html_body, flags=re.DOTALL)
    if not m:
        return html_body, ""
    sig_text = re.sub(r"<[^>]+>", "", m.group(1)).strip()
    # Common pattern: "Vyara PM (autonomous agent)"
    sub = ""
    primary = sig_text
    paren = re.search(r"\(([^)]+)\)", sig_text)
    if paren:
        sub = paren.group(1).strip()
        primary = sig_text[: paren.start()].strip()
    sig_html = (
        f'<div style="{S["sig"]}">— {html.escape(primary)}</div>'
        + (f'<div style="{S["sig_sub"]}">{html.escape(sub)}</div>' if sub else "")
    )
    return html_body[: m.start()], sig_html


# ---------- Subject cleaning ----------
def clean_subject(subject: str) -> tuple[str, str]:
    """Return (title, kicker) for the header. Strip leading "[Vyara] " etc."""
    title = subject.strip()
    kicker = "Vyara PM · Autonomous Agent"
    if title.startswith("[Vyara]"):
        title = title[len("[Vyara]"):].strip()
    return title, kicker


# ---------- Final assembly ----------
TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title_text}</title>
</head>
<body style="{body_style}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="{container_style}">
        <tr>
          <td style="{header_style}">
            <div style="{kicker_style}">{kicker}</div>
            <div style="margin-top:8px;font-size:13px;color:#cbd5e1;">
              <span style="{chip_style}">{chip_text}</span>
              <span style="{date_style}">{today}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px 28px;">
            <h1 style="{h1_style}">{title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 0 28px;">
            {body_html}
            {signature_html}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 24px 28px;">
            <div style="{footer_style}">
              Sent automatically · <a href="mailto:hello@algoborne.com" style="color:#0f766e;text-decoration:none;">hello@algoborne.com</a>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
"""


def render(subject: str, body_md: str, chip_text: str | None = None) -> str:
    title, kicker = clean_subject(subject)
    body_only = strip_headers(body_md)
    md_html = render_markdown(body_only)
    md_html = inject_styles(md_html)
    md_html = wrap_callouts(md_html)
    md_html, sig_html = signature_block(md_html)

    return TEMPLATE.format(
        title_text=html.escape(title),
        title=html.escape(title),
        kicker=html.escape(kicker),
        chip_text=html.escape(chip_text or "VYARA"),
        today=date.today().isoformat(),
        body_style=S["body"],
        container_style=S["container"],
        header_style=S["header"],
        kicker_style=S["kicker"],
        chip_style=S["chip"],
        date_style=S["date"],
        h1_style=S["h1"],
        footer_style=S["footer"],
        body_html=md_html,
        signature_html=sig_html,
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--subject", required=True)
    ap.add_argument("--body-file", required=True)
    ap.add_argument("--chip", default=None, help="Optional pill text in header band")
    ap.add_argument("--out", default=None, help="Output file (default: stdout)")
    args = ap.parse_args()

    body_md = Path(args.body_file).read_text(encoding="utf-8")
    html_out = render(args.subject, body_md, chip_text=args.chip)
    if args.out:
        Path(args.out).write_text(html_out, encoding="utf-8")
    else:
        sys.stdout.write(html_out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
