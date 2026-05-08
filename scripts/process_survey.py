#!/usr/bin/env python3
"""
WHU Food Guide — Survey Data Processor
Reads data/mock_survey_data.csv and generates:
  1. VitePress-compatible .md files with YAML front-matter
  2. public/markers.json for map integration
"""

import argparse
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
    "广八路":       "surroundings/guangbalu",
}

# Location → area group key mapping
AREA_KEY_MAP = {
    "文理学部-梅园": "wenli",
    "文理学部-桂园": "wenli",
    "文理学部-枫园": "wenli",
    "文理学部-樱园": "wenli",
    "工学部":       "gongxue",
    "信息学部":     "xinxi",
    "医学部":       "yixue",
    "街道口":       "zhoubian",
    "广八路":       "zhoubian",
}

# Color palette for area groups (cycled)
COLOR_PALETTE = ["#e53935", "#1e88e5", "#43a047", "#fb8c00", "#8e24aa",
                 "#00897b", "#5e35b1", "#d81b60", "#3949ab", "#c0ca33"]

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


def parse_bool(raw) -> bool:
    """Parse various truthy values to boolean."""
    s = str(raw).strip().lower()
    return s in ("true", "1", "yes")


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
    image_url     = str(row.get("image_url", "")).strip()
    admin_added    = parse_bool(row.get("admin_added", ""))
    student_verified = parse_bool(row.get("student_verified", ""))

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
    cover = f"![封面]({image_url})\n" if image_url else ""

    # Badge HTML
    badges = ""
    if admin_added:
        badges += '<span style="background:#8e24aa;color:#fff;padding:2px 8px;border-radius:12px;font-size:12px;">管理员推荐</span> '
    if student_verified:
        badges += '<span style="background:#2e7d32;color:#fff;padding:2px 8px;border-radius:12px;font-size:12px;">学生认证</span> '
    badges_line = f"\n{badges}\n" if badges else ""

    # Feedback link
    encoded_name = name.replace(" ", "%20")
    feedback_url = f"https://github.com/newuni316/whu-food-guide/issues/new?title=纠错：{encoded_name}&body=餐厅名称：{encoded_name}%0A问题描述："

    body = f"""

{cover}# {name}

{badges_line}
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

---

> 📝 [发现这家店信息有误？点击这里反馈]({feedback_url})
"""

    return front_matter + body


# ---------------------------------------------------------------------------
# Areas JSON generation
# ---------------------------------------------------------------------------

def _generate_areas_json(df: pd.DataFrame) -> list[dict]:
    """Generate areas.json from CSV data by grouping locations."""
    # Map location → area group key
    location_to_key: dict[str, str] = {}
    for _, row in df.iterrows():
        loc = str(row.get("location", "")).strip()
        area_key = AREA_KEY_MAP.get(loc)
        if area_key and loc:
            location_to_key[loc] = area_key

    # Build groups: key → label, areas set
    group_data: dict[str, set[str]] = {}
    for loc, key in location_to_key.items():
        # Extract short area name (e.g. "文理学部-梅园" → "梅园")
        short = loc.split("-", 1)[1] if "-" in loc else loc
        group_data.setdefault(key, set()).add(short)

    # Fixed labels
    labels = {
        "wenli": "文理学部",
        "gongxue": "工学部",
        "xinxi": "信息学部",
        "yixue": "医学部",
        "zhoubian": "周边商圈",
    }

    result: list[dict] = []
    for i, key in enumerate(["wenli", "gongxue", "xinxi", "yixue", "zhoubian"]):
        if key in group_data:
            result.append({
                "key": key,
                "label": labels.get(key, key),
                "color": COLOR_PALETTE[i % len(COLOR_PALETTE)],
                "areas": sorted(group_data[key]),
            })
    return result


# ---------------------------------------------------------------------------
# Webhook handler
# ---------------------------------------------------------------------------

def handle_webhook() -> None:
    """Read a single JSON record from stdin and append to CSV."""
    data = json.load(sys.stdin)

    if not CSV_PATH.exists():
        print(f"[ERROR] CSV not found: {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(CSV_PATH, dtype=str, keep_default_na=False)

    # Build a new row from JSON keys matching CSV columns
    new_row: dict[str, str] = {}
    for col in df.columns:
        val = data.get(col, "")
        new_row[col] = str(val) if val is not None else ""

    # Append to CSV
    new_df = pd.DataFrame([new_row])
    new_df.to_csv(CSV_PATH, mode="a", header=False, index=False)
    print(f"[OK] Appended record: {new_row.get('store_name', '(unknown)')}")


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
            image_url_val = str(row.get("image_url", "")).strip()
            admin_added_val = parse_bool(row.get("admin_added", ""))
            student_verified_val = parse_bool(row.get("student_verified", ""))
            marker_entry: dict = {
                "name":           name,
                "location":       location,
                "area":           str(row.get("area", "")).strip(),
                "rating":         float(row.get("rating", 0)),
                "avg_price":      float(row.get("avg_price", 0)),
                "tags":           tags_list,
                "recommendation": str(row.get("recommendation", "")).strip(),
                "lat":            coord["lat"],
                "lng":            coord["lng"],
            }
            if image_url_val:
                marker_entry["image_url"] = image_url_val
            if admin_added_val:
                marker_entry["admin_added"] = True
            if student_verified_val:
                marker_entry["student_verified"] = True
            markers.append(marker_entry)

    # 5. Write markers.json
    ensure_dir(PUBLIC_DIR)
    markers.sort(key=lambda m: m["rating"], reverse=True)
    markers_path = PUBLIC_DIR / "markers.json"
    markers_path.write_text(
        json.dumps(markers, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    generated.append(str(markers_path.relative_to(PROJECT_ROOT)))

    # 6. Generate areas.json from CSV data
    areas_json = _generate_areas_json(df)
    areas_path = PUBLIC_DIR / "areas.json"
    areas_path.write_text(
        json.dumps(areas_json, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    generated.append(str(areas_path.relative_to(PROJECT_ROOT)))

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
    parser = argparse.ArgumentParser(description="WHU Food Guide — Survey Data Processor")
    parser.add_argument("--webhook", action="store_true",
                        help="Read a single JSON record from stdin and append to CSV")
    args = parser.parse_args()

    if args.webhook:
        handle_webhook()
    else:
        main()
