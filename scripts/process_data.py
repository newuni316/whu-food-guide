#!/usr/bin/env python3
"""
WHU Food Guide — Structured Data Processor
Reads data/restaurants/*.json, validates against data/schema.json, and generates:
  1. docs/public/markers.json — map markers
  2. docs/.vitepress/theme/data/restaurants.json — frontend filter data
  3. Per-restaurant Markdown pages under docs/
  4. Updated area index.md files with restaurant listings
"""

import argparse
import json
import math
import os
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    print("[ERROR] jsonschema 库未安装，请运行: pip install jsonschema", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RESTAURANTS_DIR = DATA_DIR / "restaurants"
SCHEMA_PATH = DATA_DIR / "schema.json"
DOCS_DIR = PROJECT_ROOT / "docs"
PUBLIC_DIR = DOCS_DIR / "public"
THEME_DATA_DIR = DOCS_DIR / ".vitepress" / "theme" / "data"

# campus/area → relative doc directory under docs/
AREA_DOC_MAP = {
    ("wenli", "梅园"): "wenli/meiyuan",
    ("wenli", "桂园"): "wenli/guiyuan",
    ("wenli", "枫园"): "wenli/fengyuan",
    ("wenli", "樱园"): "wenli/yingyuan",
    ("gongxue", "工学部"): "gongxue",
    ("xinxixue", "信息学部"): "xinxixue",
    ("yixue", "医学部"): "yixue",
    ("surroundings", "广八路"): "surroundings/guangbalu",
    ("surroundings", "街道口"): "surroundings/jiedaokou",
}

# Area index files that need restaurant listings appended
AREA_INDEX_MAP = {
    "wenli/meiyuan": DOCS_DIR / "wenli" / "meiyuan" / "index.md",
    "wenli/guiyuan": DOCS_DIR / "wenli" / "guiyuan" / "index.md",
    "wenli/fengyuan": DOCS_DIR / "wenli" / "fengyuan" / "index.md",
    "wenli/yingyuan": DOCS_DIR / "wenli" / "yingyuan" / "index.md",
    "gongxue": DOCS_DIR / "gongxue" / "index.md",
    "xinxixue": DOCS_DIR / "xinxixue" / "index.md",
    "yixue": DOCS_DIR / "yixue" / "index.md",
    "surroundings/guangbalu": DOCS_DIR / "surroundings" / "guangbalu" / "index.md",
    "surroundings/jiedaokou": DOCS_DIR / "surroundings" / "jiedaokou" / "index.md",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def load_restaurants() -> list[dict]:
    """Load all restaurant JSON files (excluding template.json)."""
    restaurants = []
    for f in sorted(RESTAURANTS_DIR.glob("*.json")):
        if f.name == "template.json":
            continue
        with open(f, encoding="utf-8") as fh:
            restaurants.append(json.load(fh))
    return restaurants


def validate_restaurants(restaurants: list[dict], schema: dict) -> list[str]:
    """Validate all restaurants against schema. Returns list of error strings."""
    errors = []
    for r in restaurants:
        name = r.get("name", "(unknown)")
        try:
            jsonschema.validate(instance=r, schema=schema)
        except jsonschema.ValidationError as e:
            errors.append(f"[{name}] {e.message}")
        except jsonschema.SchemaError as e:
            errors.append(f"[Schema Error] {e.message}")
    return errors


def avg_price(r: dict) -> int:
    """Calculate average price from price_range."""
    pr = r.get("price_range", [0, 0])
    return round((pr[0] + pr[1]) / 2) if len(pr) == 2 else 0


def rating_stars(rating: float) -> str:
    full = int(rating)
    half = 1 if (rating - full) >= 0.3 else 0
    return "★" * full + ("☆" if half else "")


# ---------------------------------------------------------------------------
# Generate markers.json
# ---------------------------------------------------------------------------

def generate_markers(restaurants: list[dict]) -> list[dict]:
    """Generate markers list for WHUMap.vue consumption."""
    markers = []
    for r in restaurants:
        coord = r.get("coordinates", {})
        rating_obj = r.get("rating", {})
        taste = rating_obj.get("taste", 0)
        area = r.get("area", "")
        campus = r.get("campus", "")

        # Reconstruct location string for WHUMap compatibility
        location = area
        if campus == "wenli":
            location = f"文理学部-{area}"

        marker = {
            "name": r.get("name", ""),
            "lat": coord.get("lat", 0),
            "lng": coord.get("lng", 0),
            "rating": taste,
            "tags": r.get("tags", []),
            "location": location,
            "area": area,
            "avg_price": avg_price(r),
            "recommendation": "、".join(r.get("recommendations", [])),
            "image_url": (r.get("images", [""])[0] if r.get("images") else ""),
            "admin_added": False,
            "student_verified": False,
        }
        markers.append(marker)

    markers.sort(key=lambda m: m["rating"], reverse=True)
    return markers


# ---------------------------------------------------------------------------
# Generate restaurants.json (frontend filter data)
# ---------------------------------------------------------------------------

def generate_restaurants_json(restaurants: list[dict]) -> list[dict]:
    """Generate full restaurant data for frontend filtering."""
    result = []
    for r in restaurants:
        rating_obj = r.get("rating", {})
        coord = r.get("coordinates", {})
        area = r.get("area", "")
        campus = r.get("campus", "")

        location = area
        if campus == "wenli":
            location = f"文理学部-{area}"

        entry = {
            "name": r.get("name", ""),
            "slug": r.get("slug", ""),
            "campus": campus,
            "area": area,
            "location": location,
            "category": r.get("category", []),
            "price_range": r.get("price_range", [0, 0]),
            "avg_price": avg_price(r),
            "rating": {
                "taste": rating_obj.get("taste", 0),
                "environment": rating_obj.get("environment", 0),
                "value": rating_obj.get("value", 0),
            },
            "coordinates": {
                "lat": coord.get("lat", 0),
                "lng": coord.get("lng", 0),
            },
            "address": r.get("address", ""),
            "hours": r.get("hours", ""),
            "phone": r.get("phone", ""),
            "recommendations": r.get("recommendations", []),
            "tags": r.get("tags", []),
            "review": r.get("review", ""),
            "source": r.get("source", ""),
            "last_verified": r.get("last_verified", ""),
            "contributor": r.get("contributor", ""),
        }
        result.append(entry)

    result.sort(key=lambda x: x["rating"]["taste"], reverse=True)
    return result


# ---------------------------------------------------------------------------
# Generate per-restaurant Markdown
# ---------------------------------------------------------------------------

def generate_markdown(r: dict) -> str:
    """Generate VitePress-compatible Markdown for a restaurant."""
    name = r.get("name", "")
    area = r.get("area", "")
    campus = r.get("campus", "")
    rating_obj = r.get("rating", {})
    taste = rating_obj.get("taste", 0)
    env = rating_obj.get("environment", 0)
    val = rating_obj.get("value", 0)
    recommendations = r.get("recommendations", [])
    tags = r.get("tags", [])
    review = r.get("review", "")
    address = r.get("address", "")
    hours = r.get("hours", "")
    price = avg_price(r)
    slug = r.get("slug", "")

    location = area
    if campus == "wenli":
        location = f"文理学部-{area}"

    rec_display = "、".join(recommendations[:2]) if recommendations else ""

    lines = [
        "---",
        f"title: {name}",
        f'description: {name} - {area}美食推荐',
        "---",
        "",
        f"# {name}",
        "",
    ]

    if rec_display:
        lines.append(f"> {rec_display}")
        lines.append("")

    lines.extend([
        f"- 📍 地址：{address}",
        f"- ⏰ 营业时间：{hours}",
        f"- 💰 人均：¥{price}",
        f"- ⭐ 口味 {taste} / 环境 {env} / 性价比 {val}",
        "",
        "## 推荐菜品",
        "",
    ])

    for rec in recommendations:
        lines.append(f"- {rec}")

    lines.extend(["", "## 标签", ""])

    for tag in tags:
        lines.append(f"- {tag}")

    if review:
        lines.extend(["", review, ""])

    # Feedback link
    encoded_name = name.replace(" ", "%20")
    feedback_url = (
        f"https://github.com/newuni316/whu-food-guide/issues/new"
        f"?title=纠错：{encoded_name}&body=餐厅名称：{encoded_name}%0A问题描述："
    )
    lines.extend([
        "",
        f"> 📝 [发现这家店信息有误？点击这里反馈]({feedback_url})",
        "",
    ])

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Update area index.md files
# ---------------------------------------------------------------------------

def update_area_indexes(restaurants: list[dict]) -> list[str]:
    """Update each area's index.md with restaurant listing links."""
    # Group restaurants by doc path
    groups: dict[str, list[dict]] = {}
    for r in restaurants:
        campus = r.get("campus", "")
        area = r.get("area", "")
        doc_path = AREA_DOC_MAP.get((campus, area))
        if doc_path:
            groups.setdefault(doc_path, []).append(r)

    updated = []
    for doc_path, rests in groups.items():
        index_path = AREA_INDEX_MAP.get(doc_path)
        if not index_path or not index_path.exists():
            continue

        content = index_path.read_text(encoding="utf-8")

        # Find the marker line and replace everything after it
        marker = "::: tip\n以下餐厅按评分排序，点击查看详情。\n:::"
        if marker not in content:
            # For non-standard index files (gongxue, xinxixue, yixue), add listing
            if "## 各区域美食" in content:
                # Append after the section header
                parts = content.split("## 各区域美食")
                listing_lines = []
                rests.sort(key=lambda x: x.get("rating", {}).get("taste", 0), reverse=True)
                for r in rests:
                    name = r.get("name", "")
                    slug = r.get("slug", "")
                    taste = r.get("rating", {}).get("taste", 0)
                    rec = "、".join(r.get("recommendations", [])[:2])
                    listing_lines.append(
                        f"- [{name}](./{slug}.md) — ⭐{taste} · {rec}"
                    )
                new_content = parts[0] + "## 各区域美食\n\n" + "\n".join(listing_lines) + "\n"
                index_path.write_text(new_content, encoding="utf-8")
                updated.append(str(index_path.relative_to(PROJECT_ROOT)))
            continue

        # For standard index files with ::: tip marker
        rests.sort(key=lambda x: x.get("rating", {}).get("taste", 0), reverse=True)
        listing_lines = []
        for r in rests:
            name = r.get("name", "")
            slug = r.get("slug", "")
            taste = r.get("rating", {}).get("taste", 0)
            price = avg_price(r)
            rec = "、".join(r.get("recommendations", [])[:2])
            listing_lines.append(
                f"- [{name}](./{slug}.md) — ⭐{taste} · ¥{price} · {rec}"
            )

        # Split at marker and append listing
        idx = content.index(marker) + len(marker)
        new_content = content[:idx] + "\n\n" + "\n".join(listing_lines) + "\n"
        index_path.write_text(new_content, encoding="utf-8")
        updated.append(str(index_path.relative_to(PROJECT_ROOT)))

    return updated


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(validate_only: bool = False) -> None:
    # 1. Load schema
    if not SCHEMA_PATH.exists():
        print(f"[ERROR] Schema not found: {SCHEMA_PATH}", file=sys.stderr)
        sys.exit(1)

    with open(SCHEMA_PATH, encoding="utf-8") as f:
        schema = json.load(f)

    # 2. Load restaurants
    if not RESTAURANTS_DIR.exists():
        print(f"[ERROR] Restaurants directory not found: {RESTAURANTS_DIR}", file=sys.stderr)
        sys.exit(1)

    restaurants = load_restaurants()
    if not restaurants:
        print("[ERROR] No restaurant JSON files found", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Loaded {len(restaurants)} restaurant records")

    # 3. Validate
    print("[INFO] Validating against schema ...")
    errors = validate_restaurants(restaurants, schema)
    if errors:
        print(f"\n[ERROR] Validation failed with {len(errors)} error(s):", file=sys.stderr)
        for e in errors:
            print(f"  ✗ {e}", file=sys.stderr)
        sys.exit(1)

    print("[OK] All records passed schema validation")

    if validate_only:
        print("[OK] Validate-only mode — skipping generation")
        return

    # 4. Generate outputs
    generated: list[str] = []

    # 4a. markers.json
    ensure_dir(PUBLIC_DIR)
    markers = generate_markers(restaurants)
    markers_path = PUBLIC_DIR / "markers.json"
    markers_path.write_text(
        json.dumps(markers, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    generated.append(str(markers_path.relative_to(PROJECT_ROOT)))

    # 4b. Per-restaurant Markdown pages
    for r in restaurants:
        campus = r.get("campus", "")
        area = r.get("area", "")
        slug = r.get("slug", "")
        doc_rel = AREA_DOC_MAP.get((campus, area))
        if not doc_rel:
            print(f"  [WARN] Unknown campus/area for '{r.get('name')}', skipped")
            continue

        out_dir = DOCS_DIR / doc_rel
        ensure_dir(out_dir)
        md_path = out_dir / f"{slug}.md"
        md_path.write_text(generate_markdown(r), encoding="utf-8")
        generated.append(str(md_path.relative_to(PROJECT_ROOT)))

    # 4c. Frontend filter data
    ensure_dir(THEME_DATA_DIR)
    restaurants_json = generate_restaurants_json(restaurants)
    rj_path = THEME_DATA_DIR / "restaurants.json"
    rj_path.write_text(
        json.dumps(restaurants_json, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    generated.append(str(rj_path.relative_to(PROJECT_ROOT)))

    # 4d. Update area index.md files
    updated_indexes = update_area_indexes(restaurants)
    generated.extend(updated_indexes)

    # 5. Report
    print()
    print("=" * 62)
    print("  WHU Food Guide — Data Processing Complete")
    print("=" * 62)
    print(f"  📄  Restaurant records processed : {len(restaurants)}")
    print(f"  🗺️   Markers written              : {len(markers)}")
    print(f"  📝  Files generated/updated       : {len(generated)}")
    print("-" * 62)
    for f in generated:
        print(f"  ✅ {f}")
    print("=" * 62)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="WHU Food Guide — Structured Data Processor"
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate data, do not generate output files",
    )
    args = parser.parse_args()
    main(validate_only=args.validate_only)
