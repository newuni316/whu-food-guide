#!/usr/bin/env python3
"""从 GitHub Issue 中读取新餐厅投稿，转换为 JSON 并写入 data/restaurants/。"""

import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import date
from pathlib import Path

# 校区映射
CAMPUS_MAP = {
    "文理学部-梅园": {"campus": "wenli", "area": "梅园"},
    "文理学部-桂园": {"campus": "wenli", "area": "桂园"},
    "文理学部-枫园": {"campus": "wenli", "area": "枫园"},
    "文理学部-樱园": {"campus": "wenli", "area": "樱园"},
    "工学部": {"campus": "gongxue", "area": "工学部"},
    "信息学部": {"campus": "xinxixue", "area": "信息学部"},
    "医学部": {"campus": "yixue", "area": "医学部"},
    "广八路": {"campus": "surroundings", "area": "广八路"},
    "街道口": {"campus": "surroundings", "area": "街道口"},
}

# 拼音转换：优先使用 pypinyin 库，回退到手工映射
try:
    from pypinyin import lazy_pinyin as _lazy_pinyin
    def _pinyin_char(ch: str) -> str:
        return _lazy_pinyin(ch)[0] if _lazy_pinyin(ch) else ch
except ImportError:
    _pinyin_char = None  # type: ignore

_PINYIN_FALLBACK = {
    "梅": "mei", "园": "yuan", "小": "xiao", "厨": "chu", "桂": "gui",
    "枫": "feng", "樱": "ying", "工": "gong", "学": "xue", "信": "xin",
    "息": "xi", "医": "yi", "广": "guang", "八": "ba", "路": "lu",
    "街": "jie", "道": "dao", "口": "kou", "食": "shi", "堂": "tang",
    "饭": "fan", "面": "mian", "馆": "guan", "店": "dian", "鸡": "ji",
    "鱼": "yu", "肉": "rou", "菜": "cai", "茶": "cha", "咖": "ka",
    "啡": "fei", "烤": "kao", "炒": "chao", "煮": "zhu", "蒸": "zheng",
    "汤": "tang", "粥": "zhou", "包": "bao", "饼": "bing", "粉": "fen",
    "米": "mi", "豆": "dou", "果": "guo", "瓜": "gua", "花": "hua",
    "草": "cao", "苹": "ping", "香": "xiang", "甜": "tian", "辣": "la",
    "酸": "suan", "咸": "xian", "麻": "ma", "鲜": "xian",
    "老": "lao", "新": "xin", "大": "da", "中": "zhong", "东": "dong",
    "西": "xi", "南": "nan", "北": "bei", "红": "hong", "绿": "lv",
    "黄": "huang", "白": "bai", "黑": "hei", "金": "jin", "银": "yin",
    "王": "wang", "李": "li", "张": "zhang", "刘": "liu", "陈": "chen",
    "杨": "yang", "赵": "zhao", "周": "zhou", "吴": "wu",
    "徐": "xu", "孙": "sun", "马": "ma", "朱": "zhu", "胡": "hu",
    "郭": "guo", "何": "he", "林": "lin", "罗": "luo", "高": "gao",
    "郑": "zheng",
}

SCHEMA_PATH = Path(__file__).parent.parent / "data" / "schema.json"
RESTAURANTS_DIR = Path(__file__).parent.parent / "data" / "restaurants"


def to_slug(name: str) -> str:
    """将中文名称转换为 URL 友好的 slug。"""
    parts = []
    for ch in name:
        if _pinyin_char:
            py = _pinyin_char(ch)
            if py and py != ch:
                parts.append(py)
                continue
        if ch in _PINYIN_FALLBACK:
            parts.append(_PINYIN_FALLBACK[ch])
        elif ch.isascii() and ch.isalnum():
            parts.append(ch.lower())
        elif ch in (" ", "-", "_"):
            parts.append("-")
    slug = "-".join(parts)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "unknown"


def parse_issue_body(body: str) -> dict[str, str]:
    """解析 Issue 模板生成的 YAML-like body。"""
    data: dict[str, str] = {}
    lines = body.strip().split("\n")
    current_key: str | None = None
    current_value_lines: list[str] = []

    for line in lines:
        match = re.match(r"^### (.+)$", line)
        if match:
            if current_key is not None:
                data[current_key] = "\n".join(current_value_lines).strip()
            current_key = match.group(1).strip()
            current_value_lines = []
        elif current_key is not None:
            current_value_lines.append(line)

    if current_key is not None:
        data[current_key] = "\n".join(current_value_lines).strip()

    return data


def get_field(data: dict[str, str], *candidates: str) -> str | None:
    """尝试多个可能的字段名获取值。"""
    for key in candidates:
        if key in data and data[key]:
            return data[key].strip()
    return None


def fetch_issue(issue_number: int) -> dict:
    """通过 GitHub API 获取 Issue 内容。"""
    token = os.environ.get("GITHUB_TOKEN", "")
    repo = os.environ.get("GITHUB_REPOSITORY", "newuni316/whu-food-guide")
    url = f"https://api.github.com/repos/{repo}/issues/{issue_number}"

    headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "whu-food-guide"}
    if token:
        headers["Authorization"] = f"token {token}"

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"Error fetching issue #{issue_number}: {e.code} {e.reason}", file=sys.stderr)
        sys.exit(1)


def build_restaurant(data: dict[str, str], contributor: str = "") -> dict:
    """从解析后的表单数据构建 restaurant JSON 对象。"""
    name = get_field(data, "餐厅名称", "name", "Name") or ""
    campus_label = get_field(data, "校区/区域", "campus", "Campus") or ""
    address = get_field(data, "详细地址", "address", "Address") or ""
    price_str = get_field(data, "人均消费（元）", "人均消费", "price", "Price") or "0"
    rating_str = get_field(data, "推荐评分（1-5）", "推荐评分", "rating", "Rating") or "3"
    recs_raw = get_field(data, "推荐菜品", "recommendations", "Recommendations") or ""
    tags_raw = get_field(data, "标签", "tags", "Tags") or ""
    hours = get_field(data, "营业时间", "hours", "Hours") or ""
    phone = get_field(data, "联系电话", "phone", "Phone") or ""

    campus_info = CAMPUS_MAP.get(campus_label, {"campus": "wenli", "area": "梅园"})
    price = float(price_str) if price_str.replace(".", "").isdigit() else 0
    rating_val = float(rating_str) if rating_str.replace(".", "").isdigit() else 3

    recommendations = [line.strip() for line in recs_raw.split("\n") if line.strip()]
    tags = [t.strip() for t in tags_raw.replace("，", ",").split(",") if t.strip()]

    slug = to_slug(name)

    return {
        "name": name,
        "slug": slug,
        "campus": campus_info["campus"],
        "area": campus_info["area"],
        "category": ["其他"],
        "price_range": [price, price],
        "rating": {
            "taste": rating_val,
            "environment": rating_val,
            "value": rating_val,
        },
        "coordinates": {"lat": 30.54, "lng": 114.36},
        "address": address,
        "hours": hours,
        "phone": phone,
        "recommendations": recommendations,
        "tags": tags,
        "source": "投稿",
        "last_verified": date.today().isoformat(),
        "contributor": contributor,
    }


def validate_with_schema(restaurant: dict) -> list[str]:
    """用 schema.json 校验生成的数据，返回错误列表。"""
    if not SCHEMA_PATH.exists():
        return ["schema.json not found, skipping validation"]

    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    errors: list[str] = []

    for field in schema.get("required", []):
        if field not in restaurant:
            errors.append(f"Missing required field: {field}")

    return errors


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/add_from_issue.py <issue_number>", file=sys.stderr)
        sys.exit(1)

    try:
        issue_number = int(sys.argv[1])
    except ValueError:
        print(f"Invalid issue number: {sys.argv[1]}", file=sys.stderr)
        sys.exit(1)

    issue = fetch_issue(issue_number)
    body = issue.get("body", "")
    user = issue.get("user", {}).get("login", "")

    data = parse_issue_body(body)
    restaurant = build_restaurant(data, contributor=user)

    errors = validate_with_schema(restaurant)
    if errors:
        print("Validation errors:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)

    slug = restaurant["slug"]
    output_path = RESTAURANTS_DIR / f"{slug}.json"
    RESTAURANTS_DIR.mkdir(parents=True, exist_ok=True)

    if output_path.exists():
        print(f"Warning: {output_path} already exists, overwriting", file=sys.stderr)

    output_path.write_text(json.dumps(restaurant, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Created: {output_path}")


if __name__ == "__main__":
    main()
