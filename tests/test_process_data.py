#!/usr/bin/env python3
"""Tests for scripts/process_data.py — validates JSON processing, schema validation, and marker generation."""

import json
import sys
from pathlib import Path

import pytest

# Add scripts dir to path so we can import process_data
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from process_data import (
    avg_price,
    generate_markers,
    generate_restaurants_json,
    rating_stars,
    validate_restaurants,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = PROJECT_ROOT / "data" / "schema.json"


@pytest.fixture
def schema() -> dict:
    with open(SCHEMA_PATH, encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def valid_restaurant() -> dict:
    return {
        "name": "测试餐厅",
        "slug": "test-restaurant",
        "campus": "wenli",
        "area": "梅园",
        "category": ["中餐"],
        "price_range": [15, 30],
        "rating": {"taste": 4.5, "environment": 4.0, "value": 4.2},
        "coordinates": {"lat": 30.538, "lng": 114.367},
        "address": "武汉市武昌区珞珈山路",
        "hours": "10:00-22:00",
        "phone": "027-12345678",
        "recommendations": ["红烧肉", "宫保鸡丁"],
        "tags": ["实惠", "好吃"],
        "source": "问卷",
        "last_verified": "2025-01-01",
        "contributor": "test_user",
    }


@pytest.fixture
def invalid_restaurant() -> dict:
    """Missing required fields and invalid values."""
    return {
        "name": "无效餐厅",
        # missing slug, campus, area, etc.
        "rating": {"taste": 6.0, "environment": 0, "value": 0},
    }


# --- Schema validation tests ---


class TestValidation:
    def test_valid_restaurant_passes(self, schema, valid_restaurant):
        errors = validate_restaurants([valid_restaurant], schema)
        assert errors == []

    def test_invalid_restaurant_fails(self, schema, invalid_restaurant):
        errors = validate_restaurants([invalid_restaurant], schema)
        assert len(errors) > 0

    def test_missing_required_field(self, schema, valid_restaurant):
        del valid_restaurant["name"]
        errors = validate_restaurants([valid_restaurant], schema)
        assert len(errors) > 0

    def test_invalid_campus_enum(self, schema, valid_restaurant):
        valid_restaurant["campus"] = "invalid_campus"
        errors = validate_restaurants([valid_restaurant], schema)
        assert len(errors) > 0

    def test_invalid_area_enum(self, schema, valid_restaurant):
        valid_restaurant["area"] = "不存在的区域"
        errors = validate_restaurants([valid_restaurant], schema)
        assert len(errors) > 0

    def test_rating_out_of_range(self, schema, valid_restaurant):
        valid_restaurant["rating"]["taste"] = 10
        errors = validate_restaurants([valid_restaurant], schema)
        assert len(errors) > 0

    def test_invalid_slug_pattern(self, schema, valid_restaurant):
        valid_restaurant["slug"] = "INVALID SLUG!"
        errors = validate_restaurants([valid_restaurant], schema)
        assert len(errors) > 0

    def test_empty_category_array(self, schema, valid_restaurant):
        valid_restaurant["category"] = []
        errors = validate_restaurants([valid_restaurant], schema)
        assert len(errors) > 0

    def test_multiple_restaurants_mixed(self, schema, valid_restaurant, invalid_restaurant):
        errors = validate_restaurants([valid_restaurant, invalid_restaurant], schema)
        assert len(errors) > 0

    def test_empty_restaurants_list(self, schema):
        errors = validate_restaurants([], schema)
        assert errors == []


# --- Marker generation tests ---


class TestMarkerGeneration:
    def test_marker_has_required_fields(self, valid_restaurant):
        markers = generate_markers([valid_restaurant])
        assert len(markers) == 1
        m = markers[0]
        assert m["name"] == "测试餐厅"
        assert m["lat"] == 30.538
        assert m["lng"] == 114.367
        assert m["rating"] == 4.5
        assert m["tags"] == ["实惠", "好吃"]
        assert m["area"] == "梅园"
        assert m["avg_price"] == 22

    def test_markers_sorted_by_rating(self, valid_restaurant):
        r2 = {**valid_restaurant, "name": "低分餐厅", "rating": {"taste": 2.0, "environment": 2.0, "value": 2.0}}
        markers = generate_markers([valid_restaurant, r2])
        assert markers[0]["rating"] >= markers[1]["rating"]

    def test_marker_location_wenli_format(self, valid_restaurant):
        markers = generate_markers([valid_restaurant])
        assert markers[0]["location"] == "文理学部-梅园"

    def test_marker_location_non_wenli(self, valid_restaurant):
        valid_restaurant["campus"] = "gongxue"
        valid_restaurant["area"] = "工学部"
        markers = generate_markers([valid_restaurant])
        assert markers[0]["location"] == "工学部"

    def test_marker_recommendation_joined(self, valid_restaurant):
        markers = generate_markers([valid_restaurant])
        assert markers[0]["recommendation"] == "红烧肉、宫保鸡丁"


# --- Restaurants JSON generation tests ---


class TestRestaurantsJson:
    def test_output_has_all_fields(self, valid_restaurant):
        result = generate_restaurants_json([valid_restaurant])
        assert len(result) == 1
        r = result[0]
        assert r["name"] == "测试餐厅"
        assert r["slug"] == "test-restaurant"
        assert r["campus"] == "wenli"
        assert r["area"] == "梅园"
        assert r["avg_price"] == 22
        assert r["rating"]["taste"] == 4.5

    def test_sorted_by_taste_rating(self, valid_restaurant):
        r2 = {**valid_restaurant, "name": "低分", "rating": {"taste": 2.0, "environment": 3.0, "value": 3.0}}
        result = generate_restaurants_json([valid_restaurant, r2])
        assert result[0]["rating"]["taste"] >= result[1]["rating"]["taste"]


# --- Helper function tests ---


class TestHelpers:
    def test_avg_price(self):
        assert avg_price({"price_range": [10, 20]}) == 15

    def test_avg_price_empty(self):
        assert avg_price({}) == 0

    def test_avg_price_single(self):
        assert avg_price({"price_range": [10]}) == 0

    def test_rating_stars_full(self):
        assert rating_stars(4.0) == "★★★★"

    def test_rating_stars_with_half(self):
        stars = rating_stars(3.5)
        assert "★" in stars
