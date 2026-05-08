#!/usr/bin/env python3
"""
WHU Food Guide — Survey Data Processor
Reads data/mock_survey_data.csv and generates:
  1. VitePress-compatible .md files with YAML front-matter
  2. public/markers.json for map integration
"""

import os
import re
import json
import sys
from pathlib import Path

import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = PROJECT_ROOT / "data" / "mock_survey_data.csv"
DOCS_DIR = PROJECT_ROOT / "docs"
PUBLIC_DIR = DOCS_DIR / "public"

# Map Chinese location names → relative doc paths (under docs/)
LOCATION_MAP = {
    "文理学部-梅园": "wenli/meiyuan",
    "文理学部-桂园": "wenli/guiyuan",
    "文理学部-枫园": "wenli/fengyuan",
    "文理学部-樱园": "wenli/yingyuan",
    "工学部":       "gongxue",
    "信息学部":     "xinxixue",
    "医学部":       "yixue",
    "街道口":       "surroundings/jiedaokou",
    "广埠屯":       "surroundings/guangbutun",
    "八一路":       "surroundings/bayilu",
}

# Regex for YAML-unsafe characters in unquoted scalar values
YAML_UNSAFE = re.compile(r'[:{}\[\],&*?|>!%@`\'"#\n\r]')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def yaml_quote(value: str) -> str:
    """Return a YAML-safe representation of *value* (always double-quoted)."""
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def parse_coordinates(raw: str) -> dict | None:
    """Parse 'lat/lng' string → {"lat": float, "lng": float} or None."""
    raw = str(raw).strip()
    if not raw or raw.lower() in ("nan", "none", ""):
        return None
    parts = raw.split("/")
    if len(parts) != 2:
        return None
    try:
        return {"lat": float(parts[0]), "lng": float(parts[1])}
    except ValueError:
        return None


def rating_stars(rating: float) -> str:
    """Numeric rating → emoji star string."""
    full = int(rating)
    half = 1 if (rating - full) >= 0.3 else 0
    return "⭐" * full + ("✨" if half else "")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def to_filename(name: str, idx: int) -> str:
    """
    Convert a store name to a safe filename slug.
    Preserves Chinese characters, strips punctuation.
    """
    slug = re.sub(r'[^\w\u4e00-\u9fff-]', '', name)
    return slug if slug else f"restaurant-{idx}"


# ---------------------------------------------------------------------------
# Markdown generation
# ---------------------------------------------------------------------------

def build_markdown(row: pd.Series, idx: int) -> str:
    """Generate a VitePress-compatible .md file with YAML front-matter."""
    name          = str(row.get("store_name", "")).strip()
    location      = str(row.get("location", "")).strip()
    area          = str(row.get("area", "")).strip()
    rating        = float(row.get("rating", 0))
    tags_raw      = str(row.get("tags", "")).strip()
    recommendation = str(row.get("recommendation", "")).strip()
    review        = str(row.get("review", "")).strip()
    avg_price     = row.get("avg_price", 0)
    coord         = parse_coordinates(str(row.get("coordinates", "")))

    # Parse tags (comma-separated inside CSV quotes)
    tags_list = [t.strip() for t in tags_raw.split(",") if t.strip()]
    tags_yaml = "\n".join(f"  - {yaml_quote(t)}" for t in tags_list) or "  - \"未分类\""

    # YAML-safe numeric fields
    try:
        avg_price_val = float(avg_price)
    except (ValueError, TypeError):
        avg_price_val = 0.0

    coord_yaml = (
        f"  lat: {coord['lat']}\n  lng: {coord['lng']}"
        if coord
        else "  lat: 0\n  lng: 0"
    )

    # ---- Front-matter ----
    front_matter = f"""---
title: {yaml_quote(name)}
location: {yaml_quote(location)}
area: {yaml_quote(area)}
rating: {rating}
tags:
{tags_yaml}
recommendation: {yaml_quote(recommendation)}
avg_price: {avg_price_val}
coordinates:
{coord_yaml}
---"""

    # ---- Body ----
    body = f"""

# {name}

{rating_stars(rating)} **{rating}** / 5.0 · 📍 {location}

---

## 推荐菜品

> **{recommendation}**

## 评价

{review if review else "暂无评价"}

## 消费信息

| 项目 | 详情 |
|------|------|
| 💰 人均消费 | ¥{avg_price_val:.0f} |
| 📍 位置 | {location} |
| 🏷️ 标签 | {', '.join(tags_list)} |
"""

    return front_matter + body


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    # 1. Read CSV
    if not CSV_PATH.exists():
        print(f"[ERROR] CSV not found: {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Reading survey data from {CSV_PATH} ...")
    df = pd.read_csv(CSV_PATH, dtype=str, keep_default_na=False)

    # 2. Sanitize
    print("[INFO] Sanitizing data ...")
    for col in df.columns:
        df[col] = df[col].astype(str).str.strip()
    df.replace({"nan": "", "NaN": "", "None": "", "null": ""}, inplace=True)
    df["rating"]    = pd.to_numeric(df["rating"],    errors="coerce").fillna(0.0)
    df["avg_price"] = pd.to_numeric(df["avg_price"], errors="coerce").fillna(0.0)

    # 3. Sort by rating descending
    df.sort_values("rating", ascending=False, inplace=True)
    df.reset_index(drop=True, inplace=True)

    # 4. Generate markdown files
    generated: list[str] = []
    markers:  list[dict] = []

    for idx, row in df.iterrows():
        location = str(row.get("location", "")).strip()
        name     = str(row.get("store_name", "")).strip()

        rel_dir = LOCATION_MAP.get(location)
        if not rel_dir:
            print(f"  [WARN] Unknown location '{location}' for '{name}', skipped.")
            continue

        out_dir = DOCS_DIR / rel_dir
        ensure_dir(out_dir)

        slug     = to_filename(name, idx)
        out_file = out_dir / f"{slug}.md"

        out_file.write_text(build_markdown(row, idx), encoding="utf-8")
        generated.append(str(out_file.relative_to(PROJECT_ROOT)))

        # Marker entry
        coord = parse_coordinates(str(row.get("coordinates", "")))
        if coord:
            tags_list = [t.strip() for t in str(row.get("tags", "")).split(",") if t.strip()]
            markers.append({
                "name":           name,
                "location":       location,
                "area":           str(row.get("area", "")).strip(),
                "rating":         float(row.get("rating", 0)),
                "avg_price":      float(row.get("avg_price", 0)),
                "tags":           tags_list,
                "recommendation": str(row.get("recommendation", "")).strip(),
                "lat":            coord["lat"],
                "lng":            coord["lng"],
            })

    # 5. Write markers.json
    ensure_dir(PUBLIC_DIR)
    markers.sort(key=lambda m: m["rating"], reverse=True)
    markers_path = PUBLIC_DIR / "markers.json"
    markers_path.write_text(
        json.dumps(markers, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    generated.append(str(markers_path.relative_to(PROJECT_ROOT)))

    # 6. Report
    print()
    print("=" * 62)
    print("  WHU Food Guide — Data Processing Complete")
    print("=" * 62)
    print(f"  📄  Survey records processed : {len(df)}")
    print(f"  📝  Markdown files generated  : {len(generated) - 1}")
    print(f"  🗺️   Markers written           : {len(markers)}")
    print("-" * 62)
    for f in generated:
        print(f"  ✅ {f}")
    print("=" * 62)


if __name__ == "__main__":
    main()
