#!/usr/bin/env python3
"""
generate_school_colors_full.py

Takes a JSON array of schools and appends a "colors" field to each entry.

Example output element:
{
  "name": "Rend Lake College",
  "state": "Illinois",
  "lat": 38.13148101100006,
  "lng": -88.91828310799997,
  "population": 2101,
  "domains": ["rlc.edu"],
  "colors": ["#FF0000", "#FFFFFF"]
}
"""

import json
import os
import re
import argparse
import requests
from bs4 import BeautifulSoup

HEX_COLOR = re.compile(r"#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b")


def normalize_hex(h: str):
    if not h:
        return None
    h = h.strip()
    if not h.startswith("#"):
        return None
    s = h[1:]
    if len(s) == 3:
        s = "".join([c * 2 for c in s])
    if len(s) != 6:
        return None
    try:
        int(s, 16)
    except ValueError:
        return None
    return "#" + s.upper()


def extract_colors_from_text(text: str):
    colors = []
    for m in HEX_COLOR.finditer(text):
        colors.append("#" + m.group(1).upper())
    return colors


def fetch_colors_from_domain(domain: str, timeout: float = 2.0):
    colors_found = []
    try:
        for scheme in ["https://", "http://"]:
            url = scheme + domain
            try:
                resp = requests.get(url, timeout=timeout, allow_redirects=True)
            except requests.RequestException:
                continue
            if resp.status_code >= 400:
                continue

            soup = BeautifulSoup(resp.text, "html.parser")

            # meta[name="theme-color"]
            m = soup.find("meta", attrs={"name": "theme-color"})
            if m and m.get("content"):
                colors_found.append(normalize_hex(m["content"]))

            # any hex codes in HTML
            colors_found.extend(
                [
                    normalize_hex(c)
                    for c in extract_colors_from_text(resp.text)
                    if normalize_hex(c)
                ]
            )

            # inline styles
            for tag in soup.find_all(style=True):
                colors_found.extend(
                    [
                        normalize_hex(c)
                        for c in extract_colors_from_text(tag.get("style", ""))
                        if normalize_hex(c)
                    ]
                )
            break
    except Exception:
        pass

    colors_seen = []
    for c in colors_found:
        if c and c not in colors_seen:
            colors_seen.append(c)

    if not colors_seen:
        return []
    if len(colors_seen) >= 2:
        return colors_seen[:2]
    else:
        return colors_seen[:1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-i", "--input", required=True, help="Input JSON file of schools array"
    )
    parser.add_argument(
        "-o",
        "--output",
        required=True,
        help="Output JSON file with added colors field",
    )
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        schools = json.load(f)

    result = []
    for i, entry in enumerate(schools, 1):
        name = entry.get("name", "").strip()
        domains = entry.get("domains", [])
        domain = domains[0] if domains else None

        print(
            f"[{i}/{len(schools)}] Processing {name}..."
            f" ({domain if domain else 'no domain'})",
            flush=True,
        )

        colors = ["#888888", "#BBBBBB"]  # default placeholders

        if domain:
            fetched = fetch_colors_from_domain(domain)
            if fetched and len(fetched) >= 2:
                colors = fetched[:2]
            elif fetched and len(fetched) == 1:
                colors = [fetched[0], "#BBBBBB"]

        # Copy original entry, add colors
        updated_entry = dict(entry)
        updated_entry["colors"] = colors
        result.append(updated_entry)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Output written to {args.output}")


if __name__ == "__main__":
    main()